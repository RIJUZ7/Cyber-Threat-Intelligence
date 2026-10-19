import React, { useState } from 'react';
import {
  Archive,
  Search,
  Filter,
  Download,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  FileSpreadsheet,
  FileCode,
  ExternalLink,
  ShieldCheck,
  SearchCode
} from 'lucide-react';
import { ArchiveRecord, AnalyzeResponse } from '../types/forensics';
import { api } from '../services/api';

interface ThreatArchiveProps {
  records: ArchiveRecord[];
  onInspectRecord: (record: ArchiveRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
  onClearArchive: () => Promise<void>;
}

export const ThreatArchive: React.FC<ThreatArchiveProps> = ({
  records,
  onInspectRecord,
  onDeleteRecord,
  onClearArchive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);

  // Client-side filtering & sorting for snappy UX
  const filteredRecords = records
    .filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesPreview = r.message_preview.toLowerCase().includes(q);
        const matchesSender = (r.sender || '').toLowerCase().includes(q);
        if (!matchesId && !matchesPreview && !matchesSender) return false;
      }

      if (verdictFilter !== 'ALL') {
        if (verdictFilter === 'SPAM' && r.verdict !== 'SPAM') return false;
        if (verdictFilter === 'LIKELY SPAM' && r.verdict !== 'LIKELY SPAM') return false;
        if (verdictFilter === 'NOT FLAGGED' && !r.verdict.includes('NOT FLAGGED')) return false;
      }

      if (severityFilter !== 'ALL') {
        if (severityFilter === 'HIGH' && r.high_severity_count === 0) return false;
        if (severityFilter === 'CAUTION' && r.evidence_count === 0) return false;
      }

      if (sourceFilter !== 'ALL') {
        if (r.source_type.toUpperCase() !== sourceFilter) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const getVerdictBadge = (verdict: string) => {
    if (verdict === 'SPAM') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-accent-coral/10 text-accent-coral border border-accent-coral/40">
          SPAM
        </span>
      );
    }
    if (verdict === 'LIKELY SPAM') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-accent-amber/10 text-accent-amber border border-accent-amber/40">
          LIKELY SPAM
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-accent-lime/10 text-accent-lime border border-accent-lime/40">
        NOT FLAGGED
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-mono text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-panel-border gap-3">
        <div>
          <h1 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-accent-cyan" />
            Threat Archive & Investigation Ledger
          </h1>
          <p className="text-forensic-muted text-xs">
            Persistent local record repository. Stored securely on this workstation; never transmitted to external clouds.
          </p>
        </div>

        {/* Export & Clear Actions */}
        <div className="flex items-center gap-2">
          <a
            href={api.getExportCsvUrl()}
            download="sentinel_archive.csv"
            className="px-3 py-1.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-forensic-text hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-accent-lime" />
            <span>Export CSV</span>
          </a>

          <a
            href={api.getExportJsonUrl()}
            download="sentinel_archive.json"
            className="px-3 py-1.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-forensic-text hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Export JSON</span>
          </a>

          <button
            onClick={() => setClearConfirmOpen(true)}
            className="px-3 py-1.5 rounded bg-accent-coral/10 hover:bg-accent-coral/20 border border-accent-coral/40 text-accent-coral flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Archive</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-panel border border-panel-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-forensic-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search message text, sender, or ID..."
              className="w-full bg-panel-dark border border-panel-border rounded pl-9 pr-3 py-2 text-forensic-text placeholder-forensic-dim focus:border-accent-cyan outline-none"
            />
          </div>

          {/* Verdict Filter */}
          <div>
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="w-full bg-panel-dark border border-panel-border rounded px-3 py-2 text-forensic-text focus:border-accent-cyan outline-none"
            >
              <option value="ALL">All Verdicts</option>
              <option value="SPAM">Definite Spam</option>
              <option value="LIKELY SPAM">Likely Spam</option>
              <option value="NOT FLAGGED">Not Flagged</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-panel-dark border border-panel-border rounded px-3 py-2 text-forensic-text focus:border-accent-cyan outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High Severity Only</option>
              <option value="CAUTION">Has Indicators</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="w-full py-2 px-3 bg-panel-dark hover:bg-panel-elevated border border-panel-border rounded text-forensic-text hover:text-white flex items-center justify-between cursor-pointer"
            >
              <span className="capitalize">{sortOrder} First</span>
              <ArrowUpDown className="w-3.5 h-3.5 text-forensic-muted" />
            </button>
          </div>
        </div>
      </div>

      {/* Investigations Table / List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-panel border border-panel-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-panel-elevated border border-panel-border flex items-center justify-center text-forensic-dim">
            <Archive className="w-6 h-6" />
          </div>
          <p className="text-white font-sans font-bold">No Records Match Active Filters</p>
          <p className="text-xs text-forensic-muted max-w-sm mx-auto">
            Try adjusting your search query, or run new scans via the Message Scanner.
          </p>
        </div>
      ) : (
        <div className="bg-panel border border-panel-border rounded-xl overflow-hidden shadow-forensic-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-panel-dark text-forensic-dim uppercase text-[10px] border-b border-panel-border">
                <tr>
                  <th className="p-3">Investigation ID</th>
                  <th className="p-3">Verdict</th>
                  <th className="p-3">Risk Score</th>
                  <th className="p-3">Channel / Sender</th>
                  <th className="p-3">Message Preview</th>
                  <th className="p-3">Evidence</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-panel-dark/50 transition-colors">
                    <td className="p-3 text-forensic-bright font-bold whitespace-nowrap">
                      {r.id}
                      <span className="block text-[10px] text-forensic-dim font-normal">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">{getVerdictBadge(r.verdict)}</td>

                    <td className="p-3 whitespace-nowrap font-bold">
                      <span
                        className={
                          r.heuristic_risk_score >= 65
                            ? 'text-accent-coral'
                            : r.heuristic_risk_score >= 35
                            ? 'text-accent-amber'
                            : 'text-accent-lime'
                        }
                      >
                        {r.heuristic_risk_score}/100
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap text-forensic-muted">
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-panel-dark border border-panel-border/80 mr-1.5">
                        {r.source_type}
                      </span>
                      <span className="truncate max-w-[140px] inline-block align-middle">
                        {r.sender || 'Anonymous'}
                      </span>
                    </td>

                    <td className="p-3 text-forensic-text max-w-xs truncate">
                      {r.message_preview}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className="text-forensic-dim">
                        {r.evidence_count} found
                        {r.high_severity_count > 0 && (
                          <span className="text-accent-coral font-bold ml-1">
                            ({r.high_severity_count} high)
                          </span>
                        )}
                      </span>
                    </td>

                    <td className="p-3 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => onInspectRecord(r)}
                        className="px-2.5 py-1 rounded bg-panel-elevated hover:bg-panel-hover border border-panel-border text-accent-cyan transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>

                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="px-2 py-1 rounded bg-panel-dark hover:bg-accent-coral/20 border border-panel-border text-forensic-dim hover:text-accent-coral transition-colors cursor-pointer"
                        title="Delete investigation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Archive */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-panel border border-accent-coral/60 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-accent-coral">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-sans font-bold text-lg text-white">
                Clear Investigation Archive?
              </h3>
            </div>

            <p className="text-xs text-forensic-muted leading-relaxed">
              This action will permanently delete all {records.length} archived message forensics records from this workstation. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setClearConfirmOpen(false)}
                className="px-3 py-1.5 rounded bg-panel-dark border border-panel-border text-forensic-text hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onClearArchive();
                  setClearConfirmOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-accent-coral text-white font-bold hover:bg-[#e8535f] cursor-pointer"
              >
                Confirm Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
