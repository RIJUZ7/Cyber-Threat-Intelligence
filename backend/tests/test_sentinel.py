"""
Automated Test Suite for SENTINEL AI Backend.
Covers API endpoints, ML inference, deterministic evidence engine,
URL safety screening, risk score bounds, archive persistence, and export.
"""

import os
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.ml.predictor import predictor, SentinelPredictor
from backend.app.services.evidence_engine import evidence_engine
from backend.app.services.risk_scorer import risk_scorer
from backend.app.services.archive_service import archive_service

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint reports operational status and loaded model."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "version" in data
    assert "uptime_seconds" in data
    assert data["model_loaded"] is True


def test_model_info_endpoint():
    """Verify model specifications and framework documentation."""
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["framework"] == "scikit-learn"
    assert "TfidfVectorizer" in data["pipeline_stages"][0]
    assert data["is_loaded"] is True
    assert data["dataset_samples"] > 0


def test_model_metrics_endpoint():
    """Verify genuine held-out evaluation report is accessible."""
    response = client.get("/api/model-metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["is_available"] is True
    metrics = data["metrics"]
    assert 0.85 <= metrics["accuracy"] <= 1.0
    assert 0.80 <= metrics["spam_f1"] <= 1.0
    assert "confusion_matrix" in data
    assert data["confusion_matrix"]["true_positives"] > 0


def test_samples_endpoint():
    """Verify built-in curated samples are available."""
    response = client.get("/api/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 5
    categories = [s["category"] for s in samples]
    assert "Phishing Email" in categories
    assert "Legitimate Email" in categories


def test_forensic_rules_endpoint():
    """Verify dictionary of active forensic detection rules."""
    response = client.get("/api/rules")
    assert response.status_code == 200
    data = response.json()
    assert data["total_rules"] >= 8
    rule_ids = [r["rule_id"] for r in data["rules"]]
    assert "R-URG-01" in rule_ids
    assert "R-SEC-01" in rule_ids


def test_analyze_phishing_message():
    """Verify full forensics workflow on a blatant phishing lure."""
    payload = {
        "message": (
            "URGENT NOTICE: Your PayPal account has been suspended due to suspicious activity. "
            "Immediate action required! Verify your password and confirm your identity within 24 hours. "
            "Click here to re-activate: http://192.168.1.1/login"
        ),
        "sender": "service@paypal-alerts-support.xyz",
        "source_type": "email"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] in ["SPAM", "LIKELY SPAM"]
    assert 50 <= data["heuristic_risk_score"] <= 100
    assert data["threat_fingerprint"]["urgency"] > 0
    assert data["threat_fingerprint"]["credential_harvesting"] > 0
    assert len(data["extracted_urls"]) == 1
    assert data["extracted_urls"][0]["is_ip"] is True
    assert len(data["timeline"]) == 5
    assert len(data["recommended_actions"]) >= 1


def test_analyze_legitimate_message():
    """Verify forensics workflow on benign communication."""
    payload = {
        "message": "Hi Mark, just following up on our project discussion. Let me know when you have time for a brief call next week.",
        "sender": "mark.colleague@company.com",
        "source_type": "email"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] == "NOT FLAGGED AS SPAM"
    assert data["heuristic_risk_score"] < 40
    # Crucial compliance: we do not claim guaranteed safety
    assert "SAFE" not in data["verdict"]


def test_analyze_empty_message_validation():
    """Verify rejecting empty or whitespace message with HTTP 400."""
    response = client.post("/api/analyze", json={"message": "   "})
    assert response.status_code == 400


def test_analyze_excessively_long_message():
    """Verify rejecting messages exceeding character threshold with HTTP 413 or 422."""
    huge_message = "A" * 30000
    response = client.post("/api/analyze", json={"message": huge_message})
    assert response.status_code in [413, 422]


def test_url_extraction_safety():
    """Verify extraction handles IP addresses, shorteners, and brand impersonation safely."""
    text = (
        "Check this link: https://bit.ly/claim-prize and also "
        "http://45.33.32.156/portal/auth and https://paypal.verification-portal.top/login"
    )
    urls = evidence_engine.extract_urls(text)
    assert len(urls) == 3
    shortened = [u for u in urls if u.is_shortened]
    assert len(shortened) == 1
    ips = [u for u in urls if u.is_ip]
    assert len(ips) == 1
    lookalikes = [u for u in urls if u.has_lookalike_terms]
    assert len(lookalikes) >= 1


def test_evidence_engine_indicators():
    """Verify deterministic matching against key attack patterns."""
    text = "Immediate action required! Enter your password and send us the OTP to prevent your account from being closed."
    indicators = evidence_engine.extract_indicators(text)
    categories = [i.category for i in indicators]
    assert any("Urgent" in c for c in categories)
    assert any("Credential" in c for c in categories)


def test_risk_score_bounds():
    """Verify risk scores never exceed 100 or drop below 0."""
    stats = evidence_engine.calculate_text_statistics("Hello world")
    score, verdict, fp, exp, actions = risk_scorer.compute_assessment(
        model_prob=0.0,
        indicators=[],
        urls=[],
        stats=stats
    )
    assert 0 <= score <= 100
    assert 0 <= fp.overall_score <= 100

    # Test extreme upper limit
    dummy_indicators = evidence_engine.extract_indicators(
        "Immediate action required! Final notice! Enter your password! Send us the OTP! You have won $10,000,000! "
        "Account suspended immediately! Click here http://192.168.1.1/a"
    )
    dummy_urls = evidence_engine.extract_urls("http://192.168.1.1/a https://bit.ly/test http://paypal.scam.top")
    dummy_stats = evidence_engine.calculate_text_statistics("ATTENTION ALL USERS!!!!!")

    high_score, high_verdict, high_fp, _, _ = risk_scorer.compute_assessment(
        model_prob=1.0,
        indicators=dummy_indicators,
        urls=dummy_urls,
        stats=dummy_stats
    )
    assert 0 <= high_score <= 100
    assert high_verdict == "SPAM"


def test_archive_service_lifecycle():
    """Verify archive save, query, export, delete, and clear."""
    # Analyze a test message to ensure an investigation is created
    res = client.post("/api/analyze", json={
        "message": "Special delivery notification from USPS. Parcel pending.",
        "source_type": "sms"
    })
    assert res.status_code == 200
    inv_id = res.json()["investigation_id"]

    # List archive
    list_res = client.get("/api/archive")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 1

    # Get single
    get_res = client.get(f"/api/archive/{inv_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == inv_id

    # Export CSV
    csv_res = client.get("/api/archive/export/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert inv_id in csv_res.text

    # Export JSON
    json_res = client.get("/api/archive/export/json")
    assert json_res.status_code == 200
    assert inv_id in json_res.text

    # Delete single
    del_res = client.delete(f"/api/archive/{inv_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"


def test_missing_model_graceful_handling():
    """Verify that predictor handles missing model file gracefully without crashing."""
    dummy_predictor = SentinelPredictor(model_path="non_existent_file.joblib")
    result = dummy_predictor.predict("Test message")
    assert result["prediction"] == "UNKNOWN"
    assert result["error"] is not None
