"""
Forensic Evidence Engine for SENTINEL AI.
Extracts explainable indicators, suspicious URLs, formatting anomalies, and structural patterns.
All detections are deterministic, explainable, and safe (no external network execution).
"""

import re
import urllib.parse
from typing import List, Dict, Any, Tuple
from ..schemas.forensics import EvidenceIndicator, ExtractedUrl, TextStatistics

# URL Shorteners frequently abused in smishing/phishing
KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly",
    "goo.gl", "rebrand.ly", "cutt.ly", "shorturl.at", "tiny.cc", "v.gd"
}

# Suspicious TLDs with disproportionate malicious registration rates
SUSPICIOUS_TLDS = {
    "xyz", "top", "work", "click", "loan", "racing", "gq", "tk",
    "ml", "cf", "fit", "buzz", "rest", "support", "country", "kim"
}

# High-profile brands frequently targeted for impersonation
HIGH_VALUE_TARGETS = [
    "paypal", "apple", "amazon", "microsoft", "google", "netflix",
    "chase", "wells fargo", "bank of america", "citibank", "fedex",
    "ups", "dhl", "usps", "irs", "hmrc", "dhl", "crypto", "binance",
    "coinbase", "metamask", "whatsapp", "facebook", "instagram"
]

# Forensic Rules Definition
FORENSIC_RULES = [
    # 1. Urgent or Coercive Language
    {
        "rule_id": "R-URG-01",
        "category": "Urgent & Coercive Language",
        "name": "Immediate Action Demand",
        "severity": "high",
        "pattern": r"(?i)\b(immediate(?:ly)?\s+action\s+required|act\s+now|urgent(?:ly)?\s+required|action\s+needed\s+immediately|respond\s+within\s+\d+\s*(?:hours|hrs|mins|minutes)|expires\s+(?:today|in\s+\d+\s*hours))\b",
        "explanation": "Threat actors manufacture artificial urgency to bypass logical evaluation and provoke hasty compliance.",
        "action": "Do not rush. Independently verify the claim via a trusted, known communication channel before responding."
    },
    {
        "rule_id": "R-URG-02",
        "category": "Urgent & Coercive Language",
        "name": "Imminent Deadline or Expiry Warning",
        "severity": "caution",
        "pattern": r"(?i)\b(final\s+notice|last\s+chance|deadline\s+approaching|time\s+sensitive|do\s+not\s+ignore|within\s+24\s*hours|valid\s+for\s+\d+\s*mins?)\b",
        "explanation": "Artificial time limits pressure targets to act before consulting colleagues or checking security policies.",
        "action": "Pause and assess whether the sender has established genuine authority or precedent for such deadlines."
    },

    # 2. Credential Harvesting & Sensitive Info Requests
    {
        "rule_id": "R-SEC-01",
        "category": "Credential Harvesting",
        "name": "Password or Passcode Solicitation",
        "severity": "high",
        "pattern": r"(?i)\b(enter\s+your\s+password|verify\s+your\s+password|reset\s+your\s+passcode|provide\s+your\s+credentials|login\s+to\s+re-activate|confirm\s+your\s+pin)\b",
        "explanation": "Legitimate services rarely request direct password entry or confirmation via unsolicited messages.",
        "action": "Never provide passwords, passcodes, or credentials in response to an email, SMS, or inbound message."
    },
    {
        "rule_id": "R-SEC-02",
        "category": "Credential Harvesting",
        "name": "One-Time Passcode (OTP) Extraction",
        "severity": "high",
        "pattern": r"(?i)\b(send\s+(?:us\s+)?the\s+otp|reply\s+with\s+(?:your\s+)?code|share\s+the\s+verification\s+code|enter\s+the\s+6[\s-]digit\s+code|do\s+not\s+share\s+this\s+code\s+with\s+anyone\s+except)\b",
        "explanation": "Direct requests to share or reply with OTP codes indicate an ongoing account-takeover or MFA bypass attempt.",
        "action": "Do not forward or reply with any verification codes. OTP codes should only be entered into verified login dialogs."
    },
    {
        "rule_id": "R-SEC-03",
        "category": "Credential Harvesting",
        "name": "Banking & Identity Data Request",
        "severity": "high",
        "pattern": r"(?i)\b(social\s+security\s+number|ssn|bank\s+account\s+number|routing\s+number|cvv|credit\s+card\s+number|billing\s+details\s+update|verify\s+your\s+identity)\b",
        "explanation": "Requests for sensitive identification or financial numbers are prime targets in identity theft and fraudulent transactions.",
        "action": "Never disclose banking or national identification numbers via unverified text or email links."
    },

    # 3. Financial Lure & Unrealistic Rewards
    {
        "rule_id": "R-LUR-01",
        "category": "Financial Lure",
        "name": "Unsolicited Prize or Lottery Claim",
        "severity": "high",
        "pattern": r"(?i)\b(you(?:\s*have|\s*'ve)?\s+won|selected\s+to\s+receive|lottery\s+winner|claim\s+your\s+(?:prize|\$\d+|cash|gift\s*card)|unclaimed\s+(?:reward|funds)|jackpot|free\s+crypto(?:currency)?)\b",
        "explanation": "Unsolicited lottery winnings, unexpected windfalls, and high-value rewards exploit curiosity and greed to solicit advance fees or credentials.",
        "action": "Recognize that genuine organizations do not award prizes for contests you never entered."
    },
    {
        "rule_id": "R-LUR-02",
        "category": "Financial Lure",
        "name": "High-Value Compensation / Inheritance Bait",
        "severity": "caution",
        "pattern": r"(?i)\b(\$\s*\d{3,}(?:,\d{3})*(?:\.\d+)?|\b\d{3,}(?:,\d{3})*\s*(?:usd|dollars|pounds|gbp|eur|euro)|compensation\s+fund|inheritance\s+funds|wire\s+transfer\s+of\b)",
        "explanation": "Promising massive cash sums or wire transfers is a hallmark of advance-fee (419) scams.",
        "action": "Ignore unsolicited promises of wealth or funds requiring an upfront processing fee."
    },

    # 4. Payment Demands & Account Suspension Threats
    {
        "rule_id": "R-THR-01",
        "category": "Threat & Extortion",
        "name": "Account Suspension / Termination Threat",
        "severity": "high",
        "pattern": r"(?i)\b(account\s+(?:has\s+been|will\s+be)\s+(?:suspended|terminated|locked|closed|disabled)|access\s+restricted|legal\s+action\s+will\s+be\s+taken|warrant\s+issued|law\s+enforcement\s+contacted)\b",
        "explanation": "Coercive threats of account deactivation or legal prosecution compel victims to act out of fear without verifying legitimacy.",
        "action": "Check the account status directly on the official app or website by typing the verified URL in your browser."
    },
    {
        "rule_id": "R-THR-02",
        "category": "Threat & Extortion",
        "name": "Overdue Payment / Unauthorized Transaction Alert",
        "severity": "caution",
        "pattern": r"(?i)\b(overdue\s+invoice|unauthorized\s+transaction|fraudulent\s+charge\s+detected|payment\s+declined|suspicious\s+activity\s+detected\s+on\s+your\s+card|charge\s+of\s+\$\d+)\b",
        "explanation": "Fake transaction alerts provoke immediate panic to get victims on the phone with fraudulent support centers.",
        "action": "Log into your financial institution's official app or check credit card statements independently."
    },

    # 5. Impersonation Indicators
    {
        "rule_id": "R-IMP-01",
        "category": "Impersonation",
        "name": "Brand Security / Fraud Dept Impersonation",
        "severity": "high",
        "pattern": r"(?i)\b((?:paypal|apple|amazon|microsoft|google|netflix|chase|wells\s+fargo|bank\s+of\s+america|binance|coinbase)\s+(?:security\s+team|fraud\s+department|support\s+desk|billing\s+department|account\s+team))\b",
        "explanation": "Attackers pose as respected security or fraud prevention departments to create an illusion of institutional trust.",
        "action": "Do not trust sender names in message text. Always verify through the organization's official public helpline."
    },
    {
        "rule_id": "R-IMP-02",
        "category": "Impersonation",
        "name": "Logistics & Delivery Parcel Alert",
        "severity": "caution",
        "pattern": r"(?i)\b((?:fedex|ups|dhl|usps|royal\s+mail)\s+(?:parcel|delivery|package|shipment|tracking)\s+(?:pending|failed|held|on\s+hold|requires\s+redirection|fee\s+unpaid))\b",
        "explanation": "Smishing operators exploit parcel deliveries with fake tracking updates to charge small 'redelivery fees' and capture card details.",
        "action": "Trace shipments only through official carrier apps or by entering the tracking code on carrier domains directly."
    },

    # 6. Action Pressure & Deceptive Links
    {
        "rule_id": "R-ACT-01",
        "category": "Action Pressure",
        "name": "Direct Call-to-Action Link",
        "severity": "caution",
        "pattern": r"(?i)\b(click\s+(?:here|the\s+link|below)|follow\s+this\s+link|tap\s+(?:here|the\s+link)|download\s+(?:attachment|the\s+file)|open\s+the\s+attached\s+pdf|call\s+(?:toll\s+free|immediately))\b",
        "explanation": "Direct instructions to click or call remove friction and guide victims directly into malicious funnels.",
        "action": "Do not click links embedded in unsolicited messages. Inspect the destination domain carefully."
    },
    {
        "rule_id": "R-ACT-02",
        "category": "Action Pressure",
        "name": "Instruction to Reply with Sensitive Action",
        "severity": "info",
        "pattern": r"(?i)\b(reply\s+(?:with\s+yes|stop\s+to\s+opt\s*out|confirm\s+or\s+cancel|with\s+your\s+name))\b",
        "explanation": "Prompts to reply are often used to validate that a phone number or mailbox is actively monitored.",
        "action": "Be aware that replying to spam often confirms your contact information as active to spam aggregators."
    }
]


class EvidenceEngine:
    """
    Forensic engine analyzing messages for deceptive indicators, suspicious links,
    and linguistic anomalies.
    """

    @staticmethod
    def extract_urls(text: str) -> List[ExtractedUrl]:
        """
        Safely extract all URLs and analyze domains for forensic anomalies.
        Never executes or visits any URL.
        """
        # Match standard HTTP/HTTPS URLs as well as naked domains with www
        url_pattern = re.compile(
            r'(?:https?://|www\.)[^\s<>"\'`\(\)\[\]]+',
            re.IGNORECASE
        )
        
        matches = url_pattern.findall(text)
        extracted: List[ExtractedUrl] = []
        seen_urls = set()

        for raw_url in matches:
            # Strip trailing punctuation commonly appended in sentences
            cleaned_url = raw_url.rstrip(".,;!?:)'\"]}")
            if cleaned_url in seen_urls:
                continue
            seen_urls.add(cleaned_url)

            # Ensure schema for parsing
            parse_target = cleaned_url
            if not parse_target.startswith(("http://", "https://")):
                parse_target = "http://" + parse_target

            try:
                parsed = urllib.parse.urlparse(parse_target)
                domain = (parsed.hostname or "").lower()
                scheme = parsed.scheme.lower()
            except Exception:
                domain = "unparseable-domain"
                scheme = "unknown"

            # Check for direct IP address in domain
            is_ip = bool(re.match(r"^(\d{1,3}\.){3}\d{1,3}$", domain))
            
            # Check for URL shorteners
            is_shortened = domain in KNOWN_SHORTENERS

            # Check for suspicious TLD
            tld = domain.split(".")[-1] if "." in domain else ""
            suspicious_tld = tld in SUSPICIOUS_TLDS

            # Check for lookalike or brand keywords in non-brand domains
            has_lookalike_terms = False
            for brand in HIGH_VALUE_TARGETS:
                if brand in domain and not domain.endswith(f".{brand}.com") and domain != f"{brand}.com":
                    has_lookalike_terms = True
                    break

            # Formulate risk note
            risk_notes = []
            if is_ip:
                risk_notes.append("Raw IP address used instead of hostname")
            if is_shortened:
                risk_notes.append(f"Shortened URL masks final destination ({domain})")
            if suspicious_tld:
                risk_notes.append(f"High-abuse top level domain (.{tld})")
            if has_lookalike_terms:
                risk_notes.append("Contains high-value brand name in suspicious domain structure")
            if not risk_notes:
                risk_notes.append("Standard URL structure; verify destination authenticity independently")

            extracted.append(ExtractedUrl(
                url=cleaned_url,
                domain=domain,
                scheme=scheme,
                is_ip=is_ip,
                is_shortened=is_shortened,
                suspicious_tld=suspicious_tld,
                has_lookalike_terms=has_lookalike_terms,
                risk_note="; ".join(risk_notes)
            ))

        return extracted

    @staticmethod
    def extract_indicators(text: str) -> List[EvidenceIndicator]:
        """
        Apply deterministic regex forensic rules against text.
        Returns list of matched indicators with offsets, severity, and rationale.
        """
        indicators: List[EvidenceIndicator] = []
        indicator_id_counter = 1

        for rule in FORENSIC_RULES:
            pattern = re.compile(rule["pattern"])
            for match in pattern.finditer(text):
                matched_str = match.group(0)
                start, end = match.span()

                indicators.append(EvidenceIndicator(
                    id=f"IND-{indicator_id_counter:03d}",
                    rule_id=rule["rule_id"],
                    category=rule["category"],
                    name=rule["name"],
                    severity=rule["severity"],
                    matched_text=matched_str,
                    start_idx=start,
                    end_idx=end,
                    explanation=rule["explanation"],
                    recommended_action=rule["action"]
                ))
                indicator_id_counter += 1

        return indicators

    @staticmethod
    def calculate_text_statistics(text: str) -> TextStatistics:
        """
        Calculate character, word, line counts, uppercase ratio, and structural markers.
        """
        char_count = len(text)
        words = text.split()
        word_count = len(words)
        line_count = len(text.splitlines()) if text else 0

        # Calculate uppercase ratio among alphabetic characters
        alpha_chars = [c for c in text if c.isalpha()]
        upper_chars = [c for c in alpha_chars if c.isupper()]
        uppercase_ratio = round(len(upper_chars) / len(alpha_chars), 3) if alpha_chars else 0.0

        # Punctuation & special chars
        punctuation_count = len(re.findall(r"[!?,:;.-]", text))
        special_char_count = len(re.findall(r"[$%#@*&^~_{}|<>]", text))

        return TextStatistics(
            char_count=char_count,
            word_count=word_count,
            line_count=line_count,
            uppercase_ratio=uppercase_ratio,
            punctuation_count=punctuation_count,
            special_char_count=special_char_count
        )


# Global instance
evidence_engine = EvidenceEngine()
