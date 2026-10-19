"""
Model training and evaluation pipeline for SENTINEL AI.
Builds a reproducible scikit-learn text classification pipeline with TF-IDF and Logistic Regression,
evaluates on a stratified held-out test set, and exports model artifacts and genuine metrics.
"""

import os
import sys
import json
import datetime
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

PROCESSED_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "sms_spam_clean.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "sentinel_model.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "evaluation_report.json")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

RANDOM_STATE = 42
TEST_SIZE = 0.20


def train_and_evaluate():
    os.makedirs(MODELS_DIR, exist_ok=True)

    if not os.path.exists(PROCESSED_DATA_PATH):
        raise FileNotFoundError(f"Clean data not found at {PROCESSED_DATA_PATH}. Run prepare_data.py first.")

    print(f"[INFO] Loading dataset from {PROCESSED_DATA_PATH}...")
    df = pd.read_csv(PROCESSED_DATA_PATH)
    
    # Text and labels
    X = df["text"].astype(str).values
    # Binary target: 1 = spam, 0 = ham
    y = (df["label"] == "spam").astype(int).values

    print(f"[INFO] Total samples: {len(X)} (Spam: {y.sum()}, Ham: {len(y) - y.sum()})")

    # Stratified Train/Test split to avoid data leakage
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y
    )

    print(f"[INFO] Train samples: {len(X_train)} (Spam: {y_train.sum()}, Ham: {len(y_train) - y_train.sum()})")
    print(f"[INFO] Test samples:  {len(X_test)} (Spam: {y_test.sum()}, Ham: {len(y_test) - y_test.sum()})")

    # Build Pipeline: TF-IDF + Logistic Regression with class-balanced weights
    # Sublinear tf scaling reduces impact of repetition; ngram_range (1, 2) captures phrases like 'call now', 'claim prize'
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.95,
            sublinear_tf=True,
            strip_accents="unicode",
            lowercase=True,
            token_pattern=r"(?u)\b\w+\b"
        )),
        ("classifier", LogisticRegression(
            C=4.0,
            max_iter=1000,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            solver="lbfgs"
        ))
    ])

    print("[INFO] Training pipeline...")
    pipeline.fit(X_train, y_train)

    # Evaluate on held-out test set
    print("[INFO] Evaluating on held-out test set...")
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    # Calculate genuine metrics
    acc = accuracy_score(y_test, y_pred)
    prec_spam = precision_score(y_test, y_pred, pos_label=1, zero_division=0)
    rec_spam = recall_score(y_test, y_pred, pos_label=1, zero_division=0)
    f1_spam = f1_score(y_test, y_pred, pos_label=1, zero_division=0)

    prec_ham = precision_score(y_test, y_pred, pos_label=0, zero_division=0)
    rec_ham = recall_score(y_test, y_pred, pos_label=0, zero_division=0)
    f1_ham = f1_score(y_test, y_pred, pos_label=0, zero_division=0)

    cm = confusion_matrix(y_test, y_pred).tolist()  # [[TN, FP], [FN, TP]]
    tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]

    clf_report = classification_report(
        y_test, y_pred,
        target_names=["ham", "spam"],
        output_dict=True,
        zero_division=0
    )

    # Extract top feature weights for interpretability
    vectorizer = pipeline.named_steps["tfidf"]
    clf = pipeline.named_steps["classifier"]
    feature_names = np.array(vectorizer.get_feature_names_out())
    coefs = clf.coef_[0]

    top_spam_indices = np.argsort(coefs)[-30:][::-1]
    top_ham_indices = np.argsort(coefs)[:30]

    top_spam_features = [{"token": feature_names[i], "weight": round(float(coefs[i]), 4)} for i in top_spam_indices]
    top_ham_features = [{"token": feature_names[i], "weight": round(float(coefs[i]), 4)} for i in top_ham_indices]

    metrics_data = {
        "evaluation_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "model_architecture": "TF-IDF + Balanced Logistic Regression",
        "dataset_name": "UCI SMS Spam Collection (Cleaned & Deduplicated)",
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "train_spam_count": int(y_train.sum()),
        "train_ham_count": int(len(y_train) - y_train.sum()),
        "test_spam_count": int(y_test.sum()),
        "test_ham_count": int(len(y_test) - y_test.sum()),
        "vocabulary_size": int(len(feature_names)),
        "metrics": {
            "accuracy": round(float(acc), 4),
            "spam_precision": round(float(prec_spam), 4),
            "spam_recall": round(float(rec_spam), 4),
            "spam_f1": round(float(f1_spam), 4),
            "ham_precision": round(float(prec_ham), 4),
            "ham_recall": round(float(rec_ham), 4),
            "ham_f1": round(float(f1_ham), 4)
        },
        "confusion_matrix": {
            "raw": cm,
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
            "labels": ["ham (0)", "spam (1)"]
        },
        "classification_report": clf_report,
        "interpretability": {
            "intercept": round(float(clf.intercept_[0]), 4),
            "top_spam_features": top_spam_features,
            "top_ham_features": top_ham_features
        }
    }

    metadata_data = {
        "model_name": "SENTINEL-LR-V1",
        "version": "1.0.0",
        "author": "SENTINEL AI Machine Learning Team",
        "license": "CC BY 4.0 (Dataset derived from UCI)",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "framework": "scikit-learn",
        "pipeline_stages": ["TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True)", "LogisticRegression(C=4.0, class_weight='balanced')"],
        "random_state": RANDOM_STATE,
        "test_size": TEST_SIZE,
        "intended_use": "Cyber threat intelligence and message forensics screening for spam, phishing indicators, and deceptive texts."
    }

    # Save model and artifacts
    print(f"[INFO] Saving model to {MODEL_PATH}...")
    joblib.dump(pipeline, MODEL_PATH)

    print(f"[INFO] Saving metrics to {METRICS_PATH}...")
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    print(f"[INFO] Saving metadata to {METADATA_PATH}...")
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata_data, f, indent=2)

    print("\n================ EVALUATION RESULTS ================")
    print(f"Overall Accuracy:  {acc * 100:.2f}%")
    print(f"Spam Precision:    {prec_spam * 100:.2f}%")
    print(f"Spam Recall:       {rec_spam * 100:.2f}%")
    print(f"Spam F1-Score:     {f1_spam * 100:.2f}%")
    print(f"Confusion Matrix:  TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    print("====================================================\n")
    print(f"[SUCCESS] Training complete. Artifacts stored in {MODELS_DIR}")
    return pipeline, metrics_data


if __name__ == "__main__":
    try:
        train_and_evaluate()
    except Exception as e:
        print(f"[CRITICAL] Training failed: {e}", file=sys.stderr)
        sys.exit(1)
