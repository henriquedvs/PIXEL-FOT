import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, MapPin, Shield, Users } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CLUBS } from '../data/clubs';
import { Club } from '../types/game';
import { ClubCrest } from './ClubCrest';

interface ClubSelectionProps {
  playerName: string;
  playerOvr: number;
  onBack: () => void;
  onSelectClub: (club: Club) => void;
}

export const ClubSelection: React.FC<ClubSelectionProps> = ({
  playerName,
  playerOvr,
  onBack,
  onSelectClub,
}) => {
  const [selectedId, setSelectedId] = useState<string>(CLUBS[9].id); // Default mid/lower club ideal for rookie
  const [divisionFilter, setDivisionFilter] = useState<'TODAS' | 'Série A' | 'Série B' | 'Série C'>('TODAS');

  const visibleClubs =
    divisionFilter === 'TODAS'
      ? CLUBS
      : CLUBS.filter((c) => c.division === divisionFilter);

  const selectedClub = CLUBS.find((c) => c.id === selectedId) || CLUBS[0];

  const chanceLabel =
    playerOvr >= selectedClub.squadQuality - 3
      ? 'Titular imediato'
      : playerOvr >= selectedClub.squadQuality - 10
      ? 'Rotação / Chances frequentes'
      : 'Desafio alto (Reserva inicial)';

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-2.5 border-b border-slate-800 bg-[#0D1624] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
          <div>
            <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
              Escolha do Clube Brasileiro
            </h1>
            <p className="text-[11px] text-slate-400">
              {playerName} · OVR {playerOvr} · Clubes originais fictícios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {(['TODAS', 'Série A', 'Série B', 'Série C'] as const).map((div) => (
            <button
              key={div}
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                setDivisionFilter(div);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                divisionFilter === div
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {div}
            </button>
          ))}
        </div>
      </header>

      {/* Main Split */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Club List */}
        <aside className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto custom-scroll p-3 space-y-2 bg-[#0E1623]">
          {visibleClubs.map((club) => {
            const active = club.id === selectedClub.id;
            return (
              <button
                key={club.id}
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setSelectedId(club.id);
                }}
                className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-500/15 border-emerald-500'
                    : 'bg-[#111B2B] border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ClubCrest club={club} size={40} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm text-white truncate">
                      {club.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {club.city}/{club.state} · {club.division}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono-num text-sm font-bold text-emerald-400">
                    {club.squadQuality}
                  </div>
                  <div className="text-[10px] text-slate-500">Elenco</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Club Dossier */}
        <section className="md:col-span-7 overflow-y-auto custom-scroll p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <ClubCrest club={selectedClub} size={64} className="shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-emerald-400">
                    {selectedClub.division} · Fundado em {selectedClub.foundedYear}
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-white">
                    {selectedClub.name}
                  </h2>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin size={13} />
                    {selectedClub.city}, {selectedClub.state} · Técnico: {selectedClub.coachName}
                  </div>
                </div>
              </div>

              {/* Uniform Swatch Preview */}
              <div className="hidden sm:flex flex-col items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                <div className="flex gap-1">
                  <span
                    className="w-5 h-7 rounded-sm border border-slate-600"
                    style={{ backgroundColor: selectedClub.kit.primary }}
                  />
                  <span
                    className="w-5 h-7 rounded-sm border border-slate-600"
                    style={{ backgroundColor: selectedClub.kit.secondary }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Uniforme</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
              {selectedClub.history}
            </p>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <MetricBox label="Estádio" value={selectedClub.stadiumName} />
              <MetricBox
                label="Capacidade"
                value={selectedClub.stadiumCapacity.toLocaleString('pt-BR')}
              />
              <MetricBox label="Formação Tática" value={selectedClub.formation} />
              <MetricBox label="Reputação" value={`${selectedClub.reputation} / 100`} />
              <MetricBox label="Qualidade do Elenco" value={`${selectedClub.squadQuality} / 100`} />
              <MetricBox label="Finanças" value={selectedClub.finances} />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Users size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Projeção na Equipe</div>
                  <div className="text-xs text-slate-400">{chanceLabel}</div>
                </div>
              </div>
              <Shield size={18} className="text-slate-500 shrink-0" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.play('celebration');
              onSelectClub(selectedClub);
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <CheckCircle2 size={20} />
            Assinar Contrato com {selectedClub.shortName}
          </button>
        </section>
      </div>
    </div>
  );
};

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-[#111B2B] border border-slate-800">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="text-xs sm:text-sm font-bold text-white truncate mt-0.5 font-mono-num">
        {value}
      </div>
    </div>
  );
}
