"""
FastAPI API Router for SENTINEL AI.
Provides all analytical, forensic, ML, archive, and diagnostic endpoints.
"""

import os
import json
import time
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse

from ..core.config import settings
from ..schemas.forensics import (
    AnalyzeRequest,
    AnalyzeResponse,
    SampleMessage,
    ModelInfoResponse,
    ModelMetricsResponse,
    ArchiveFilterRequest,
    ArchiveRecord,
    ProcessingStage,
    TokenAttribution
)
from ..ml.predictor import predictor
from ..services.evidence_engine import evidence_engine, FORENSIC_RULES
from ..services.risk_scorer import risk_scorer
from ..services.archive_service import archive_service
from ..services.samples_service import get_all_samples

router = APIRouter(prefix=settings.API_PREFIX)
START_TIME = time.time()


@router.get("/health")
def get_health():
    """
    Diagnostic health check endpoint indicating server and model readiness.
    """
    uptime_seconds = round(time.time() - START_TIME, 1)
    return {
        "status": "healthy" if predictor.is_loaded else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_loaded": predictor.is_loaded,
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    """
    Returns architecture, framework, and pipeline specifications of the trained model.
    """
    metadata_path = settings.METADATA_PATH
    dataset_metadata_path = os.path.join(settings.DATA_DIR, "dataset_metadata.json")

    metadata = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
        except Exception:
            pass

    dataset_meta = {}
    if os.path.exists(dataset_metadata_path):
        try:
            with open(dataset_metadata_path, "r", encoding="utf-8") as f:
                dataset_meta = json.load(f)
        except Exception:
            pass

    return ModelInfoResponse(
        model_name=metadata.get("model_name", "SENTINEL-LR-V1"),
        version=metadata.get("version", settings.VERSION),
        author=metadata.get("author", "SENTINEL AI Team"),
        license=metadata.get("license", "CC BY 4.0"),
        created_at=metadata.get("created_at", "2026-10-18T00:00:00Z"),
        framework=metadata.get("framework", "scikit-learn"),
        pipeline_stages=metadata.get("pipeline_stages", [
            "TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True)",
            "LogisticRegression(class_weight='balanced')"
        ]),
        intended_use=metadata.get("intended_use", "Cyber threat intelligence message analysis"),
        dataset_name=dataset_meta.get("dataset_name", "UCI SMS Spam Collection"),
        dataset_samples=dataset_meta.get("total_samples", 5160),
        is_loaded=predictor.is_loaded
    )


@router.get("/model-metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    """
    Returns genuine, empirical evaluation metrics generated from the held-out test split.
    """
    metrics_path = settings.METRICS_PATH
    if not os.path.exists(metrics_path):
        return ModelMetricsResponse(is_available=False)

    try:
        with open(metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return ModelMetricsResponse(
            is_available=True,
            evaluation_timestamp=data.get("evaluation_timestamp"),
            model_architecture=data.get("model_architecture"),
            dataset_name=data.get("dataset_name"),
            train_samples=data.get("train_samples"),
            test_samples=data.get("test_samples"),
            vocabulary_size=data.get("vocabulary_size"),
            metrics=data.get("metrics"),
            confusion_matrix=data.get("confusion_matrix"),
            classification_report=data.get("classification_report"),
            top_spam_features=data.get("interpretability", {}).get("top_spam_features"),
            top_ham_features=data.get("interpretability", {}).get("top_ham_features")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read evaluation metrics: {str(e)}")


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_message(req: AnalyzeRequest):
    """
    Primary forensics endpoint. Performs ML inference, deterministic rule matching,
    URL anomaly screening, and Threat Fingerprint synthesis.
    """
    total_start = time.perf_counter()
    timeline: List[ProcessingStage] = []
    investigation_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Step 1: Input Validation & Sanitization
    s1_start = time.perf_counter()
    raw_text = req.message.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Message text cannot be empty or solely whitespace.")

    if len(raw_text) > settings.MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=413,
            detail=f"Message length ({len(raw_text)} chars) exceeds maximum allowable limit of {settings.MAX_MESSAGE_LENGTH}."
        )

    stats = evidence_engine.calculate_text_statistics(raw_text)
    s1_dur = (time.perf_counter() - s1_start) * 1000
    timeline.append(ProcessingStage(
        step="Input Validation & Linguistic Profiling",
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        duration_ms=round(s1_dur, 2),
        status="completed",
        details=f"{stats.word_count} words, {stats.char_count} chars"
    ))

    # Step 2: Machine Learning Inference & Token Attribution
    s2_start = time.perf_counter()
    ml_result = predictor.predict(raw_text)
    s2_dur = (time.perf_counter() - s2_start) * 1000
    timeline.append(ProcessingStage(
        step="TF-IDF Vectorization & Classifier Inference",
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        duration_ms=round(s2_dur, 2),
        status="completed" if ml_result["error"] is None else "warning",
        details=f"Prediction: {ml_result['prediction']}, Prob: {ml_result['spam_probability']}"
    ))

    # Step 3: Forensic Evidence Extraction
    s3_start = time.perf_counter()
    indicators = evidence_engine.extract_indicators(raw_text)
    s3_dur = (time.perf_counter() - s3_start) * 1000
    timeline.append(ProcessingStage(
        step="Deterministic Forensic Rule Matching",
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        duration_ms=round(s3_dur, 2),
        status="completed",
        details=f"Identified {len(indicators)} indicators"
    ))

    # Step 4: URL & Domain Extraction
    s4_start = time.perf_counter()
    extracted_urls = evidence_engine.extract_urls(raw_text)
    s4_dur = (time.perf_counter() - s4_start) * 1000
    timeline.append(ProcessingStage(
        step="URL Extraction & Domain Anomaly Screening",
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        duration_ms=round(s4_dur, 2),
        status="completed",
        details=f"Analyzed {len(extracted_urls)} destination(s) safely"
    ))

    # Step 5: Threat Fingerprint & Risk Score Synthesis
    s5_start = time.perf_counter()
    risk_score, verdict, fingerprint, explanation, actions = risk_scorer.compute_assessment(
        model_prob=ml_result["spam_probability"],
        indicators=indicators,
        urls=extracted_urls,
        stats=stats
    )
    s5_dur = (time.perf_counter() - s5_start) * 1000
    timeline.append(ProcessingStage(
        step="Threat Fingerprint & Risk Score Synthesis",
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        duration_ms=round(s5_dur, 2),
        status="completed",
        details=f"Verdict: {verdict}, Score: {risk_score}/100"
    ))

    total_dur_ms = round((time.perf_counter() - total_start) * 1000, 2)

    # Format token attributions
    token_attributions = [
        TokenAttribution(**attr) for attr in ml_result["attributions"][:20]
    ]

    response = AnalyzeResponse(
        investigation_id=investigation_id,
        timestamp=now_iso,
        verdict=verdict,
        heuristic_risk_score=risk_score,
        model_probability=ml_result["spam_probability"],
        model_prediction=ml_result["prediction"],
        model_confidence=ml_result["confidence"],
        explanation=explanation,
        evidence_indicators=indicators,
        threat_fingerprint=fingerprint,
        extracted_urls=extracted_urls,
        token_attributions=token_attributions,
        statistics=stats,
        recommended_actions=actions,
        model_version=settings.VERSION,
        analysis_duration_ms=total_dur_ms,
        timeline=timeline,
        source_type=req.source_type or "unknown",
        sender=req.sender,
        raw_message=raw_text
    )

    # Auto-archive the analysis
    try:
        archive_service.save_analysis(response)
    except Exception as e:
        print(f"[ARCHIVE ERROR] Could not persist investigation: {e}")

    return response


@router.get("/samples", response_model=List[SampleMessage])
def get_sample_messages():
    """
    Returns clearly labelled curated sample messages for analyst demonstration.
    """
    return get_all_samples()


@router.get("/rules")
def get_forensic_rules():
    """
    Returns the complete dictionary of active forensic detection rules.
    """
    return {
        "total_rules": len(FORENSIC_RULES),
        "rules": [
            {
                "rule_id": r["rule_id"],
                "category": r["category"],
                "name": r["name"],
                "severity": r["severity"],
                "explanation": r["explanation"],
                "action": r["action"]
            }
            for r in FORENSIC_RULES
        ]
    }


@router.get("/archive")
def list_archive(
    query: Optional[str] = None,
    verdict: Optional[str] = None,
    severity: Optional[str] = None,
    source_type: Optional[str] = None,
    sort_by: Optional[str] = "newest"
):
    """
    List, search, and filter archived investigations.
    """
    filter_req = ArchiveFilterRequest(
        query=query,
        verdict=verdict,
        severity=severity,
        source_type=source_type,
        sort_by=sort_by
    )
    records = archive_service.list_records(filter_req)
    return {
        "total": len(records),
        "records": records
    }


@router.get("/archive/{record_id}")
def get_archive_record(record_id: str):
    record = archive_service.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Investigation record not found.")
    return record


@router.delete("/archive/{record_id}")
def delete_archive_record(record_id: str):
    success = archive_service.delete_record(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found or already deleted.")
    return {"status": "deleted", "id": record_id}


@router.delete("/archive")
def clear_archive(confirm: bool = Query(False, description="Must be true to confirm clearing")):
    if not confirm:
        raise HTTPException(status_code=400, detail="Confirmation required to clear entire archive.")
    count = archive_service.clear_archive()
    return {"status": "cleared", "deleted_count": count}


@router.get("/archive/export/csv")
def export_archive_csv():
    records = archive_service.list_records(None)
    csv_data = archive_service.export_csv(records)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentinel_investigations.csv"}
    )


@router.get("/archive/export/json")
def export_archive_json():
    records = archive_service.list_records(None)
    json_data = json.dumps(records, indent=2)
    return Response(
        content=json_data,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=sentinel_investigations.json"}
    )
