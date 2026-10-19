export interface AnalyzeRequest {
  message: string;
  sender?: string;
  source_type?: string;
}

export interface EvidenceIndicator {
  id: string;
  rule_id: string;
  category: string;
  name: string;
  severity: "high" | "caution" | "info";
  matched_text: string;
  start_idx: number;
  end_idx: number;
  explanation: string;
  recommended_action: string;
}

export interface ExtractedUrl {
  url: string;
  domain: string;
  scheme: string;
  is_ip: boolean;
  is_shortened: boolean;
  suspicious_tld: boolean;
  has_lookalike_terms: boolean;
  risk_note: string;
}

export interface ThreatFingerprint {
  urgency: number;
  impersonation: number;
  suspicious_links: number;
  credential_harvesting: number;
  financial_pressure: number;
  structural_obfuscation: number;
  overall_score: number;
}

export interface TokenAttribution {
  token: string;
  contribution: number;
  direction: "spam" | "ham";
  weight: number;
  tfidf_val: number;
}

export interface TextStatistics {
  char_count: number;
  word_count: number;
  line_count: number;
  uppercase_ratio: number;
  punctuation_count: number;
  special_char_count: number;
}

export interface ProcessingStage {
  step: string;
  timestamp: string;
  duration_ms: number;
  status: "completed" | "skipped" | "warning";
  details?: string;
}

export interface AnalyzeResponse {
  investigation_id: string;
  timestamp: string;
  verdict: "SPAM" | "LIKELY SPAM" | "NOT FLAGGED AS SPAM";
  heuristic_risk_score: number;
  model_probability: number | null;
  model_prediction: string;
  model_confidence: number;
  explanation: string;
  evidence_indicators: EvidenceIndicator[];
  threat_fingerprint: ThreatFingerprint;
  extracted_urls: ExtractedUrl[];
  token_attributions: TokenAttribution[];
  statistics: TextStatistics;
  recommended_actions: string[];
  model_version: string;
  analysis_duration_ms: number;
  timeline: ProcessingStage[];
  source_type: string;
  sender?: string;
  raw_message: string;
}

export interface SampleMessage {
  id: string;
  title: string;
  category: string;
  source_type: string;
  sender: string;
  preview: string;
  full_text: string;
  expected_risk: "high" | "medium" | "low";
  description: string;
}

export interface ArchiveRecord {
  id: string;
  timestamp: string;
  verdict: string;
  heuristic_risk_score: number;
  source_type: string;
  sender?: string;
  message_preview: string;
  evidence_count: number;
  high_severity_count: number;
  analysis_data: AnalyzeResponse;
}

export interface ModelInfo {
  model_name: string;
  version: string;
  author: string;
  license: string;
  created_at: string;
  framework: string;
  pipeline_stages: string[];
  intended_use: string;
  dataset_name: string;
  dataset_samples: number;
  is_loaded: boolean;
}

export interface ConfusionMatrixData {
  raw: number[][];
  true_negatives: number;
  false_positives: number;
  false_negatives: number;
  true_positives: number;
  labels: string[];
}

export interface ModelMetrics {
  is_available: boolean;
  evaluation_timestamp?: string;
  model_architecture?: string;
  dataset_name?: string;
  train_samples?: number;
  test_samples?: number;
  vocabulary_size?: number;
  metrics?: {
    accuracy: number;
    spam_precision: number;
    spam_recall: number;
    spam_f1: number;
    ham_precision: number;
    ham_recall: number;
    ham_f1: number;
  };
  confusion_matrix?: ConfusionMatrixData;
  classification_report?: Record<string, any>;
  top_spam_features?: Array<{ token: string; weight: number }>;
  top_ham_features?: Array<{ token: string; weight: number }>;
}

export interface ForensicRule {
  rule_id: string;
  category: string;
  name: string;
  severity: "high" | "caution" | "info";
  explanation: string;
  action: string;
}
