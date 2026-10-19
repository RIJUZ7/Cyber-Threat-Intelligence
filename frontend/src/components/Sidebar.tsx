import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  SearchCode,
  Archive,
  Activity,
  Terminal,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export type NavTab =
  | 'command-center'
  | 'scanner'
  | 'forensics-lab'
  | 'archive'
  | 'observatory'
  | 'system-about';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  sessionStats: {
    totalScanned: number;
    highRiskCount: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  sessionStats,
}) => {
  const navItems = [
    { id: 'command-center' as NavTab, label: 'Command Center', icon: LayoutDashboard, shortcut: '1' },
    { id: 'scanner' as NavTab, label: 'Message Scanner', icon: ShieldAlert, shortcut: '2', highlight: true },
    { id: 'forensics-lab' as NavTab, label: 'Forensics Lab', icon: SearchCode, shortcut: '3' },
    { id: 'archive' as NavTab, label: 'Threat Archive', icon: Archive, shortcut: '4' },
    { id: 'observatory' as NavTab, label: 'Model Observatory', icon: Activity, shortcut: '5' },
    { id: 'system-about' as NavTab, label: 'System & About', icon: Terminal, shortcut: '6' },
  ];

  return (
    <aside className="w-64 border-r border-panel-border bg-[#0B0D10] flex flex-col justify-between shrink-0 font-mono text-xs select-none">
      {/* Navigation Section */}
      <div className="p-3 space-y-6">
        <div>
          <div className="px-3 py-2 text-[10px] uppercase font-semibold text-forensic-dim tracking-wider flex items-center justify-between">
            <span>FORENSIC MODULES</span>
            <span className="text-forensic-dim">[1-6]</span>
          </div>

          <nav className="space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-left group ${
                    isActive
                      ? 'bg-panel-elevated text-accent-lime font-semibold border-l-2 border-accent-lime shadow-forensic-sm'
                      : 'text-forensic-text hover:bg-panel hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-accent-lime'
                          : 'text-forensic-muted group-hover:text-accent-lime'
                      }`}
                    />
                    <span className="font-sans text-xs tracking-wide">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.id === 'scanner' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
                    )}
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded border ${
                        isActive
                          ? 'border-accent-lime/40 text-accent-lime bg-accent-lime/10'
                          : 'border-panel-border text-forensic-dim'
                      }`}
                    >
                      {item.shortcut}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Session Telemetry Card */}
        <div className="p-3 bg-panel border border-panel-border rounded-lg space-y-2">
          <div className="flex items-center justify-between text-[11px] text-forensic-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
              SESSION METRICS
            </span>
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-panel-border/60">
            <div>
              <p className="text-[10px] text-forensic-dim">SCANNED</p>
              <p className="text-sm font-bold text-forensic-bright">{sessionStats.totalScanned}</p>
            </div>
            <div>
              <p className="text-[10px] text-forensic-dim">HIGH RISK</p>
              <p className="text-sm font-bold text-accent-coral">{sessionStats.highRiskCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Footprint */}
      <div className="p-3 border-t border-panel-border bg-[#0E1116] space-y-2 text-[11px]">
        <div className="flex items-center justify-between text-forensic-dim">
          <span>CLASSIFIER:</span>
          <span className="text-forensic-muted font-medium">TF-IDF + LOGREG</span>
        </div>
        <div className="flex items-center justify-between text-forensic-dim">
          <span>PIPELINE:</span>
          <span className="text-accent-lime">AUTHENTICATED</span>
        </div>
        <div className="text-[10px] text-forensic-dim pt-1 border-t border-panel-border/40">
          SENTINEL AI v1.0.0 // FORENSICS WORKBENCH
        </div>
      </div>
    </aside>
  );
};
