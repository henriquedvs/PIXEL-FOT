import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, MapPin, Shield, Users } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CLUBS, SERIE_B_CLUBS } from '../data/clubs';
import { Club } from '../types/game';
import { ClubCrest } from './ClubCrest';
import { PixelBackdrop } from './PixelBackdrop';

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
  const [selectedId, setSelectedId] = useState<string>(CLUBS[12]?.id || CLUBS[0].id);
  const [divisionFilter, setDivisionFilter] = useState<'Série A' | 'Série B' | 'TODAS'>('Série A');

  const allClubs = [...CLUBS, ...SERIE_B_CLUBS];
  const visibleClubs =
    divisionFilter === 'TODAS'
      ? allClubs
      : allClubs.filter((c) => c.division === divisionFilter);

  const selectedClub = allClubs.find((c) => c.id === selectedId) || CLUBS[0];

  const chanceLabel =
    playerOvr >= selectedClub.squadQuality - 3
      ? 'Titular imediato'
      : playerOvr >= selectedClub.squadQuality - 10
      ? 'Rotação / Chances frequentes'
      : 'Desafio alto (Reserva inicial)';

  return (
    <div className="px-shell animate-fadeIn">
      <PixelBackdrop homeKit={selectedClub.kit} awayKit={selectedClub.awayKit} dimOpacity={0.85} />

      {/* Header */}
      <header className="relative z-10 px-header px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="px-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
          <div className="px-flag-stripe-br shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight uppercase truncate">
              Escolha do Clube Brasileiro
            </h1>
            <p className="text-[11px] font-mono-num text-slate-400 truncate">
              {playerName} · OVR {playerOvr} · Clubes originais fictícios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#081018] p-1 rounded-[2px] border border-[#22384C] shrink-0">
          {(['Série A', 'Série B', 'TODAS'] as const).map((div) => (
            <button
              key={div}
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                setDivisionFilter(div);
              }}
              className={`px-2.5 py-1 rounded-[2px] text-xs font-display font-bold uppercase cursor-pointer whitespace-nowrap ${
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
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Club List */}
        <aside className="md:col-span-5 border-b md:border-b-0 md:border-r border-[#1E3346] overflow-y-auto custom-scroll p-3 space-y-2 bg-[#071019]/80">
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
                className={`w-full text-left p-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  active
                    ? 'px-panel-active'
                    : 'px-panel-soft hover:border-[#4b7496]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ClubCrest club={club} size={40} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm text-white uppercase truncate">
                      {club.name}
                    </div>
                    <div className="text-[11px] font-mono-num text-slate-400 truncate">
                      {club.city}/{club.state} · {club.division}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono-num text-sm font-bold text-emerald-400">
                    {club.squadQuality}
                  </div>
                  <div className="text-[10px] font-mono-num uppercase text-slate-500">Elenco</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Club Dossier */}
        <section className="md:col-span-7 overflow-y-auto custom-scroll p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="px-panel p-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <ClubCrest club={selectedClub} size={64} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-mono-num font-bold uppercase text-emerald-400">
                    {selectedClub.division} · Fundado em {selectedClub.foundedYear}
                  </div>
                  <h2 className="font-display text-2xl font-extrabold text-white uppercase truncate">
                    {selectedClub.name}
                  </h2>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin size={13} className="text-emerald-400 shrink-0" />
                    {selectedClub.city}, {selectedClub.state} · Técnico: {selectedClub.coachName}
                  </div>
                </div>
              </div>

              {/* Uniform 1/2/3 Swatch Preview */}
              <div className="hidden sm:flex flex-col items-center px-panel-soft p-2.5 shrink-0">
                <div className="flex gap-1.5">
                  {[selectedClub.kit, selectedClub.awayKit, selectedClub.thirdKit]
                    .filter(Boolean)
                    .map((k, idx) => (
                      <div key={idx} className="flex">
                        <span
                          className="w-3.5 h-6 border border-[#2C465E]"
                          style={{ backgroundColor: k!.primary }}
                        />
                        <span
                          className="w-3.5 h-6 border border-[#2C465E]"
                          style={{ backgroundColor: k!.secondary }}
                        />
                      </div>
                    ))}
                </div>
                <span className="text-[10px] font-mono-num uppercase text-slate-400 mt-1">
                  3 Uniformes
                </span>
              </div>
            </div>

            <p className="px-panel-soft text-sm text-slate-300 leading-relaxed p-3.5">
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

            <div className="px-panel p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Users size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-display font-bold text-white uppercase">
                    Projeção na Equipe
                  </div>
                  <div className="text-xs text-slate-300">
                    {chanceLabel}
                    {selectedClub.division === 'Série B'
                      ? ' · G-4 da Série B sobe para a Série A na próxima temporada'
                      : ''}
                  </div>
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
            className="px-btn-primary w-full py-3.5 px-6 text-base uppercase flex items-center justify-center gap-2 cursor-pointer"
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
    <div className="px-panel-soft p-2.5">
      <div className="text-[10px] font-mono-num uppercase text-slate-400">{label}</div>
      <div className="text-xs sm:text-sm font-bold text-white truncate mt-0.5 font-mono-num">
        {value}
      </div>
    </div>
  );
}
