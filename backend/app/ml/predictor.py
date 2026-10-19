"""
Model Predictor and Interpretability Engine for SENTINEL AI.
Loads the trained pipeline and computes exact token-level log-odds attributions.
"""

import os
import joblib
import numpy as np
from typing import Tuple, List, Dict, Any, Optional
from ..core.config import settings


class SentinelPredictor:
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or settings.MODEL_PATH
        self.pipeline = None
        self.vectorizer = None
        self.classifier = None
        self.feature_names = None
        self.coef = None
        self.intercept = 0.0
        self.is_loaded = False
        self.load_error = None
        self._load_model()

    def _load_model(self):
        try:
            if not os.path.exists(self.model_path):
                self.load_error = f"Model artifact not found at {self.model_path}"
                self.is_loaded = False
                return

            self.pipeline = joblib.load(self.model_path)
            self.vectorizer = self.pipeline.named_steps["tfidf"]
            self.classifier = self.pipeline.named_steps["classifier"]
            self.feature_names = np.array(self.vectorizer.get_feature_names_out())
            self.coef = self.classifier.coef_[0]
            self.intercept = float(self.classifier.intercept_[0])
            self.is_loaded = True
            self.load_error = None
            print(f"[SENTINEL ML] Successfully loaded model from {self.model_path}")
        except Exception as e:
            self.load_error = str(e)
            self.is_loaded = False
            print(f"[SENTINEL ML ERROR] Failed to load model: {e}")

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Run inference on input text.
        Returns prediction, probability, confidence, and exact token attributions.
        """
        if not self.is_loaded or self.pipeline is None:
            return {
                "prediction": "UNKNOWN",
                "spam_probability": None,
                "confidence": 0.0,
                "attributions": [],
                "error": self.load_error or "Model is not loaded"
            }

        # Predict probability
        proba = self.pipeline.predict_proba([text])[0]
        # Class 1 is spam, Class 0 is ham
        spam_prob = float(proba[1])
        ham_prob = float(proba[0])

        pred_label = "SPAM" if spam_prob >= 0.5 else "HAM"
        confidence = float(max(spam_prob, ham_prob))

        # Explainable token attributions
        # For linear models: contribution_i = coef_i * tfidf_i
        tfidf_vec = self.vectorizer.transform([text])
        nonzero_indices = tfidf_vec.nonzero()[1]

        attributions: List[Dict[str, Any]] = []
        for idx in nonzero_indices:
            token = str(self.feature_names[idx])
            tfidf_val = float(tfidf_vec[0, idx])
            weight = float(self.coef[idx])
            contribution = weight * tfidf_val

            attributions.append({
                "token": token,
                "contribution": round(contribution, 4),
                "direction": "spam" if contribution > 0 else "ham",
                "weight": round(weight, 4),
                "tfidf_val": round(tfidf_val, 4)
            })

        # Sort attributions: most spam-inducing first, then most ham-inducing
        attributions.sort(key=lambda x: x["contribution"], reverse=True)

        return {
            "prediction": pred_label,
            "spam_probability": round(spam_prob, 4),
            "confidence": round(confidence, 4),
            "attributions": attributions,
            "error": None
        }


# Global singleton instance
predictor = SentinelPredictor()
