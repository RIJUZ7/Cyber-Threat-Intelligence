# SENTINEL AI Architecture Specification

SENTINEL AI is an intelligent message-security and digital forensics platform designed for cyber threat intelligence analysts, incident responders, and security researchers.

## 1. System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (Digital Forensics Workstation)"]
        UI["React 19 + TypeScript + Tailwind CSS"]
        CC["Command Center (Telemetry & Metrics)"]
        MS["Message Scanner (Multi-Vector Input)"]
        FL["Forensics Lab (Linguistic & Token Deep Dive)"]
        TA["Threat Archive (Local & Persistent Storage)"]
        MO["Model Observatory (Test-Set Benchmark & Explainability)"]
        FP_VIZ["Threat Fingerprint (Radar & Dimensional Vector)"]
    end

    subgraph Server ["Backend API (FastAPI)"]
        API["REST Endpoints (/api/analyze, /api/model-info, ...)"]
        VAL["Input Sanitizer & Character Profiler"]
        
        subgraph DetectionEngine ["Dual Forensic Detection Core"]
            ML["TF-IDF (1,2-grams) + Balanced Logistic Regression"]
            FEAT["Exact Token Log-Odds Attribution Engine"]
            RULE["Deterministic Regex Rules Engine (8 Attack Vectors)"]
            URL["Safe URL & Domain Anomaly Inspector (Non-evaluating)"]
        end
        
        SYNTH["Risk Scorer & Threat Fingerprint Synthesizer"]
        ARCH["Archive Service (Thread-safe JSON Store)"]
    end

    subgraph DataStorage ["Data & Artifact Storage"]
        MODEL_ART["models/sentinel_model.joblib"]
        METRICS_ART["models/evaluation_report.json"]
        UCI_RAW["data/raw/SMSSpamCollection"]
        CLEAN_CSV["data/processed/sms_spam_clean.csv"]
        ARCHIVE_JSON["data/archive.json"]
    end

    UI --> API
    API --> VAL
    VAL --> ML
    VAL --> RULE
    VAL --> URL
    ML --> FEAT
    FEAT --> SYNTH
    RULE --> SYNTH
    URL --> SYNTH
    SYNTH --> ARCH
    ARCH --> ARCHIVE_JSON
    ML -.-> MODEL_ART
    API -.-> METRICS_ART
```

## 2. Core Detection Principles

1. **Dual-Layer Intelligence**: Fuses empirical machine-learning probability with deterministic forensic pattern rules. Neither overrides the other blindly; rather, they compound into a transparent, bounded heuristic risk score ($0 \dots 100$).
2. **Explainable Token Attribution**: Because the classification pipeline uses `LogisticRegression` on `TfidfVectorizer` features, token contribution is mathematically derived from $w_i \cdot x_i$, where $w_i$ is the model coefficient and $x_i$ is the TF-IDF feature value. There are no stochastic approximations or misleading mock highlights.
3. **Safe URL Handling**: Extracted hyperlinks are sanitized and inspected purely as text. The engine identifies IP-in-hostname structures, URL shorteners, deceptive brand subdomains, and suspicious TLDs without ever issuing an outbound HTTP request or executing foreign code.
4. **Honest Verdict Semantics**: Benign messages are labeled `NOT FLAGGED AS SPAM` rather than `SAFE`, recognizing the asymmetric and evolving nature of social engineering.
