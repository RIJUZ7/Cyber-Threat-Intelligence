"""
Pydantic schemas for SENTINEL AI API.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=25000, description="The message content to analyze")
    sender: Optional[str] = Field(None, max_length=255, description="Optional sender label or header")
    source_type: Optional[str] = Field("unknown", description="Source channel: email, sms, chat, or unknown")


class EvidenceIndicator(BaseModel):
    id: str
    rule_id: str
    category: str
    name: str
    severity: str  # "high", "caution", "info"
    matched_text: str
    start_idx: int
    end_idx: int
    explanation: str
    recommended_action: str


class ExtractedUrl(BaseModel):
    url: str
    domain: str
    scheme: str
    is_ip: bool
    is_shortened: bool
    suspicious_tld: bool
    has_lookalike_terms: bool
    risk_note: str


class ThreatFingerprint(BaseModel):
    urgency: int = Field(..., ge=0, le=100)
    impersonation: int = Field(..., ge=0, le=100)
    suspicious_links: int = Field(..., ge=0, le=100)
    credential_harvesting: int = Field(..., ge=0, le=100)
    financial_pressure: int = Field(..., ge=0, le=100)
    structural_obfuscation: int = Field(..., ge=0, le=100)
    overall_score: int = Field(..., ge=0, le=100)


class TokenAttribution(BaseModel):
    token: str
    contribution: float
    direction: str  # "spam" or "ham"
    weight: float
    tfidf_val: float


class TextStatistics(BaseModel):
    char_count: int
    word_count: int
    line_count: int
    uppercase_ratio: float
    punctuation_count: int
    special_char_count: int


class ProcessingStage(BaseModel):
    step: str
    timestamp: str
    duration_ms: float
    status: str  # "completed", "skipped", "warning"
    details: Optional[str] = None


class AnalyzeResponse(BaseModel):
    investigation_id: str
    timestamp: str
    verdict: str  # "SPAM", "LIKELY SPAM", "NOT FLAGGED AS SPAM"
    heuristic_risk_score: int
    model_probability: Optional[float]
    model_prediction: str
    model_confidence: float
    explanation: str
    evidence_indicators: List[EvidenceIndicator]
    threat_fingerprint: ThreatFingerprint
    extracted_urls: List[ExtractedUrl]
    token_attributions: List[TokenAttribution]
    statistics: TextStatistics
    recommended_actions: List[str]
    model_version: str
    analysis_duration_ms: float
    timeline: List[ProcessingStage]
    source_type: str
    sender: Optional[str] = None
    raw_message: str


class SampleMessage(BaseModel):
    id: str
    title: str
    category: str  # "Phishing Email", "Smishing SMS", "Legitimate Email", "Legitimate SMS", "Lottery Scam", "Account Suspension"
    source_type: str
    sender: str
    preview: str
    full_text: str
    expected_risk: str  # "high", "medium", "low"
    description: str


class ArchiveRecord(BaseModel):
    id: str
    timestamp: str
    verdict: str
    heuristic_risk_score: int
    source_type: str
    sender: Optional[str] = None
    message_preview: str
    evidence_count: int
    high_severity_count: int
    analysis_data: AnalyzeResponse


class ArchiveFilterRequest(BaseModel):
    query: Optional[str] = None
    verdict: Optional[str] = None
    severity: Optional[str] = None
    source_type: Optional[str] = None
    sort_by: Optional[str] = "newest"  # "newest" or "oldest"


class ModelInfoResponse(BaseModel):
    model_name: str
    version: str
    author: str
    license: str
    created_at: str
    framework: str
    pipeline_stages: List[str]
    intended_use: str
    dataset_name: str
    dataset_samples: int
    is_loaded: bool


class ConfusionMatrixData(BaseModel):
    raw: List[List[int]]
    true_negatives: int
    false_positives: int
    false_negatives: int
    true_positives: int
    labels: List[str]


class ModelMetricsResponse(BaseModel):
    is_available: bool
    evaluation_timestamp: Optional[str] = None
    model_architecture: Optional[str] = None
    dataset_name: Optional[str] = None
    train_samples: Optional[int] = None
    test_samples: Optional[int] = None
    vocabulary_size: Optional[int] = None
    metrics: Optional[Dict[str, float]] = None
    confusion_matrix: Optional[ConfusionMatrixData] = None
    classification_report: Optional[Dict[str, Any]] = None
    top_spam_features: Optional[List[Dict[str, Any]]] = None
    top_ham_features: Optional[List[Dict[str, Any]]] = None
