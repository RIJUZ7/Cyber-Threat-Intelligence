# SENTINEL-LR-V1 Model Card

## Model Overview
- **Model Name:** SENTINEL-LR-V1
- **Architecture:** Sublinear Term Frequency-Inverse Document Frequency (TF-IDF) Vectorizer with N-Gram Range $(1, 2)$ followed by Balanced $L_2$-Regularized Logistic Regression ($C=4.0$).
- **Version:** 1.0.0
- **Build Date:** 2026-10-18
- **Framework:** scikit-learn 1.9.1 / Python 3.13
- **Artifact File:** `models/sentinel_model.joblib`
- **License:** CC BY 4.0

## Intended Use
- **Primary Domain:** Automated triage and forensic screening of text messages (SMS), emails, and unverified inbound text for spam, phishing indicators, and deceptive lures.
- **Intended Users:** Cyber threat intelligence analysts, incident response operators, IT helpdesk personnel, and educational security researchers.
- **Out of Scope:** This model is **NOT** a standalone automated firewall, active mailbox gateway filter, or infallible security perimeter. It must not be deployed to silently drop critical business emails without analyst oversight.

## Training & Evaluation Data
- **Source:** UCI SMS Spam Collection (Almeida, T.A., Gómez Hidalgo, J.M., Yamakami, A., 2011).
- **Total Deduplicated Samples:** 5,160 records (4,518 Ham, 642 Spam).
- **Deduplication:** 414 duplicate entries were purged prior to dataset splitting to prevent train-to-test data leakage.
- **Train/Test Split:** Stratified 80/20 train/test split (Random Seed 42).
  - Train Split: 4,128 records (514 Spam, 3,614 Ham)
  - Held-out Test Split: 1,032 records (128 Spam, 904 Ham)

## Held-Out Test Set Empirical Metrics
Evaluated strictly on the held-out 1,032 test samples:

| Metric | Score | Note |
|---|---|---|
| **Overall Accuracy** | **98.55%** | Overall correct rate on stratified test samples |
| **Spam Precision** | **94.49%** | Of messages flagged as spam by model, 94.49% were true spam |
| **Spam Recall** | **93.75%** | Identified 120 of 128 ground-truth spam messages |
| **Spam F1-Score** | **94.12%** | Harmonic mean of precision and recall |
| **Ham Precision** | **99.12%** | Legitimate message identification fidelity |
| **Ham Recall** | **99.23%** | Only 7 false positives out of 904 legitimate samples |

### Confusion Matrix on Held-Out Test Set
```
                 Predicted HAM    Predicted SPAM
Actual HAM:          897 (TN)          7 (FP)
Actual SPAM:           8 (FN)        120 (TP)
```

## Explainability & Attribution
Unlike opaque black-box neural networks, SENTINEL-LR-V1 provides mathematically verifiable token attributions. For any token $j$:
$$\text{Attribution}_j = w_j \cdot x_j$$
where $w_j$ is the learned regression coefficient and $x_j$ is the sublinear TF-IDF magnitude. Positive attributions indicate spam-driving influence; negative attributions indicate ham-driving influence.

## Known Limitations & Adversarial Vulnerabilities
1. **Domain Drift:** Trained primarily on telecommunication SMS spam corpora. Contemporary spear-phishing campaigns involving enterprise context (e.g. DocuSign impersonation, OAuth consent grants) may have lower ML baseline scores without auxiliary forensic rule reinforcement.
2. **Homoglyph & Obfuscation:** While the Deterministic Evidence Engine catches spaced text and excessive capitalization, advanced Unicode homoglyph spoofing can alter TF-IDF tokenization.
3. **No External Live Lookups:** For privacy and isolation, the model does not query external DNS or threat intelligence feeds at runtime.
