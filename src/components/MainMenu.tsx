import React from 'react';
import {
  Briefcase,
  Building2,
  ChevronRight,
  Lock,
  Settings,
  Trophy,
  User,
  Info,
  RotateCcw,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { PlayerCareer } from '../types/game';
import { ClubCrest } from './ClubCrest';

interface MainMenuProps {
  career: PlayerCareer | null;
  onContinueCareer: () => void;
  onNewCareer: () => void;
  onOpenSettings: () => void;
  onOpenCredits: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  career,
  onContinueCareer,
  onNewCareer,
  onOpenSettings,
  onOpenCredits,
}) => {
  const club = career ? getClubById(career.clubId) : null;

  const clickSfx = () => {
    soundEngine.unlock();
    soundEngine.play('menu');
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto custom-scroll">
      {/* Compact Header */}
      <header className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
            <Trophy size={18} className="text-emerald-400" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-white whitespace-nowrap">
            PIXEL <span className="text-emerald-400">FOOTBALL</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Menu Principal</span>
          <span aria-hidden="true">·</span>
          <span>Edição Mobile Paisagem</span>
        </div>
      </header>

      {/* Main 2-column horizontal layout */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 my-3 items-stretch min-h-0">
        {/* Left Featured Card: Carreira de Jogador */}
        <section className="md:col-span-7 bg-[#111B2B] border border-emerald-500/35 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                Modo Principal Disponível
              </span>
              {career && club && (
                <span className="text-xs text-slate-400 font-mono-num">
                  Temporada {career.season} · Rodada {career.round}/22
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
              Carreira de Jogador
            </h2>
            <p className="text-sm text-slate-300 mt-1.5 max-w-lg leading-relaxed">
              Crie seu atleta em Pixel Art, assine com um clube brasileiro fictício, dispute partidas 11v11 em campo completo e evolua até o estrelato.
            </p>

            {career && club && (
              <div className="mt-4 p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ClubCrest club={club} size={44} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-base text-white truncate">
                      {career.personal.nickname || `${career.personal.firstName} ${career.personal.lastName}`}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {club.name} · Camisa #{career.gear.jerseyNumber} · OVR {career.ovr}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono-num text-lg font-bold text-emerald-400">
                    {career.careerStats.goals} G · {career.careerStats.assists} A
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {career.careerStats.matches} jogos na carreira
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {career ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    clickSfx();
                    onContinueCareer();
                  }}
                  className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
                >
                  <User size={18} />
                  Continuar Carreira
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clickSfx();
                    onNewCareer();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw size={16} />
                  Nova Carreira
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  clickSfx();
                  onNewCareer();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
              >
                <User size={19} />
                Iniciar Carreira de Jogador
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Future Modes + Settings + Credits */}
        <section className="md:col-span-5 flex flex-col gap-2.5 justify-between">
          {/* Carreira de Técnico (Indisponível) */}
          <div
            aria-disabled="true"
            className="bg-[#101826]/75 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3 opacity-65 cursor-not-allowed select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-800/90 flex items-center justify-center shrink-0">
                <Briefcase size={18} className="text-slate-400" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-sm text-slate-300 truncate">
                  Carreira de Técnico
                </div>
                <div className="text-xs text-slate-500 truncate">
                  Táticas, escalações e comando à beira do campo
                </div>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-amber-400/90 shrink-0 whitespace-nowrap">
              <Lock size={13} />
              Em breve
            </span>
          </div>

          {/* Gerenciamento de Clube (Indisponível) */}
          <div
            aria-disabled="true"
            className="bg-[#101826]/75 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3 opacity-65 cursor-not-allowed select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-800/90 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-slate-400" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-sm text-slate-300 truncate">
                  Gerenciamento de Clube
                </div>
                <div className="text-xs text-slate-500 truncate">
                  Finanças, estádio, categorias de base e diretoria
                </div>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-amber-400/90 shrink-0 whitespace-nowrap">
              <Lock size={13} />
              Em breve
            </span>
          </div>

          {/* Configurações */}
          <button
            type="button"
            onClick={() => {
              clickSfx();
              onOpenSettings();
            }}
            className="w-full text-left bg-[#111B2B] hover:bg-[#162338] border border-slate-700/80 hover:border-emerald-500/50 rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Settings size={18} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-sm text-white">
                  Configurações
                </div>
                <div className="text-xs text-slate-400 truncate">
                  Áudio, volumes individuais, controles, gráficos e idioma
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0" />
          </button>

          {/* Créditos */}
          <button
            type="button"
            onClick={() => {
              clickSfx();
              onOpenCredits();
            }}
            className="w-full text-left bg-[#111B2B] hover:bg-[#162338] border border-slate-700/80 hover:border-emerald-500/50 rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Info size={18} className="text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-sm text-white">
                  Créditos
                </div>
                <div className="text-xs text-slate-400 truncate">
                  Informações do projeto e tecnologias originais
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0" />
          </button>
        </section>
      </main>
    </div>
  );
};
