import React, { useState } from 'react';
import { EvolutionPoint } from '../types/game';

interface EvolutionChartProps {
  points: EvolutionPoint[];
}

type MetricKey = 'ovr' | 'velocidade' | 'finalizacao' | 'passeCurto' | 'drible' | 'marcacao' | 'reflexos';

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'ovr', label: 'OVR', color: '#22C55E' },
  { key: 'velocidade', label: 'Velocidade', color: '#38BDF8' },
  { key: 'finalizacao', label: 'Finalização', color: '#E6B84C' },
  { key: 'passeCurto', label: 'Passe Curto', color: '#A78BFA' },
  { key: 'drible', label: 'Drible', color: '#F472B6' },
  { key: 'marcacao', label: 'Marcação', color: '#FB923C' },
];

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ points }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('ovr');
  const activeMeta = METRICS.find((m) => m.key === selectedMetric) || METRICS[0];

  const data = points.length > 0 ? points : [];
  const W = 520;
  const H = 160;
  const PAD_X = 34;
  const PAD_Y = 20;

  if (data.length === 0) {
    return (
      <div className="px-panel p-4 text-xs text-slate-400">
        Jogue partidas ou conclua treinamentos para registrar sua curva de evolução.
      </div>
    );
  }

  const vals = data.map((d) => d[selectedMetric]);
  const minVal = Math.max(40, Math.min(...vals) - 4);
  const maxVal = Math.min(99, Math.max(...vals) + 4);
  const span = Math.max(6, maxVal - minVal);

  const coords = data.map((d, idx) => {
    const x =
      data.length === 1
        ? W / 2
        : PAD_X + (idx / (data.length - 1)) * (W - PAD_X * 2);
    const y = PAD_Y + (1 - (d[selectedMetric] - minVal) / span) * (H - PAD_Y * 2);
    return { x, y, val: d[selectedMetric], label: `T${String(d.season).slice(-2)}·R${d.round}` };
  });

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const firstVal = vals[0];
  const lastVal = vals[vals.length - 1];
  const delta = lastVal - firstVal;

  return (
    <div className="px-panel p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display font-bold text-sm text-white uppercase">
            Gráfico de Evolução do Atleta
          </h3>
          <p className="text-[11px] font-mono-num text-slate-400">
            Acompanhamento por rodada e temporada ·{' '}
            <span className="font-bold text-emerald-400">
              {delta >= 0 ? `+${delta}` : delta} pts ({firstVal} → {lastVal})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMetric(m.key)}
              className={`px-2.5 py-1 rounded-[2px] border text-[11px] font-display font-bold uppercase cursor-pointer transition-colors ${
                selectedMetric === m.key
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-[#081018] text-slate-300 border-[#22384C] hover:border-[#4b7496]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 min-w-[320px] bg-[#060E17] rounded-[2px] border border-[#1E3346]">
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const gy = PAD_Y + pct * (H - PAD_Y * 2);
            const gridVal = Math.round(maxVal - pct * span);
            return (
              <g key={pct}>
                <line x1={PAD_X} y1={gy} x2={W - PAD_X} y2={gy} stroke="#1B2F42" strokeDasharray="3 3" />
                <text x={8} y={gy + 3} fill="#64748B" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  {gridVal}
                </text>
              </g>
            );
          })}

          {coords.length > 1 && (
            <polyline
              fill="none"
              stroke={activeMeta.color}
              strokeWidth="2.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
              points={polylinePoints}
            />
          )}

          {coords.map((c, i) => (
            <g key={i}>
              <rect
                x={c.x - 3}
                y={c.y - 3}
                width="6"
                height="6"
                fill={activeMeta.color}
                stroke="#071019"
                strokeWidth="1.5"
              />
              {(i === 0 || i === coords.length - 1 || i % Math.max(1, Math.floor(coords.length / 6)) === 0) && (
                <>
                  <text
                    x={c.x}
                    y={c.y - 8}
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {c.val}
                  </text>
                  <text
                    x={c.x}
                    y={H - 5}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {c.label}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
