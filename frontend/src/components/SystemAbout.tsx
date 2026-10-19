import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Shield,
  Layers,
  FileCode,
  Lock,
  Cpu,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';
import { ForensicRule } from '../types/forensics';
import { api } from '../services/api';

export const SystemAbout: React.FC = () => {
  const [rules, setRules] = useState<ForensicRule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    api.getRules().then((res) => setRules(res.rules)).catch(() => {});
    api.getHealth().then((h) => setHealthData(h)).catch(() => {});
  }, []);

  const categories = ['ALL', ...Array.from(new Set(rules.map((r) => r.category)))];

  const filteredRules = selectedCategory === 'ALL'
    ? rules
    : rules.filter((r) => r.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-mono text-xs">
      {/* Top Header */}
      <div className="pb-4 border-b border-panel-border">
        <h1 className="text-xl font-bold font-sans text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-accent-lime" />
          System Specifications & Threat Taxonomy
        </h1>
        <p className="text-forensic-muted text-xs">
          Forensic architecture, deterministic detection rulebook, and defensive security model.
        </p>
      </div>

      {/* Forensic Architecture & Pipeline Flow */}
      <div className="p-5 bg-panel border border-panel-border rounded-xl space-y-4 shadow-forensic-sm">
        <span className="font-semibold text-white tracking-wide font-sans flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-cyan" />
          Forensic Analysis Pipeline Flow
        </span>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-3 bg-panel-dark border border-panel-border rounded space-y-1">
            <span className="text-[10px] text-accent-lime font-bold">STAGE 01</span>
            <div className="text-white font-bold text-xs">Input Sanitization</div>
            <p className="text-[10px] text-forensic-muted">
              Length bounds checking, Unicode normalization, whitespace control.
            </p>
          </div>

          <div className="p-3 bg-panel-dark border border-panel-border rounded space-y-1">
            <span className="text-[10px] text-accent-lime font-bold">STAGE 02</span>
            <div className="text-white font-bold text-xs">ML Classifier</div>
            <p className="text-[10px] text-forensic-muted">
              Sublinear TF-IDF transformation and balanced Logistic Regression scoring.
            </p>
          </div>

          <div className="p-3 bg-panel-dark border border-panel-border rounded space-y-1">
            <span className="text-[10px] text-accent-lime font-bold">STAGE 03</span>
            <div className="text-white font-bold text-xs">Evidence Engine</div>
            <p className="text-[10px] text-forensic-muted">
              Deterministic regex rule matching with character offset indexing.
            </p>
          </div>

          <div className="p-3 bg-panel-dark border border-panel-border rounded space-y-1">
            <span className="text-[10px] text-accent-lime font-bold">STAGE 04</span>
            <div className="text-white font-bold text-xs">Safe URL Screening</div>
            <p className="text-[10px] text-forensic-muted">
              Passive lexical URL inspection (IP hostnames, shorteners, abuse TLDs).
            </p>
          </div>

          <div className="p-3 bg-panel-dark border border-panel-border rounded space-y-1">
            <span className="text-[10px] text-accent-lime font-bold">STAGE 05</span>
            <div className="text-white font-bold text-xs">Fingerprint Synthesis</div>
            <p className="text-[10px] text-forensic-muted">
              Weighted fusion into bounded heuristic risk score & multi-axis vector.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Privacy Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-panel border border-panel-border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-accent-lime font-sans font-bold text-xs">
            <Lock className="w-4 h-4" />
            <span>Zero Remote Leakage</span>
          </div>
          <p className="text-[11px] text-forensic-muted leading-relaxed">
            All analysis occurs locally on this host. Submitted messages, email headers, and recipient details are never sent to remote LLM APIs or telemetry aggregators.
          </p>
        </div>

        <div className="p-4 bg-panel border border-panel-border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-accent-coral font-sans font-bold text-xs">
            <Shield className="w-4 h-4" />
            <span>Passive Link Isolation</span>
          </div>
          <p className="text-[11px] text-forensic-muted leading-relaxed">
            Extracted links are parsed strictly via regular expressions and URL string parsers. SENTINEL never issues outbound HTTP requests, renders DOMs, or follows redirects.
          </p>
        </div>

        <div className="p-4 bg-panel border border-panel-border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-accent-cyan font-sans font-bold text-xs">
            <Cpu className="w-4 h-4" />
            <span>Verifiable Explainability</span>
          </div>
          <p className="text-[11px] text-forensic-muted leading-relaxed">
            Every highlighted token and matched indicator is grounded in deterministic Python logic and mathematically exact linear model coefficients ($w_i \cdot x_i$).
          </p>
        </div>
      </div>

      {/* Active Detection Rulebook */}
      <div className="p-5 bg-panel border border-panel-border rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-panel-border">
          <span className="font-semibold text-white tracking-wide font-sans flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-lime" />
            Active Forensic Detection Rulebook ({rules.length} Rules)
          </span>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-[10px] transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-accent-lime text-background font-bold'
                    : 'bg-panel-dark text-forensic-muted hover:text-white border border-panel-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredRules.map((r) => (
            <div
              key={r.rule_id}
              className="p-3 bg-panel-dark border border-panel-border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-accent-lime font-bold">{r.rule_id}</span>
                  <span className="text-white font-semibold text-xs">{r.name}</span>
                  <span className="text-forensic-dim text-[10px]">[{r.category}]</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.severity === 'high'
                      ? 'bg-accent-coral/20 text-accent-coral border border-accent-coral/40'
                      : r.severity === 'caution'
                      ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/40'
                      : 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                  }`}
                >
                  {r.severity}
                </span>
              </div>

              <p className="text-[11px] text-forensic-muted">
                <strong className="text-forensic-text">Threat Mechanics:</strong> {r.explanation}
              </p>
              <p className="text-[11px] text-accent-cyan/90">
                <strong className="text-accent-cyan">Analyst Procedure:</strong> {r.action}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Runtime Environment Info */}
      <div className="p-4 bg-panel border border-panel-border rounded-lg text-forensic-dim text-[10px] space-y-1">
        <div className="text-forensic-text font-bold">HOST RUNTIME TELEMETRY</div>
        <div>FastAPI 0.141.1 // Python 3.13 // scikit-learn 1.9.1 // React 19 // Vite 6</div>
        <div>
          Status: {healthData?.status || 'Active'} | Service Uptime: {healthData?.uptime_seconds || 0}s | Local Model Pipeline Loaded
        </div>
      </div>
    </div>
  );
};
