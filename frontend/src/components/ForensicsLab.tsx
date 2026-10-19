import React, { useState } from 'react';
import {
  SearchCode,
  Binary,
  Code,
  Copy,
  Clock,
  Layers,
  AlertTriangle,
  FileText,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Hash,
  Activity,
  ArrowRight
} from 'lucide-react';
import { AnalyzeResponse } from '../types/forensics';

interface ForensicsLabProps {
  currentAnalysis: AnalyzeResponse | null;
  onReset: () => void;
  onNavigateToScanner: () => void;
}

export const ForensicsLab: React.FC<ForensicsLabProps> = ({
  currentAnalysis,
  onReset,
  onNavigateToScanner,
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'tokens' | 'timeline' | 'json'>('evidence');
  const [copiedJson, setCopiedJson] = useState(false);

  if (!currentAnalysis) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center font-mono space-y-4">
        <div className="w-16 h-16 mx-auto rounded-xl bg-panel border border-panel-border flex items-center justify-center text-accent-cyan shadow-forensic-glow">
          <SearchCode className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-sans text-white">Forensics Lab Idle</h2>
        <p className="text-xs text-forensic-muted max-w-md mx-auto">
          No active investigation payload loaded. Run a scan from the Message Scanner or load a curated sample to inspect linguistic markers and internal model attributions.
        </p>
        <button
          onClick={onNavigateToScanner}
          className="px-4 py-2 rounded bg-accent-lime text-background font-semibold text-xs tracking-wider uppercase font-mono hover:bg-[#b8e855] transition-colors cursor-pointer"
        >
          Open Message Scanner
        </button>
      </div>
    );
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentAnalysis, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const rawLines = currentAnalysis.raw_message.split('\n');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-mono text-xs">
      {/* Top Investigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-panel-border gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-panel border border-panel-border text-accent-cyan">
            <SearchCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm font-sans">
                Forensics Lab Investigation
              </span>
              <span className="px-1.5 py-0.5 rounded bg-panel-elevated border border-panel-border text-forensic-text text-[10px]">
                {currentAnalysis.investigation_id}
              </span>
            </div>
            <p className="text-[11px] text-forensic-muted">
              Deep token attribution, deterministic rule tracing, and URL isolation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-forensic-text hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-accent-cyan" />
            <span>{copiedJson ? 'JSON Copied!' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-forensic-muted hover:text-accent-coral flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Lab</span>
          </button>
        </div>
      </div>

      {/* Editor-Style Layout: Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Message Editor Panel with Line Numbers (5 cols) */}
        <div className="lg:col-span-5 bg-panel border border-panel-border rounded-xl p-4 space-y-3 flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-2 border-b border-panel-border text-[11px]">
            <span className="text-forensic-dim font-bold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent-lime" />
              PAYLOAD BUFFER ({currentAnalysis.source_type.toUpperCase()})
            </span>
            <span className="text-forensic-muted">
              {currentAnalysis.statistics.line_count} lines, {currentAnalysis.statistics.word_count} words
            </span>
          </div>

          {/* Line Numbers + Text */}
          <div className="flex-1 overflow-y-auto bg-panel-dark rounded border border-panel-border p-3 font-mono text-[11px] leading-relaxed flex">
            {/* Gutter Line Numbers */}
            <div className="select-none text-forensic-dim pr-3 border-r border-panel-border/60 text-right space-y-0.5 shrink-0">
              {rawLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Message Body */}
            <div className="pl-3 overflow-x-auto text-forensic-bright whitespace-pre space-y-0.5">
              {rawLines.map((line, i) => (
                <div key={i}>{line || ' '}</div>
              ))}
            </div>
          </div>

          {/* Character & Word Statistics Drawer */}
          <div className="p-3 bg-panel-dark border border-panel-border rounded text-[10px] space-y-2">
            <div className="text-forensic-dim uppercase tracking-wider font-bold">
              PAYLOAD CHARACTERISTICS
            </div>
            <div className="grid grid-cols-3 gap-2 text-forensic-muted">
              <div>
                <span>CHARS:</span> <strong className="text-white">{currentAnalysis.statistics.char_count}</strong>
              </div>
              <div>
                <span>WORDS:</span> <strong className="text-white">{currentAnalysis.statistics.word_count}</strong>
              </div>
              <div>
                <span>UPPERCASE:</span>{' '}
                <strong className="text-white">
                  {(currentAnalysis.statistics.uppercase_ratio * 100).toFixed(1)}%
                </strong>
              </div>
              <div>
                <span>PUNCTUATION:</span>{' '}
                <strong className="text-white">{currentAnalysis.statistics.punctuation_count}</strong>
              </div>
              <div>
                <span>SPECIAL CHR:</span>{' '}
                <strong className="text-white">{currentAnalysis.statistics.special_char_count}</strong>
              </div>
              <div>
                <span>ML RUNTIME:</span>{' '}
                <strong className="text-accent-cyan">
                  {currentAnalysis.analysis_duration_ms} ms
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Forensic Tabs Explorer (7 cols) */}
        <div className="lg:col-span-7 bg-panel border border-panel-border rounded-xl p-4 flex flex-col h-[640px]">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 pb-3 border-b border-panel-border">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'evidence'
                  ? 'bg-panel-elevated text-accent-lime font-bold border border-panel-border'
                  : 'text-forensic-muted hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Evidence Indicators ({currentAnalysis.evidence_indicators.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tokens'
                  ? 'bg-panel-elevated text-accent-cyan font-bold border border-panel-border'
                  : 'text-forensic-muted hover:text-white'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>Token Log-Odds ({currentAnalysis.token_attributions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-panel-elevated text-accent-amber font-bold border border-panel-border'
                  : 'text-forensic-muted hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline Stages ({currentAnalysis.timeline.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'bg-panel-elevated text-white font-bold border border-panel-border'
                  : 'text-forensic-muted hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="flex-1 overflow-y-auto pt-3">
            {/* Evidence Tab */}
            {activeTab === 'evidence' && (
              <div className="space-y-3">
                {currentAnalysis.evidence_indicators.length === 0 ? (
                  <p className="text-forensic-dim text-center py-12">
                    No deterministic attack patterns matched in this message.
                  </p>
                ) : (
                  currentAnalysis.evidence_indicators.map((ind) => (
                    <div
                      key={ind.id}
                      className="p-3.5 bg-panel-dark border border-panel-border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ind.severity === 'high'
                                ? 'bg-accent-coral/20 text-accent-coral border border-accent-coral/40'
                                : ind.severity === 'caution'
                                ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/40'
                                : 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                            }`}
                          >
                            {ind.severity}
                          </span>
                          <span className="font-bold text-white text-xs">{ind.name}</span>
                          <span className="text-[10px] text-forensic-dim">({ind.rule_id})</span>
                        </div>
                        <span className="text-[10px] text-forensic-dim">
                          OFFSET [{ind.start_idx}:{ind.end_idx}]
                        </span>
                      </div>

                      <div className="p-2 bg-black/40 rounded border border-panel-border/60 text-accent-lime font-mono text-[11px]">
                        "{ind.matched_text}"
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <p className="text-forensic-muted">
                          <strong className="text-forensic-text">Why it matters:</strong> {ind.explanation}
                        </p>
                        <p className="text-accent-cyan/90">
                          <strong className="text-accent-cyan">Analyst Action:</strong> {ind.recommended_action}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Token Attributions Tab */}
            {activeTab === 'tokens' && (
              <div className="space-y-3">
                <div className="p-3 bg-panel-dark border border-panel-border rounded text-[11px] text-forensic-muted">
                  Mathematical token contributions derived from linear TF-IDF feature weights ($w_i \cdot x_i$).
                  Positive scores push the classifier toward <span className="text-accent-coral font-bold">SPAM</span>;
                  negative scores push toward <span className="text-accent-lime font-bold">HAM</span>.
                </div>

                <div className="border border-panel-border rounded overflow-hidden">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-panel-dark text-forensic-dim uppercase text-[10px] border-b border-panel-border">
                      <tr>
                        <th className="p-2">Token / N-Gram</th>
                        <th className="p-2">Influence</th>
                        <th className="p-2">TF-IDF ($x_i$)</th>
                        <th className="p-2">Weight ($w_i$)</th>
                        <th className="p-2 text-right">Contribution ($w_i \cdot x_i$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-panel-border">
                      {currentAnalysis.token_attributions.map((t, idx) => (
                        <tr key={idx} className="hover:bg-panel-dark/50">
                          <td className="p-2 font-semibold text-white">"{t.token}"</td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                t.direction === 'spam'
                                  ? 'bg-accent-coral/20 text-accent-coral'
                                  : 'bg-accent-lime/20 text-accent-lime'
                              }`}
                            >
                              {t.direction}
                            </span>
                          </td>
                          <td className="p-2 text-forensic-muted">{t.tfidf_val}</td>
                          <td className="p-2 text-forensic-muted">{t.weight}</td>
                          <td
                            className={`p-2 text-right font-bold ${
                              t.contribution > 0 ? 'text-accent-coral' : 'text-accent-lime'
                            }`}
                          >
                            {t.contribution > 0 ? `+${t.contribution}` : t.contribution}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Timeline Stages Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {currentAnalysis.timeline.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-panel-dark border border-panel-border rounded-lg flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-accent-lime font-bold">
                            STEP {idx + 1}
                          </span>
                          <span className="text-white font-semibold text-xs">{step.step}</span>
                        </div>
                        {step.details && (
                          <p className="text-[11px] text-forensic-muted">{step.details}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-forensic-dim block">EXECUTION</span>
                        <span className="text-xs font-bold text-accent-cyan">
                          {step.duration_ms} ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-[#13171C] border border-panel-border rounded flex items-center justify-between text-xs">
                  <span className="text-forensic-muted">TOTAL PIPELINE DURATION:</span>
                  <span className="text-white font-bold font-mono">
                    {currentAnalysis.analysis_duration_ms} ms
                  </span>
                </div>
              </div>
            )}

            {/* Raw JSON View */}
            {activeTab === 'json' && (
              <div className="h-full">
                <pre className="p-3 bg-panel-dark border border-panel-border rounded text-[11px] text-accent-lime overflow-x-auto h-[480px]">
                  {JSON.stringify(currentAnalysis, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
