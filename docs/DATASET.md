# Dataset Provenance & Preparation Documentation

## Primary Dataset
- **Name:** UCI SMS Spam Collection
- **Curators:** Tiago A. Almeida, José María Gómez Hidalgo, Akebo Yamakami (2011)
- **Source URL:** `https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip`
- **License / Terms of Use:** Publicly available for research and educational purposes. Citations required.
- **Raw File Checksum (SHA-256):** `1587ea43e58e82b14ff1f5425c88e17f8496bfcdb67a583dbff9eefaf9963ce3`

## Dataset Pipeline & Deduplication
Raw collection contains 5,574 messages. To construct an uncompromising, leakage-free benchmark:
1. **Schema Validation:** Extracted raw tab-separated records (Label $\in \{\text{'ham'}, \text{'spam'}\}$, Message Text).
2. **Missing & Empty Value Pruning:** Verified that no null, whitespace-only, or corrupted records entered the training stream.
3. **Deduplication:** Exactly 414 duplicate message texts were identified and removed, reducing the benchmark to 5,160 unique records. This prevents frequent broadcast spam from leaking simultaneously into both training and evaluation splits.
4. **Stratified Split:** 80% train (4,128 samples) / 20% test (1,032 samples) preserves the empirical 12.4% spam ratio across both splits.

## Statistical Profile (Cleaned Corpus)
| Metric | Benign (Ham) | Malicious (Spam) | Overall |
|---|---|---|---|
| **Total Count** | 4,518 (87.56%) | 642 (12.44%) | 5,160 (100%) |
| **Mean Character Length** | 70.9 chars | 137.4 chars | 79.2 chars |
| **Mean Word Count** | 14.2 words | 23.7 words | 15.4 words |
| **Common Lexical Traits** | Conversational, informal, short questions | Urgent deadlines, uppercase words, prize claims, phone numbers | Mixed |

## Reproducibility
To regenerate or inspect the dataset from scratch:
```powershell
python scripts/prepare_data.py
python scripts/train_model.py
python scripts/evaluate_model.py
```
Output files:
- Raw download: `data/raw/SMSSpamCollection`
- Cleaned CSV: `data/processed/sms_spam_clean.csv`
- Metadata audit: `data/dataset_metadata.json`
