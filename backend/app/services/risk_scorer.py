"""
Risk Scorer and Threat Fingerprint Synthesizer for SENTINEL AI.
Fuses machine-learning probabilities and deterministic forensic evidence
into an explainable heuristic risk score and multi-dimensional threat vector.
"""

from typing import List, Dict, Any, Optional, Tuple
from ..schemas.forensics import (
    EvidenceIndicator,
    ExtractedUrl,
    TextStatistics,
    ThreatFingerprint
)


class RiskScorer:
    """
    Transparent risk assessment engine combining ML model probability
    with forensic indicator weights and structural signal features.
    """

    @staticmethod
    def compute_assessment(
        model_prob: Optional[float],
        indicators: List[EvidenceIndicator],
        urls: List[ExtractedUrl],
        stats: TextStatistics
    ) -> Tuple[int, str, ThreatFingerprint, str, List[str]]:
        """
        Computes:
        - heuristic_risk_score (0-100)
        - verdict ("SPAM", "LIKELY SPAM", "NOT FLAGGED AS SPAM")
        - threat_fingerprint (ThreatFingerprint)
        - plain-language explanation
        - recommended_actions
        """
        # 1. Base score from ML model
        ml_base = (model_prob * 50.0) if model_prob is not None else 10.0

        # 2. Evidence indicator contribution
        evidence_points = 0.0
        high_count = 0
        caution_count = 0
        info_count = 0

        # Categories tally for Threat Fingerprint
        cat_scores = {
            "urgency": 0.0,
            "impersonation": 0.0,
            "suspicious_links": 0.0,
            "credential_harvesting": 0.0,
            "financial_pressure": 0.0,
            "structural_obfuscation": 0.0,
        }

        for ind in indicators:
            if ind.severity == "high":
                evidence_points += 18.0
                high_count += 1
            elif ind.severity == "caution":
                evidence_points += 10.0
                caution_count += 1
            else:
                evidence_points += 4.0
                info_count += 1

            # Map to fingerprint categories
            if "Urgent" in ind.category:
                cat_scores["urgency"] += 45.0
            elif "Credential" in ind.category:
                cat_scores["credential_harvesting"] += 50.0
            elif "Financial" in ind.category:
                cat_scores["financial_pressure"] += 45.0
            elif "Threat" in ind.category:
                cat_scores["urgency"] += 35.0
                cat_scores["financial_pressure"] += 25.0
            elif "Impersonation" in ind.category:
                cat_scores["impersonation"] += 50.0
            elif "Action" in ind.category:
                cat_scores["urgency"] += 20.0

        # 3. URL anomalies
        for u in urls:
            cat_scores["suspicious_links"] += 20.0
            if u.is_shortened:
                evidence_points += 16.0
                cat_scores["suspicious_links"] += 40.0
            if u.is_ip:
                evidence_points += 28.0
                cat_scores["suspicious_links"] += 60.0
            if u.suspicious_tld:
                evidence_points += 18.0
                cat_scores["suspicious_links"] += 35.0
            if u.has_lookalike_terms:
                evidence_points += 24.0
                cat_scores["impersonation"] += 35.0
                cat_scores["suspicious_links"] += 30.0

        # 4. Structural anomalies
        if stats.uppercase_ratio > 0.35:
            evidence_points += 10.0
            cat_scores["structural_obfuscation"] += 45.0
        elif stats.uppercase_ratio > 0.20:
            evidence_points += 5.0
            cat_scores["structural_obfuscation"] += 20.0

        if stats.punctuation_count >= 5:
            cat_scores["structural_obfuscation"] += min(35.0, stats.punctuation_count * 4.0)

        # 5. Compound threat interaction multiplier
        # e.g., credential request + urgent deadline is classic high-potency phishing
        if cat_scores["credential_harvesting"] > 0 and cat_scores["urgency"] > 0:
            evidence_points += 15.0

        # e.g., impersonation + link
        if cat_scores["impersonation"] > 0 and len(urls) > 0:
            evidence_points += 15.0

        # Compute combined heuristic risk score (0-100)
        total_raw = ml_base + evidence_points
        heuristic_risk_score = int(round(min(100.0, max(0.0, total_raw))))

        # Normalize fingerprint scores to [0, 100]
        fingerprint = ThreatFingerprint(
            urgency=int(min(100.0, cat_scores["urgency"])),
            impersonation=int(min(100.0, cat_scores["impersonation"])),
            suspicious_links=int(min(100.0, cat_scores["suspicious_links"])),
            credential_harvesting=int(min(100.0, cat_scores["credential_harvesting"])),
            financial_pressure=int(min(100.0, cat_scores["financial_pressure"])),
            structural_obfuscation=int(min(100.0, cat_scores["structural_obfuscation"])),
            overall_score=heuristic_risk_score
        )

        # 6. Verdict determination
        if heuristic_risk_score >= 65 or (model_prob is not None and model_prob >= 0.82 and high_count > 0):
            verdict = "SPAM"
        elif heuristic_risk_score >= 35:
            verdict = "LIKELY SPAM"
        else:
            verdict = "NOT FLAGGED AS SPAM"

        # 7. Plain-language explanation
        explanation_parts = []
        if verdict == "SPAM":
            explanation_parts.append(
                f"Classified as SPAM with a forensic risk score of {heuristic_risk_score}/100."
            )
            reasons = []
            if high_count > 0:
                reasons.append(f"{high_count} high-severity forensic indicator(s)")
            if urls:
                reasons.append(f"{len(urls)} extracted link(s) exhibiting redirection or domain risks")
            if model_prob is not None and model_prob >= 0.70:
                reasons.append(f"a machine-learning spam probability of {model_prob * 100:.1f}%")
            if reasons:
                explanation_parts.append("Key risk drivers include " + ", ".join(reasons) + ".")
            else:
                explanation_parts.append("Strong linguistic hallmarks of unsolicited deceptive messaging detected.")
        elif verdict == "LIKELY SPAM":
            explanation_parts.append(
                f"Classified as LIKELY SPAM with an elevated risk score of {heuristic_risk_score}/100."
            )
            explanation_parts.append(
                f"Contains caution-level markers ({caution_count} caution, {high_count} high) warranting heightened skepticism."
            )
        else:
            explanation_parts.append(
                f"Assessed as NOT FLAGGED AS SPAM (Risk Score: {heuristic_risk_score}/100)."
            )
            explanation_parts.append(
                "No critical credential extraction, coercive deadlines, or high-risk domain anomalies were identified. "
                "However, lack of detection does not guarantee absolute safety; always remain vigilant."
            )

        explanation = " ".join(explanation_parts)

        # 8. Defensive Action Recommendations
        actions = []
        if cat_scores["credential_harvesting"] > 0:
            actions.append("Do NOT submit any usernames, passwords, or one-time passcodes (OTPs).")
        if cat_scores["suspicious_links"] > 0:
            actions.append("Avoid clicking any links; inspect hostnames and SSL certificates manually if necessary.")
        if cat_scores["impersonation"] > 0:
            actions.append("Contact the claimed sender or organization directly using a known official phone number or website.")
        if cat_scores["financial_pressure"] > 0:
            actions.append("Disregard claims of unexpected prize payouts, inheritances, or wire demands.")
        if cat_scores["urgency"] > 0:
            actions.append("Slow down: artificial time limits and threats of account closure are social-engineering pressure tactics.")

        if not actions:
            actions.append("Message appears routine. Follow standard cyber hygiene when opening attachments or external links.")
            actions.append("Verify sender identity if the message unexpectedly requests confidential business information.")

        return heuristic_risk_score, verdict, fingerprint, explanation, actions


risk_scorer = RiskScorer()
