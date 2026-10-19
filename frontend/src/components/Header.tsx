import React from 'react';
import { Shield, Radio, Terminal, Cpu } from 'lucide-react';

interface HeaderProps {
  isBackendHealthy: boolean;
  modelVersion: string;
  onOpenScannerShortcut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isBackendHealthy,
  modelVersion,
  onOpenScannerShortcut,
}) => {
  return (
    <header className="h-16 border-b border-panel-border bg-[#0B0D10]/95 backdrop-blur px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 font-mono">
      {/* Brand & Wordmark */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded bg-[#13171C] border border-accent-lime/40 text-accent-lime shadow-forensic-glow">
          {/* Geometric Shield / Signal Mark */}
          <Shield className="w-5 h-5 stroke-[1.8]" />
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sans font-extrabold tracking-tight text-base text-white">
              SENTINEL<span className="text-accent-lime">.AI</span>
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-panel-elevated text-accent-cyan border border-panel-border rounded">
              FORENSICS
            </span>
          </div>
          <p className="text-[10px] text-forensic-muted tracking-wider hidden sm:block">
            CYBER THREAT INTELLIGENCE & MESSAGE FORENSICS
          </p>
        </div>
      </div>

      {/* Center Workspace Metadata */}
      <div className="hidden md:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1 bg-panel border border-panel-border rounded">
          <Terminal className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-forensic-muted">WORKSPACE:</span>
          <span className="text-forensic-text font-semibold">CT-INTEL-01</span>
        </div>

        <button
          onClick={onOpenScannerShortcut}
          className="flex items-center gap-2 px-2.5 py-1 bg-panel-dark hover:bg-panel border border-panel-border rounded text-forensic-muted hover:text-accent-lime transition-colors"
          title="Jump to Message Scanner"
        >
          <span className="text-[11px]">SCANNER</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-[#191F26] border border-panel-border rounded text-forensic-text">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Engine Status & Version */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-panel border border-panel-border rounded">
          <Radio
            className={`w-3.5 h-3.5 ${
              isBackendHealthy ? 'text-accent-lime animate-pulse' : 'text-accent-coral'
            }`}
          />
          <span className="hidden sm:inline text-forensic-muted">ENGINE:</span>
          <span
            className={`font-semibold ${
              isBackendHealthy ? 'text-accent-lime' : 'text-accent-coral'
            }`}
          >
            {isBackendHealthy ? 'ONLINE' : 'DEGRADED'}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-panel border border-panel-border rounded text-forensic-muted">
          <Cpu className="w-3.5 h-3.5 text-accent-amber" />
          <span>MODEL:</span>
          <span className="text-forensic-text font-medium">{modelVersion || 'v1.0.0-LR'}</span>
        </div>
      </div>
    </header>
  );
};
