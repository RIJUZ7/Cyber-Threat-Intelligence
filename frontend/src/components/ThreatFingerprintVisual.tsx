import React from 'react';
import { ThreatFingerprint } from '../types/forensics';
import { ShieldAlert, AlertTriangle, Link2, KeyRound, DollarSign, Binary } from 'lucide-react';

interface ThreatFingerprintVisualProps {
  fingerprint: ThreatFingerprint;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const ThreatFingerprintVisual: React.FC<ThreatFingerprintVisualProps> = ({
  fingerprint,
  size = 'md',
  showDetails = true,
}) => {
  // Vector dimensions
  const dimensions = [
    { key: 'urgency', label: 'Urgency Demand', value: fingerprint.urgency, icon: AlertTriangle, color: '#FF626E' },
    { key: 'credential_harvesting', label: 'Credential Solicitation', value: fingerprint.credential_harvesting, icon: KeyRound, color: '#FF626E' },
    { key: 'suspicious_links', label: 'Deceptive / Masked Links', value: fingerprint.suspicious_links, icon: Link2, color: '#F4B860' },
    { key: 'impersonation', label: 'Brand Impersonation', value: fingerprint.impersonation, icon: ShieldAlert, color: '#F4B860' },
    { key: 'financial_pressure', label: 'Financial Lure / Pressure', value: fingerprint.financial_pressure, icon: DollarSign, color: '#65D8D0' },
    { key: 'structural_obfuscation', label: 'Formatting Obfuscation', value: fingerprint.structural_obfuscation, icon: Binary, color: '#C7F464' },
  ];

  // Radar geometry calculations (Hexagon)
  const center = 110;
  const maxRadius = 80;
  const angleStep = (Math.PI * 2) / dimensions.length;

  // Calculate polygon points for the threat level
  const polygonPoints = dimensions
    .map((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (Math.max(8, dim.value) / 100) * maxRadius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Background grid circles
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const getVerdictColor = (score: number) => {
    if (score >= 65) return 'text-accent-coral border-accent-coral/40 bg-accent-coral/10';
    if (score >= 35) return 'text-accent-amber border-accent-amber/40 bg-accent-amber/10';
    return 'text-accent-lime border-accent-lime/40 bg-accent-lime/10';
  };

  return (
    <div className="bg-panel border border-panel-border rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-panel-border mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-lime animate-pulse" />
          <span className="text-xs uppercase tracking-wider text-forensic-muted">
            THREAT FINGERPRINT // V-HEXAGON
          </span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded border font-semibold ${getVerdictColor(
            fingerprint.overall_score
          )}`}
        >
          RISK {fingerprint.overall_score}/100
        </span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* SVG Radar Chart */}
        <div className="relative w-[220px] h-[220px] flex-shrink-0">
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            className="overflow-visible"
            aria-label="Threat Profile Radar Chart"
          >
            {/* Concentric grid rings */}
            {gridLevels.map((lvl) => {
              const r = lvl * maxRadius;
              return (
                <circle
                  key={lvl}
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke="#242D38"
                  strokeWidth="1"
                  strokeDasharray={lvl === 1.0 ? 'none' : '2,2'}
                />
              );
            })}

            {/* Radial axes */}
            {dimensions.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const x2 = center + maxRadius * Math.cos(angle);
              const y2 = center + maxRadius * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#242D38"
                  strokeWidth="1"
                />
              );
            })}

            {/* Polygon Area */}
            <polygon
              points={polygonPoints}
              fill="rgba(255, 98, 110, 0.22)"
              stroke="#FF626E"
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />

            {/* Data Points */}
            {dimensions.map((dim, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = (Math.max(8, dim.value) / 100) * maxRadius;
              const cx = center + r * Math.cos(angle);
              const cy = center + r * Math.sin(angle);
              return (
                <circle
                  key={dim.key}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill={dim.color}
                  stroke="#13171C"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Center crosshair */}
            <circle cx={center} cy={center} r="2" fill="#7A889B" />
          </svg>
        </div>

        {/* Indicator Breakdown Meters */}
        {showDetails && (
          <div className="w-full space-y-2.5 flex-1">
            {dimensions.map((dim) => {
              const Icon = dim.icon;
              return (
                <div key={dim.key} className="text-xs">
                  <div className="flex items-center justify-between text-forensic-text mb-1">
                    <span className="flex items-center gap-1.5 text-forensic-muted">
                      <Icon className="w-3.5 h-3.5" style={{ color: dim.color }} />
                      <span className="tracking-wide">{dim.label}</span>
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: dim.value > 0 ? dim.color : '#7A889B' }}
                    >
                      {dim.value}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#1A222B] h-1.5 rounded-full overflow-hidden border border-panel-border/50">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dim.value}%`,
                        backgroundColor: dim.value > 0 ? dim.color : 'transparent',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
