"""
Built-in curated forensic sample messages for analyst testing in SENTINEL AI.
All samples are clearly labelled as demonstration cases across phishing, smishing, and legitimate messages.
"""

from typing import List
from ..schemas.forensics import SampleMessage

SAMPLE_MESSAGES: List[SampleMessage] = [
    SampleMessage(
        id="SMPL-PHISH-01",
        title="Urgent Bank Security Alert (Phishing)",
        category="Phishing Email",
        source_type="email",
        sender="Chase Bank Security <alerts-security@chase-verification-update.xyz>",
        preview="URGENT: Unauthorized charge detected. Immediate action required to prevent account suspension.",
        full_text=(
            "From: Chase Fraud Department <security@chase-auth-portal.xyz>\n"
            "Subject: Immediate action required: Unauthorized transaction on your account\n\n"
            "Dear Customer,\n\n"
            "Our automated fraud detection system detected an unauthorized charge of $1,842.50 on your credit card. "
            "Your account has been temporarily restricted for your protection.\n\n"
            "IMMEDIATE ACTION REQUIRED: You must verify your password, account details, and enter the OTP sent to your "
            "phone within 24 hours. Failure to respond will result in permanent account termination and legal action.\n\n"
            "Click here to confirm your identity immediately:\n"
            "http://192.168.1.105/chase-login/verify.php?token=938210\n\n"
            "Do not ignore this warning.\n\n"
            "Chase Security Team"
        ),
        expected_risk="high",
        description="Classic multi-vector phishing combining IP-based destination, urgency demands, brand impersonation, and OTP solicitation."
    ),
    SampleMessage(
        id="SMPL-SMISH-02",
        title="DHL Parcel Redirection (Smishing SMS)",
        category="Smishing SMS",
        source_type="sms",
        sender="+1 (800) 555-0199",
        preview="DHL Express: Your shipment #849201 is on hold due to unpaid customs fee ($2.40). Redirection required.",
        full_text=(
            "DHL Express: Your parcel delivery #98214 is on hold at our local hub due to an unpaid customs fee of $2.40. "
            "Action needed immediately: Update billing details and reschedule delivery within 12 hours or item will be returned to sender: "
            "https://bit.ly/dhl-track-98214"
        ),
        expected_risk="high",
        description="Parcel delivery smishing SMS using a shortened URL to mask a malicious credential and card harvesting form."
    ),
    SampleMessage(
        id="SMPL-LOTT-03",
        title="Lottery Jackpot Claim (Lure Scam)",
        category="Lottery Scam",
        source_type="sms",
        sender="WINNER-ALERT",
        preview="CONGRATULATIONS! You have won $1,500,000 in the International Mobile Lottery. Claim prize now.",
        full_text=(
            "CONGRATULATIONS! You have been selected as the grand winner of $1,500,000 USD in the 2026 International Mobile Draw! "
            "To claim your cash prize, reply with your full name, bank account number, and social security number. "
            "Call immediately at +44-20-7946-0921 or visit www.international-lottery-claims.top to process your wire transfer today."
        ),
        expected_risk="high",
        description="Advance-fee financial lure employing excessive capitalization, implausible dollar amounts, and banking details harvesting."
    ),
    SampleMessage(
        id="SMPL-CORP-04",
        title="IT Helpdesk Password Expiry (Corporate Phishing)",
        category="Phishing Email",
        source_type="email",
        sender="IT Administrator <helpdesk@corporate-support-desk.top>",
        preview="Action Required: Your Microsoft 365 password expires today. Reset passcode to retain email access.",
        full_text=(
            "Notice from Corporate IT Support Desk:\n\n"
            "Your Microsoft 365 workstation password expires in 2 hours. To avoid being locked out of your corporate email "
            "and VPN credentials, reset your passcode immediately by clicking below:\n\n"
            "https://microsoft-login-auth.work/adfs/ls/idp.aspx\n\n"
            "Provide your existing username and password to complete authentication.\n\n"
            "IT Helpdesk Operations"
        ),
        expected_risk="high",
        description="Corporate credential harvesting using fake IT department impersonation, urgency countdown, and lookalike domain."
    ),
    SampleMessage(
        id="SMPL-LEGIT-05",
        title="Quarterly Review Agenda (Legitimate Email)",
        category="Legitimate Email",
        source_type="email",
        sender="Elena Rostova <elena.rostova@internalcorp.com>",
        preview="Hi team, attached is the draft agenda for our Q4 engineering sync on Thursday at 2 PM.",
        full_text=(
            "Hi everyone,\n\n"
            "Hope you are having a productive week. Ahead of our quarterly planning sync scheduled for Thursday at 2:00 PM EST, "
            "I have outlined our core discussion topics below:\n\n"
            "1. Review of sprint velocity and architectural milestones\n"
            "2. Roadmap prioritization for the new telemetry ingestion pipeline\n"
            "3. Team staffing and open design requisitions\n\n"
            "Please review the slide deck beforehand and feel free to add any additional topics to the shared document. "
            "Looking forward to our discussion.\n\n"
            "Best regards,\n"
            "Elena Rostova\n"
            "Engineering Lead"
        ),
        expected_risk="low",
        description="Routine workplace internal coordination with polite tone, no coercive language, and no suspicious links."
    ),
    SampleMessage(
        id="SMPL-LEGIT-06",
        title="Casual Lunch Coordination (Legitimate SMS)",
        category="Legitimate SMS",
        source_type="sms",
        sender="+1 (415) 555-8392",
        preview="Hey! Are you still free to grab lunch around 12:30 today? Let me know what you're craving.",
        full_text=(
            "Hey Sarah! Are you still free to grab lunch around 12:30 today? Let me know if that sushi place downtown "
            "works for you, or we can check out the new deli on 4th street. See you soon!"
        ),
        expected_risk="low",
        description="Conversational peer-to-peer SMS message without any commercial solicitation, URLs, or pressure."
    ),
    SampleMessage(
        id="SMPL-PROMO-07",
        title="Weekend Flash Sale (Promotional Marketing)",
        category="Promotional Email",
        source_type="email",
        sender="Outdoor Gear Store <newsletter@outdoorgearstore.com>",
        preview="Special Offer: 30% off all camping equipment this weekend only. Free shipping on orders over $50.",
        full_text=(
            "Hello Adventurer!\n\n"
            "This weekend only, enjoy 30% off our best-selling hiking and camping gear. Use code EXPLORE30 at checkout. "
            "Offer valid through Sunday midnight.\n\n"
            "Browse deals online at www.outdoorgearstore.com/weekend-sale.\n\n"
            "You received this message because you subscribed to our loyalty updates. "
            "Reply with STOP to opt out, or click unsubscribe to manage your preferences."
        ),
        expected_risk="medium",
        description="Commercial marketing email with mild urgency ('this weekend only') and standard opt-out instructions, typical of legitimate retail."
    )
]


def get_all_samples() -> List[SampleMessage]:
    return SAMPLE_MESSAGES


def get_sample_by_id(sample_id: str) -> SampleMessage:
    for s in SAMPLE_MESSAGES:
        if s.id == sample_id:
            return s
    return SAMPLE_MESSAGES[0]
