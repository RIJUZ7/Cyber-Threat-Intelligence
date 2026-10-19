"""
Threat Archive persistence and query service for SENTINEL AI.
Provides local investigation archiving, filtering, searching, sorting, and JSON/CSV export.
"""

import os
import io
import csv
import json
import threading
from typing import List, Dict, Any, Optional
from ..core.config import settings
from ..schemas.forensics import ArchiveRecord, ArchiveFilterRequest, AnalyzeResponse


class ArchiveService:
    def __init__(self, storage_path: Optional[str] = None):
        self.storage_path = storage_path or settings.ARCHIVE_PATH
        self.lock = threading.Lock()
        self._ensure_storage()

    def _ensure_storage(self):
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        if not os.path.exists(self.storage_path):
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read_records(self) -> List[Dict[str, Any]]:
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_records(self, records: List[Dict[str, Any]]):
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)

    def save_analysis(self, analysis: AnalyzeResponse) -> ArchiveRecord:
        """
        Save an analysis response to the archive store.
        """
        preview = analysis.raw_message[:120].strip()
        if len(analysis.raw_message) > 120:
            preview += "..."

        high_sev = sum(1 for e in analysis.evidence_indicators if e.severity == "high")

        record = ArchiveRecord(
            id=analysis.investigation_id,
            timestamp=analysis.timestamp,
            verdict=analysis.verdict,
            heuristic_risk_score=analysis.heuristic_risk_score,
            source_type=analysis.source_type,
            sender=analysis.sender,
            message_preview=preview,
            evidence_count=len(analysis.evidence_indicators),
            high_severity_count=high_sev,
            analysis_data=analysis
        )

        with self.lock:
            records = self._read_records()
            # Replace if already exists, else prepend
            records = [r for r in records if r.get("id") != record.id]
            records.insert(0, record.model_dump())
            self._write_records(records)

        return record

    def list_records(self, filter_req: Optional[ArchiveFilterRequest] = None) -> List[Dict[str, Any]]:
        """
        Filter, search, and sort archived investigations.
        """
        records = self._read_records()

        if not filter_req:
            return records

        filtered = []
        q = (filter_req.query or "").lower().strip()
        verdict_f = (filter_req.verdict or "").upper().strip()
        source_f = (filter_req.source_type or "").lower().strip()
        sev_f = (filter_req.severity or "").lower().strip()

        for r in records:
            # Query match against ID or message preview
            if q:
                id_match = q in r.get("id", "").lower()
                preview_match = q in r.get("message_preview", "").lower()
                sender_match = q in (r.get("sender") or "").lower()
                if not (id_match or preview_match or sender_match):
                    continue

            # Verdict match
            if verdict_f and verdict_f != "ALL":
                if r.get("verdict", "").upper() != verdict_f:
                    continue

            # Source match
            if source_f and source_f != "all":
                if r.get("source_type", "").lower() != source_f:
                    continue

            # Severity filter
            if sev_f and sev_f != "all":
                if sev_f == "high" and r.get("high_severity_count", 0) == 0:
                    continue
                elif sev_f == "caution" and r.get("evidence_count", 0) == 0:
                    continue

            filtered.append(r)

        # Sort
        if filter_req.sort_by == "oldest":
            filtered.sort(key=lambda x: x.get("timestamp", ""))
        else:
            filtered.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        return filtered

    def get_record(self, record_id: str) -> Optional[Dict[str, Any]]:
        records = self._read_records()
        for r in records:
            if r.get("id") == record_id:
                return r
        return None

    def delete_record(self, record_id: str) -> bool:
        with self.lock:
            records = self._read_records()
            initial_len = len(records)
            records = [r for r in records if r.get("id") != record_id]
            if len(records) < initial_len:
                self._write_records(records)
                return True
            return False

    def clear_archive(self) -> int:
        with self.lock:
            records = self._read_records()
            count = len(records)
            self._write_records([])
            return count

    def export_csv(self, records: List[Dict[str, Any]]) -> str:
        output = io.StringIO()
        fieldnames = [
            "id", "timestamp", "verdict", "heuristic_risk_score",
            "source_type", "sender", "message_preview",
            "evidence_count", "high_severity_count"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for r in records:
            writer.writerow(r)
        return output.getvalue()


archive_service = ArchiveService()
