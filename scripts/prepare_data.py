"""
Data preparation script for SENTINEL AI.
Downloads and processes the official UCI SMS Spam Collection dataset.
"""

import os
import io
import sys
import json
import hashlib
import zipfile
import urllib.request
import pandas as pd

UCI_URL = "https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip"
RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
METADATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "dataset_metadata.json")


def ensure_directories():
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)


def download_uci_dataset():
    ensure_directories()
    raw_file = os.path.join(RAW_DIR, "SMSSpamCollection")
    readme_file = os.path.join(RAW_DIR, "readme.txt")

    if os.path.exists(raw_file):
        print(f"[INFO] Raw dataset already exists at {raw_file}")
        with open(raw_file, "rb") as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
        return raw_file, file_hash

    print(f"[INFO] Downloading UCI SMS Spam Collection from {UCI_URL}...")
    headers = {"User-Agent": "SENTINEL-AI-Downloader/1.0"}
    req = urllib.request.Request(UCI_URL, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            content = response.read()
            file_hash = hashlib.sha256(content).hexdigest()
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                # Extract SMSSpamCollection and readme
                if "SMSSpamCollection" in z.namelist():
                    with open(raw_file, "wb") as f:
                        f.write(z.read("SMSSpamCollection"))
                if "readme" in z.namelist():
                    with open(readme_file, "wb") as f:
                        f.write(z.read("readme"))
        print(f"[SUCCESS] Downloaded and extracted dataset. SHA256: {file_hash[:16]}...")
        return raw_file, file_hash
    except Exception as e:
        print(f"[ERROR] Failed to download from UCI: {e}")
        raise


def process_dataset(raw_path, file_hash):
    print(f"[INFO] Processing dataset from {raw_path}...")
    # Read raw TSV file: col 0 = label ('ham' or 'spam'), col 1 = text
    rows = []
    with open(raw_path, "r", encoding="utf-8", errors="replace") as f:
        for line_num, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t", 1)
            if len(parts) == 2:
                label, text = parts
                rows.append({"label": label.strip().lower(), "text": text.strip()})
            else:
                # Handle possible edge case lines
                pass

    df = pd.DataFrame(rows)
    print(f"[INFO] Raw record count: {len(df)}")

    # Data validation & cleaning
    # Filter only 'ham' and 'spam'
    df = df[df["label"].isin(["ham", "spam"])].copy()
    
    # Remove null or empty texts
    df = df[df["text"].str.strip().str.len() > 0]
    
    # Identify duplicates
    duplicates_count = df.duplicated(subset=["text"]).sum()
    print(f"[INFO] Duplicate text entries found: {duplicates_count}")
    
    # For a robust ML benchmark, we deduplicate by text to prevent train/test leakage
    df_dedup = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
    
    # Add text length metadata
    df_dedup["char_length"] = df_dedup["text"].apply(len)
    df_dedup["word_count"] = df_dedup["text"].apply(lambda s: len(s.split()))

    output_csv = os.path.join(PROCESSED_DIR, "sms_spam_clean.csv")
    df_dedup.to_csv(output_csv, index=False)
    print(f"[SUCCESS] Saved clean dataset to {output_csv} ({len(df_dedup)} records)")

    # Compute statistics
    class_counts = df_dedup["label"].value_counts().to_dict()
    stats = {
        "dataset_name": "UCI SMS Spam Collection (Cleaned & Deduplicated)",
        "source_url": UCI_URL,
        "raw_sha256": file_hash,
        "total_samples": len(df_dedup),
        "class_distribution": class_counts,
        "spam_percentage": round(class_counts.get("spam", 0) / len(df_dedup) * 100, 2),
        "ham_percentage": round(class_counts.get("ham", 0) / len(df_dedup) * 100, 2),
        "raw_samples_with_duplicates": len(df),
        "duplicates_removed": int(duplicates_count),
        "avg_char_length_ham": round(float(df_dedup[df_dedup["label"] == "ham"]["char_length"].mean()), 1),
        "avg_char_length_spam": round(float(df_dedup[df_dedup["label"] == "spam"]["char_length"].mean()), 1),
        "avg_word_count_ham": round(float(df_dedup[df_dedup["label"] == "ham"]["word_count"].mean()), 1),
        "avg_word_count_spam": round(float(df_dedup[df_dedup["label"] == "spam"]["word_count"].mean()), 1),
    }

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    print(f"[SUCCESS] Dataset metadata saved to {METADATA_FILE}")
    print(json.dumps(stats, indent=2))
    return output_csv


if __name__ == "__main__":
    try:
        raw_p, h = download_uci_dataset()
        process_dataset(raw_p, h)
    except Exception as err:
        print(f"[CRITICAL] Data preparation failed: {err}", file=sys.stderr)
        sys.exit(1)
