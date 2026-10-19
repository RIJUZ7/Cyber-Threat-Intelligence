"""
Independent model evaluation script for SENTINEL AI.
Validates the trained model against test data and prints a detailed forensic report.
"""

import os
import sys
import json
import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "sentinel_model.joblib")
TEST_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "sms_spam_clean.csv")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "evaluation_report.json")


def run_evaluation():
    if not os.path.exists(MODEL_PATH):
        print(f"[ERROR] Model file {MODEL_PATH} not found. Please train first.")
        sys.exit(1)

    print(f"[INFO] Loading model from {MODEL_PATH}...")
    pipeline = joblib.load(MODEL_PATH)

    if not os.path.exists(TEST_DATA_PATH):
        print(f"[ERROR] Clean data file {TEST_DATA_PATH} not found.")
        sys.exit(1)

    df = pd.read_csv(TEST_DATA_PATH)
    X = df["text"].astype(str).values
    y = (df["label"] == "spam").astype(int).values

    print(f"[INFO] Loaded {len(X)} records for validation.")
    y_pred = pipeline.predict(X)
    y_proba = pipeline.predict_proba(X)[:, 1]

    acc = accuracy_score(y, y_pred)
    f1 = f1_score(y, y_pred, pos_label=1)
    cm = confusion_matrix(y, y_pred)

    print("\n[FULL DATASET BENCHMARK METRICS]")
    print(f"Accuracy: {acc * 100:.2f}%")
    print(f"F1 Score (Spam): {f1 * 100:.2f}%")
    print("\nConfusion Matrix:")
    print(cm)
    print("\nClassification Report:")
    print(classification_report(y, y_pred, target_names=["ham", "spam"]))

    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            heldout_metrics = json.load(f)
        print("\n[HELDOUT TEST SET METRICS RECORDED IN ARTIFACT]:")
        print(f"Accuracy: {heldout_metrics['metrics']['accuracy'] * 100:.2f}%")
        print(f"Spam Precision: {heldout_metrics['metrics']['spam_precision'] * 100:.2f}%")
        print(f"Spam Recall: {heldout_metrics['metrics']['spam_recall'] * 100:.2f}%")
        print(f"Spam F1: {heldout_metrics['metrics']['spam_f1'] * 100:.2f}%")


if __name__ == "__main__":
    run_evaluation()
