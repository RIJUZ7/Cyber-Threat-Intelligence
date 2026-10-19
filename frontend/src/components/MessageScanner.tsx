import React, { useState } from 'react';
import {
  ShieldAlert,
  Send,
  RotateCcw,
  ClipboardPaste,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  SearchCode,
  ShieldQuestion,
  FileCode,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { AnalyzeResponse, SampleMessage } from '../types/forensics';
import { ThreatFingerprintVisual } from './ThreatFingerprintVisual';

interface MessageScannerProps {
  onAnalyze: (message: string, sender: string, sourceType: string) => Promise<AnalyzeResponse>;
  isAnalyzing: boolean;
  lastAnalysis: AnalyzeResponse | null;
  samples: SampleMessage[];
  onInspectInLab: (analysis: AnalyzeResponse) => void;
  initialMessage?: string;
  initialSender?: string;
  initialSource?: string;
}

export const MessageScanner: React.FC<MessageScannerProps> = ({
  onAnalyze,
  isAnalyzing,
  lastAnalysis,
  samples,
  onInspectInLab,
  initialMessage = '',
  initialSender = '',
  initialSource = 'email',
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [sender, setSender] = useState(initialSender);
  const [sourceType, setSourceType] = useState(initialSource);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClear = () => {
    setMessage('');
    setSender('');
    setErrorMessage(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMessage(text);
        setErrorMessage(null);
      }
    } catch {
      setErrorMessage('Clipboard access denied by browser permissions.');
    }
  };

  const handleLoadSample = (sample: SampleMessage) => {
    setMessage(sample.full_text);
    setSender(sample.sender);
    setSourceType(sample.source_type);
    setSampleModalOpen(false);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Please enter or paste a message to analyze.');
      return;
    }
    setErrorMessage(null);
    try {
      await onAnalyze(message, sender, sourceType);
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis failed. Verify backend service is running.');
    }
  };

  const handleCopySummary = () => {
    if (!lastAnalysis) return;
    const summary = `
[SENTINEL AI INCIDENT REPORT]
Investigation ID: ${lastAnalysis.investigation_id}
Timestamp: ${lastAnalysis.timestamp}
Verdict: ${lastAnalysis.verdict}
Heuristic Risk Score: ${lastAnalysis.heuristic_risk_score}/100
Model Spam Probability: ${lastAnalysis.model_probability !== null ? (lastAnalysis.model_probability * 100).toFixed(1) + '%' : 'N/A'}
Source Channel: ${lastAnalysis.source_type.toUpperCase()}
Sender: ${lastAnalysis.sender || 'Not Specified'}

EXPLANATION:
${lastAnalysis.explanation}

DETECTED EVIDENCE (${lastAnalysis.evidence_indicators.length}):
${lastAnalysis.evidence_indicators
  .map((e) => `- [${e.severity.toUpperCase()}] ${e.name}: "${e.matched_text}"`)
  .join('\n')}

EXTRACTED URLS (${lastAnalysis.extracted_urls.length}):
${lastAnalysis.extracted_urls
  .map((u) => `- ${u.url} (Domain: ${u.domain}, Notes: ${u.risk_note})`)
  .join('\n')}

RECOMMENDED ACTIONS:
${lastAnalysis.recommended_actions.map((a) => `- ${a}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // Render highlighted original text
  const renderHighlightedMessage = () => {
    if (!lastAnalysis || !lastAnalysis.raw_message) return null;
    const text = lastAnalysis.raw_message;
    const indicators = [...lastAnalysis.evidence_indicators].sort((a, b) => a.start_idx - b.start_idx);

    if (indicators.length === 0) {
      return <div className="text-forensic-text whitespace-pre-wrap">{text}</div>;
    }

    // Slice and highlight non-overlapping segments
    const elements = [];
    let lastIdx = 0;

    for (let i = 0; i < indicators.length; i++) {
      const ind = indicators[i];
      if (ind.start_idx >= lastIdx && ind.end_idx <= text.length) {
        // Plain segment before
        if (ind.start_idx > lastIdx) {
          elements.push(
            <span key={`plain-${lastIdx}`}>
              {text.substring(lastIdx, ind.start_idx)}
            </span>
          );
        }

        // Highlighted segment
        const badgeColor =
          ind.severity === 'high'
            ? 'bg-accent-coral/20 text-accent-coral border-b-2 border-accent-coral font-medium'
            : ind.severity === 'caution'
            ? 'bg-accent-amber/20 text-accent-amber border-b-2 border-accent-amber font-medium'
            : 'bg-accent-cyan/20 text-accent-cyan border-b-2 border-accent-cyan';

        elements.push(
          <mark
            key={`mark-${ind.id}-${ind.start_idx}`}
            className={`${badgeColor} px-1 rounded-t cursor-help transition-all`}
            title={`[${ind.severity.toUpperCase()}] ${ind.name}: ${ind.explanation}`}
          >
            {text.substring(ind.start_idx, ind.end_idx)}
          </mark>
        );

        lastIdx = ind.end_idx;
      }
    }

    if (lastIdx < text.length) {
      elements.push(
        <span key={`plain-tail`}>{text.substring(lastIdx)}</span>
      );
    }

    return <div className="text-forensic-text whitespace-pre-wrap leading-relaxed">{elements}</div>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-mono text-xs">
      {/* Scanner Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-panel-border gap-3">
        <div>
          <h1 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-accent-lime" />
            Message Forensics Scanner
          </h1>
          <p className="text-forensic-muted text-xs">
            Screen untrusted email bodies, SMS lures, and social-engineering payloads through the forensic pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSampleModalOpen(true)}
            className="px-3 py-1.5 rounded bg-panel-elevated hover:bg-panel-hover border border-panel-border text-accent-lime flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Load Curated Sample</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Input Workspace */}
      <div className="bg-panel border border-panel-border rounded-xl p-5 shadow-forensic-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] text-forensic-dim uppercase tracking-wider block">
                SENDER HEADER / IDENTIFIER (OPTIONAL)
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. security-team@notice-update.com or +1 800-555-0199"
                className="w-full bg-panel-dark border border-panel-border rounded px-3 py-2 text-forensic-text placeholder-forensic-dim focus:border-accent-lime outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-forensic-dim uppercase tracking-wider block">
                SOURCE CHANNEL
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-panel-dark border border-panel-border rounded px-3 py-2 text-forensic-text focus:border-accent-lime outline-none"
              >
                <option value="email">Email Message</option>
                <option value="sms">SMS / Smishing</option>
                <option value="chat">Chat / Messaging App</option>
                <option value="raw">Raw Suspicious Text</option>
              </select>
            </div>
          </div>

          {/* Message Text Input Area */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-forensic-dim">
              <span>SUSPICIOUS MESSAGE TEXT</span>
              <span>{message.length} CHARS</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste suspicious email body, SMS text, or untrusted message here..."
              rows={8}
              className="w-full bg-panel-dark border border-panel-border rounded p-3 text-forensic-text placeholder-forensic-dim focus:border-accent-lime outline-none font-mono text-xs leading-relaxed resize-y"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-accent-coral/10 border border-accent-coral/40 rounded text-accent-coral flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePaste}
                className="px-3 py-1.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-forensic-muted hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded bg-panel-dark hover:bg-panel-elevated border border-panel-border text-forensic-muted hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className={`px-5 py-2 rounded font-semibold text-background tracking-wider uppercase font-mono flex items-center gap-2 transition-all cursor-pointer ${
                isAnalyzing
                  ? 'bg-forensic-muted cursor-wait'
                  : 'bg-accent-lime hover:bg-[#b8e855] shadow-forensic-glow'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  <span>Screening Pipeline...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-background" />
                  <span>Execute Forensics Scan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Results View */}
      {lastAnalysis && (
        <div className="space-y-6 animate-fadeIn">
          {/* Verdict Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              lastAnalysis.verdict === 'SPAM'
                ? 'bg-[#1F1417] border-accent-coral/60'
                : lastAnalysis.verdict === 'LIKELY SPAM'
                ? 'bg-[#1F1B14] border-accent-amber/60'
                : 'bg-[#131F17] border-accent-lime/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg ${
                  lastAnalysis.verdict === 'SPAM'
                    ? 'bg-accent-coral/20 text-accent-coral'
                    : lastAnalysis.verdict === 'LIKELY SPAM'
                    ? 'bg-accent-amber/20 text-accent-amber'
                    : 'bg-accent-lime/20 text-accent-lime'
                }`}
              >
                {lastAnalysis.verdict === 'SPAM' ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : lastAnalysis.verdict === 'LIKELY SPAM' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-forensic-muted uppercase">VERDICT:</span>
                  <span
                    className={`font-sans font-black text-xl tracking-wide ${
                      lastAnalysis.verdict === 'SPAM'
                        ? 'text-accent-coral'
                        : lastAnalysis.verdict === 'LIKELY SPAM'
                        ? 'text-accent-amber'
                        : 'text-accent-lime'
                    }`}
                  >
                    {lastAnalysis.verdict}
                  </span>
                </div>
                <p className="text-xs text-forensic-text mt-0.5 max-w-xl">
                  {lastAnalysis.explanation}
                </p>
              </div>
            </div>

            {/* Scores Overview */}
            <div className="flex items-center gap-4 bg-panel-dark/80 p-3 rounded-lg border border-panel-border shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-forensic-dim">HEURISTIC RISK</div>
                <div
                  className={`text-xl font-black ${
                    lastAnalysis.heuristic_risk_score >= 65
                      ? 'text-accent-coral'
                      : lastAnalysis.heuristic_risk_score >= 35
                      ? 'text-accent-amber'
                      : 'text-accent-lime'
                  }`}
                >
                  {lastAnalysis.heuristic_risk_score}/100
                </div>
                <span className="text-[9px] text-forensic-dim block">FUSED SCORE</span>
              </div>

              <div className="h-8 w-px bg-panel-border" />

              <div className="text-right">
                <div className="text-[10px] text-forensic-dim">ML PROBABILITY</div>
                <div className="text-xl font-black text-forensic-bright">
                  {lastAnalysis.model_probability !== null
                    ? `${(lastAnalysis.model_probability * 100).toFixed(1)}%`
                    : 'N/A'}
                </div>
                <span className="text-[9px] text-forensic-dim block">
                  {lastAnalysis.model_prediction} ({lastAnalysis.model_confidence ? (lastAnalysis.model_confidence * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Threat Fingerprint & Highlighted Text Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Highlighted Message Evidence Panel (7 cols) */}
            <div className="lg:col-span-7 bg-panel border border-panel-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-panel-border">
                <span className="font-semibold text-white tracking-wide font-sans flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-accent-cyan" />
                  Evidence Trace & Labeled Text
                </span>
                <span className="text-[11px] text-forensic-dim">
                  {lastAnalysis.evidence_indicators.length} MARKERS DETECTED
                </span>
              </div>

              <div className="p-4 bg-panel-dark rounded-lg border border-panel-border max-h-96 overflow-y-auto">
                {renderHighlightedMessage()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-forensic-muted pt-2 border-t border-panel-border/60">
                <span className="text-forensic-dim">SEVERITY LEGEND:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-accent-coral" />
                  High Concern
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-accent-amber" />
                  Caution
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-accent-cyan" />
                  Informational
                </span>
              </div>
            </div>

            {/* Threat Fingerprint Visual (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <ThreatFingerprintVisual fingerprint={lastAnalysis.threat_fingerprint} />
            </div>
          </div>

          {/* URLs & Recommended Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Extracted URLs Inspection */}
            <div className="bg-panel border border-panel-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-panel-border">
                <span className="font-semibold text-white tracking-wide font-sans flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-accent-amber" />
                  Extracted Links & Domain Inspection
                </span>
                <span className="text-[11px] text-forensic-dim">
                  {lastAnalysis.extracted_urls.length} LINK(S)
                </span>
              </div>

              {lastAnalysis.extracted_urls.length === 0 ? (
                <p className="text-forensic-dim text-xs py-4">
                  No hyperlinks or Web domains detected in this message payload.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {lastAnalysis.extracted_urls.map((u, i) => (
                    <div
                      key={i}
                      className="p-3 bg-panel-dark border border-panel-border rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-forensic-bright font-mono text-xs truncate max-w-sm">
                          {u.url}
                        </span>
                        <div className="flex items-center gap-1">
                          {u.is_ip && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-coral/20 text-accent-coral border border-accent-coral/40">
                              IP-DEST
                            </span>
                          )}
                          {u.is_shortened && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-amber/20 text-accent-amber border border-accent-amber/40">
                              SHORTENED
                            </span>
                          )}
                          {u.suspicious_tld && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-amber/20 text-accent-amber border border-accent-amber/40">
                              ABUSE-TLD
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-forensic-muted flex items-center gap-4">
                        <span>DOMAIN: <strong className="text-white">{u.domain}</strong></span>
                        <span>SCHEME: {u.scheme.toUpperCase()}</span>
                      </div>

                      <p className="text-[11px] text-accent-amber/90">
                        RISK ASSESSMENT: {u.risk_note}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Defensive Actions */}
            <div className="bg-panel border border-panel-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-panel-border">
                <span className="font-semibold text-white tracking-wide font-sans flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-lime" />
                  Recommended Defensive Next Steps
                </span>
                <span className="text-[11px] text-forensic-dim">ACTION GUIDE</span>
              </div>

              <div className="space-y-2">
                {lastAnalysis.recommended_actions.map((act, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-panel-dark border border-panel-border/80 rounded flex items-start gap-2.5 text-xs text-forensic-text"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-accent-lime mt-0.5 shrink-0" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Footer Action Bar */}
          <div className="p-4 bg-panel border border-panel-border rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-forensic-muted">
              <span>INVESTIGATION ID:</span>
              <strong className="text-white font-mono">{lastAnalysis.investigation_id}</strong>
              <span className="text-forensic-dim">
                ({lastAnalysis.analysis_duration_ms} ms)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 rounded bg-panel-elevated hover:bg-panel-hover border border-panel-border text-forensic-text hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-accent-cyan" />
                <span>{copyFeedback ? 'Summary Copied!' : 'Copy Incident Summary'}</span>
              </button>

              <button
                onClick={() => onInspectInLab(lastAnalysis)}
                className="px-4 py-1.5 rounded bg-accent-lime hover:bg-[#b8e855] text-background font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <SearchCode className="w-3.5 h-3.5" />
                <span>Inspect in Forensics Lab</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Loader Modal */}
      {sampleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-panel border border-panel-border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-panel-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent-lime" />
                <span className="font-sans font-bold text-white text-sm">
                  Select Curated Demonstration Sample
                </span>
              </div>
              <button
                onClick={() => setSampleModalOpen(false)}
                className="text-forensic-muted hover:text-white text-base px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
              {samples.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleLoadSample(s)}
                  className="p-3 bg-panel-dark hover:bg-panel-elevated border border-panel-border rounded-lg cursor-pointer transition-colors space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-accent-lime transition-colors">
                      {s.title}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                        s.expected_risk === 'high'
                          ? 'bg-accent-coral/10 text-accent-coral border border-accent-coral/30'
                          : s.expected_risk === 'medium'
                          ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30'
                          : 'bg-accent-lime/10 text-accent-lime border border-accent-lime/30'
                      }`}
                    >
                      {s.expected_risk} RISK
                    </span>
                  </div>

                  <p className="text-[11px] text-forensic-muted">{s.description}</p>

                  <div className="text-[10px] text-forensic-dim font-mono">
                    SENDER: {s.sender} | CHANNEL: {s.source_type.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
