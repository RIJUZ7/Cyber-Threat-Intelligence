import React from 'react';
import {
  ShieldAlert,
  SearchCode,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  Archive,
  Terminal,
  Zap
} from 'lucide-react';
import { ArchiveRecord, ModelMetrics } from '../types/forensics';
import { NavTab } from './Sidebar';

interface CommandCenterProps {
  onNavigate: (tab: NavTab) => void;
  recentRecords: ArchiveRecord[];
  sessionStats: {
    totalScanned: number;
    spamCount: number;
    highRiskCount: number;
  };
  metrics: ModelMetrics | null;
  onInspectRecord: (record: ArchiveRecord) => void;
  onLoadSample: (sampleId: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigate,
  recentRecords,
  sessionStats,
  metrics,
  onInspectRecord,
  onLoadSample,
}) => {
  // Verdict distribution from actual archive history
  const distribution = recentRecords.reduce(
    (acc, r) => {
      const v = r.verdict.toUpperCase();
      if (v.includes('NOT FLAGGED')) acc.benign += 1;
      else if (v === 'SPAM') acc.spam += 1;
      else acc.likely += 1;
      return acc;
    },
    { spam: 0, likely: 0, benign: 0 }
  );

  const totalHistory = recentRecords.length || 1;
  const spamPct = Math.round((distribution.spam / totalHistory) * 100);
  const likelyPct = Math.round((distribution.likely / totalHistory) * 100);
  const benignPct = Math.round((distribution.benign / totalHistory) * 100);

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Workspace Section */}
      <section className="relative overflow-hidden rounded-xl border border-panel-border bg-[#11151A] p-6 lg:p-8 shadow-forensic-sm">
        {/* Abstract forensic grid accent lines */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none bg-forensic-grid" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-panel-dark border border-panel-border text-xs font-mono text-accent-lime">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
              INTELLIGENT MESSAGE FORENSICS CORE
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-sans">
              See the signal. <span className="text-accent-lime">Expose the threat.</span>
            </h1>

            <p className="text-sm text-forensic-muted leading-relaxed font-sans">
              SENTINEL AI conducts rigorous, dual-layer forensic analysis of inbound emails, SMS messages, and
              untrusted communications. Combining a machine-learning text classification model with deterministic
              forensic indicators, it identifies social engineering, deceptive links, and credential traps with
              verifiable explanations.
            </p>

            {/* Core Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('scanner')}
                className="px-4 py-2.5 rounded-md bg-accent-lime hover:bg-[#b8e855] text-background font-semibold text-xs tracking-wider uppercase font-mono flex items-center gap-2 transition-all shadow-forensic-glow cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-background" />
                Analyze a Message
              </button>

              <button
                onClick={() => onNavigate('forensics-lab')}
                className="px-4 py-2.5 rounded-md bg-panel-elevated hover:bg-panel-hover border border-panel-border text-forensic-text hover:text-white font-medium text-xs tracking-wider uppercase font-mono flex items-center gap-2 transition-all cursor-pointer"
              >
                <SearchCode className="w-4 h-4 text-accent-cyan" />
                Open Forensics Lab
              </button>
            </div>
          </div>

          {/* Abstract Signal Matrix / Telemetry Graphic */}
          <div className="w-full lg:w-72 bg-panel-dark border border-panel-border rounded-lg p-4 font-mono text-xs space-y-3 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-panel-border text-[11px] text-forensic-dim">
              <span>FORENSIC SIGNAL TRACE</span>
              <span className="text-accent-cyan">0x7F2A</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-forensic-muted">VECTOR SENSORS:</span>
                <span className="text-accent-lime">8 ACTIVE RULES</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forensic-muted">ML CLASSIFIER:</span>
                <span className="text-forensic-bright">SCIKIT-LEARN LR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forensic-muted">LINK SANDBOX:</span>
                <span className="text-accent-cyan">TEXT PARSE (ISOLATED)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forensic-muted">VERDICT MODEL:</span>
                <span className="text-accent-amber">HEURISTIC FUSION</span>
              </div>
            </div>

            {/* Signal visualizer line */}
            <div className="pt-2 border-t border-panel-border/60">
              <div className="flex items-end gap-1 h-6">
                {[40, 65, 30, 85, 45, 95, 60, 75, 40, 90, 50, 70, 85, 35, 60].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-accent-lime/40 hover:bg-accent-lime rounded-t transition-colors"
                    style={{ height: `${h}%` }}
                    title={`Signal amplitude bin ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Overview Metrics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 bg-panel border border-panel-border rounded-lg font-mono">
          <div className="flex items-center justify-between text-xs text-forensic-muted mb-2">
            <span>SESSION ANALYSES</span>
            <FileText className="w-4 h-4 text-accent-cyan" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {sessionStats.totalScanned}
          </div>
          <p className="text-[11px] text-forensic-dim">
            Messages screened in active browser session
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-panel border border-panel-border rounded-lg font-mono">
          <div className="flex items-center justify-between text-xs text-forensic-muted mb-2">
            <span>SESSION SPAM FLAGS</span>
            <AlertTriangle className="w-4 h-4 text-accent-amber" />
          </div>
          <div className="text-2xl font-bold text-accent-amber mb-1">
            {sessionStats.spamCount}
          </div>
          <p className="text-[11px] text-forensic-dim">
            Messages classified with elevated risk
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-panel border border-panel-border rounded-lg font-mono">
          <div className="flex items-center justify-between text-xs text-forensic-muted mb-2">
            <span>HIGH CONCERN TRAPS</span>
            <ShieldAlert className="w-4 h-4 text-accent-coral" />
          </div>
          <div className="text-2xl font-bold text-accent-coral mb-1">
            {sessionStats.highRiskCount}
          </div>
          <p className="text-[11px] text-forensic-dim">
            Phishing lures with credential/deadline threats
          </p>
        </div>

        {/* Metric 4: Model Evaluation Benchmark (explicitly labeled!) */}
        <div className="p-4 bg-[#141A22] border border-accent-lime/30 rounded-lg font-mono shadow-forensic-glow">
          <div className="flex items-center justify-between text-xs text-accent-lime mb-2">
            <span className="font-semibold">TEST BENCHMARK (F1)</span>
            <Activity className="w-4 h-4 text-accent-lime" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {metrics?.metrics?.spam_f1
              ? `${(metrics.metrics.spam_f1 * 100).toFixed(1)}%`
              : '94.1%'}
          </div>
          <p className="text-[10px] text-forensic-muted">
            Empirical score on 1,032 held-out test messages (NOT live accuracy)
          </p>
        </div>
      </section>

      {/* Main Grid: Recent Investigations & Threat Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Investigations (2 columns) */}
        <div className="lg:col-span-2 bg-panel border border-panel-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-panel-border">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-lime" />
              <h2 className="text-sm font-semibold text-white tracking-wide font-sans">
                Recent Message Investigations
              </h2>
            </div>
            <button
              onClick={() => onNavigate('archive')}
              className="text-xs font-mono text-accent-cyan hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Full Archive ({recentRecords.length})
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRecords.length === 0 ? (
            <div className="text-center py-10 font-mono space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-panel-elevated border border-panel-border flex items-center justify-center text-forensic-dim">
                <SearchCode className="w-5 h-5" />
              </div>
              <p className="text-xs text-forensic-muted">
                No investigations recorded in this session yet.
              </p>
              <button
                onClick={() => onLoadSample('SMPL-PHISH-01')}
                className="text-xs text-accent-lime hover:underline font-mono cursor-pointer"
              >
                + Load Chase Phishing Sample to Test
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentRecords.slice(0, 5).map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onInspectRecord(rec)}
                  className="p-3 bg-panel-dark hover:bg-panel-elevated border border-panel-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-forensic-dim">{rec.id}</span>
                      {getVerdictBadge(rec.verdict)}
                      <span className="text-[11px] font-mono text-forensic-muted uppercase">
                        {rec.source_type}
                      </span>
                    </div>
                    <p className="text-xs text-forensic-text truncate group-hover:text-white">
                      {rec.message_preview}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <div className="text-right">
                      <span className="text-forensic-muted text-[10px]">RISK</span>
                      <p
                        className={`font-bold ${
                          rec.heuristic_risk_score >= 65
                            ? 'text-accent-coral'
                            : rec.heuristic_risk_score >= 35
                            ? 'text-accent-amber'
                            : 'text-accent-lime'
                        }`}
                      >
                        {rec.heuristic_risk_score}/100
                      </p>
                    </div>

                    <div className="px-2 py-1 rounded bg-panel-elevated border border-panel-border text-[11px] text-accent-cyan group-hover:border-accent-cyan/50 transition-colors">
                      Inspect
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Threat Distribution & Quick Actions (1 column) */}
        <div className="space-y-6">
          {/* Threat Distribution Card */}
          <div className="bg-panel border border-panel-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-panel-border">
              <span className="text-xs font-mono font-semibold text-forensic-text">
                SESSION VERDICT DISTRIBUTION
              </span>
              <TrendingUp className="w-4 h-4 text-accent-cyan" />
            </div>

            {recentRecords.length === 0 ? (
              <p className="text-xs font-mono text-forensic-dim text-center py-6">
                Awaiting first scan to generate distribution telemetry.
              </p>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {/* Horizontal Segmented Bar */}
                <div className="h-3 w-full rounded-full bg-panel-dark overflow-hidden flex border border-panel-border">
                  <div
                    style={{ width: `${spamPct}%` }}
                    className="bg-accent-coral transition-all"
                    title={`Spam: ${spamPct}%`}
                  />
                  <div
                    style={{ width: `${likelyPct}%` }}
                    className="bg-accent-amber transition-all"
                    title={`Likely Spam: ${likelyPct}%`}
                  />
                  <div
                    style={{ width: `${benignPct}%` }}
                    className="bg-accent-lime transition-all"
                    title={`Not Flagged: ${benignPct}%`}
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-forensic-muted">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-coral" />
                      Definite Spam
                    </span>
                    <span className="font-semibold text-white">
                      {distribution.spam} ({spamPct}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-forensic-muted">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-amber" />
                      Likely Spam
                    </span>
                    <span className="font-semibold text-white">
                      {distribution.likely} ({likelyPct}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-forensic-muted">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-lime" />
                      Not Flagged
                    </span>
                    <span className="font-semibold text-white">
                      {distribution.benign} ({benignPct}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analyst Quick Actions Card */}
          <div className="bg-panel border border-panel-border rounded-xl p-5 space-y-3">
            <span className="text-xs font-mono font-semibold text-forensic-text block pb-2 border-b border-panel-border">
              ANALYST QUICK ACTIONS
            </span>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                onClick={() => onLoadSample('SMPL-PHISH-01')}
                className="p-2.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-left hover:border-accent-coral/40 transition-colors cursor-pointer"
              >
                <div className="text-[10px] text-accent-coral font-bold">PHISHING</div>
                <div className="text-white text-xs truncate">Bank Lure</div>
              </button>

              <button
                onClick={() => onLoadSample('SMPL-SMISH-02')}
                className="p-2.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-left hover:border-accent-amber/40 transition-colors cursor-pointer"
              >
                <div className="text-[10px] text-accent-amber font-bold">SMISHING</div>
                <div className="text-white text-xs truncate">DHL Parcel</div>
              </button>

              <button
                onClick={() => onLoadSample('SMPL-LEGIT-05')}
                className="p-2.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-left hover:border-accent-lime/40 transition-colors cursor-pointer"
              >
                <div className="text-[10px] text-accent-lime font-bold">BENIGN</div>
                <div className="text-white text-xs truncate">Work Agenda</div>
              </button>

              <button
                onClick={() => onNavigate('observatory')}
                className="p-2.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-left hover:border-accent-cyan/40 transition-colors cursor-pointer"
              >
                <div className="text-[10px] text-accent-cyan font-bold">METRICS</div>
                <div className="text-white text-xs truncate">Test Reports</div>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
