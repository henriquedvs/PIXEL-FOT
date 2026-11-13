import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Info,
  Paintbrush,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Trophy,
  User,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { getPositionMeta } from '../data/positions';
import { PlayerCareer } from '../types/game';
import { ClubCrest } from './ClubCrest';
import { PixelPortrait } from './PixelPortrait';

interface MainMenuProps {
  career: PlayerCareer | null;
  onContinueCareer: () => void;
  onNewCareer: () => void;
  onOpenPlayerProfile: () => void;
  onOpenClubs: () => void;
  onOpenStadiums: () => void;
  onOpenCompetitions: () => void;
  onOpenCustomization: () => void;
  onOpenSettings: () => void;
  onOpenCredits: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  career,
  onContinueCareer,
  onNewCareer,
  onOpenPlayerProfile,
  onOpenClubs,
  onOpenStadiums,
  onOpenCompetitions,
  onOpenCustomization,
  onOpenSettings,
  onOpenCredits,
}) => {
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const club = career ? getClubById(career.clubId) : null;
  const maxRound = career ? career.schedule.reduce((m, f) => Math.max(m, f.round), 38) : 38;
  const nextFixture = career
    ? career.schedule.find(
        (f) =>
          f.round === career.round &&
          (f.homeClubId === career.clubId || f.awayClubId === career.clubId)
      )
    : null;
  const oppClub =
    career && nextFixture
      ? getClubById(
          nextFixture.homeClubId === career.clubId
            ? nextFixture.awayClubId
            : nextFixture.homeClubId
        )
      : null;

  const clickSfx = () => {
    soundEngine.unlock();
    soundEngine.play('menu');
  };

  const handleNewCareerClick = () => {
    clickSfx();
    if (career) {
      setConfirmOverwrite(true);
    } else {
      onNewCareer();
    }
  };

  const navCards = [
    {
      title: 'Meu Jogador',
      subtitle: career ? `OVR ${career.ovr} · Gráfico de evolução` : 'Ficha e progresso do atleta',
      icon: User,
      accent: 'text-emerald-400',
      onClick: onOpenPlayerProfile,
    },
    {
      title: 'Clubes',
      subtitle: '20 times da Série A · 3 uniformes',
      icon: Shield,
      accent: 'text-sky-400',
      onClick: onOpenClubs,
    },
    {
      title: 'Estádios',
      subtitle: '20 arenas em Pixel Art interativo',
      icon: Building2,
      accent: 'text-amber-400',
      onClick: onOpenStadiums,
    },
    {
      title: 'Competições',
      subtitle: 'Série A (38 rod.), Série B, Copa & Supercopa',
      icon: Trophy,
      accent: 'text-yellow-400',
      onClick: onOpenCompetitions,
    },
    {
      title: 'Personalização',
      subtitle: career ? 'Aparência, chuteira e comemoração' : 'Crie sua carreira primeiro',
      icon: Paintbrush,
      accent: 'text-pink-400',
      onClick: career ? onOpenCustomization : handleNewCareerClick,
    },
    {
      title: 'Configurações',
      subtitle: 'Áudio, controles, gráficos e tela cheia',
      icon: Settings,
      accent: 'text-slate-300',
      onClick: onOpenSettings,
    },
  ];

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto custom-scroll">
      {/* Compact Header */}
      <header className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
            <Trophy size={18} className="text-emerald-400" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white whitespace-nowrap">
              PIXEL <span className="text-emerald-400">FOOTBALL</span>
            </span>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Brasileirão Série A · Carreira Profissional 11v11
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            clickSfx();
            onOpenCredits();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 cursor-pointer whitespace-nowrap"
        >
          <Info size={14} className="text-sky-400" />
          Créditos
        </button>
      </header>

      {/* Main Horizontal 2-Column Layout */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 my-3 items-stretch min-h-0">
        {/* Left: Career Hero & Primary Actions (Continuar Carreira + Nova Carreira) */}
        <section className="md:col-span-5 bg-[#111B2B] border border-emerald-500/35 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                Carreira de Jogador
              </span>
              {career && (
                <span className="text-xs text-slate-400 font-mono-num">
                  Temp. {career.season} · Rod. {career.round}/{maxRound}
                </span>
              )}
            </div>

            {career && club ? (
              <div className="p-3.5 rounded-xl bg-slate-900/85 border border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PixelPortrait
                      skinColor={career.appearance.skinColor}
                      hairColor={career.appearance.hairColor}
                      hairStyle={career.appearance.hairStyle}
                      shirtPrimary={club.kit.primary}
                      shirtSecondary={club.kit.secondary}
                      size={44}
                    />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-base text-white truncate">
                        {career.personal.nickname || `${career.personal.firstName} ${career.personal.lastName}`}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {getPositionMeta(career.position).code} · #{career.gear.jerseyNumber} · {club.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ClubCrest club={club} size={36} />
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-semibold">OVR</div>
                      <div className="font-mono-num text-xl font-extrabold text-emerald-400 leading-none">
                        {career.ovr}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 truncate">
                    Próx.:{' '}
                    <strong className="text-white">
                      {oppClub ? `vs ${oppClub.shortName}` : 'Rodada'}
                    </strong>{' '}
                    ({nextFixture?.competition || 'Brasileirão'})
                  </span>
                  <span className="font-mono-num font-bold text-emerald-400 shrink-0 pl-2">
                    {career.careerStats.goals}G · {career.careerStats.assists}A
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <h2 className="font-display text-xl font-extrabold text-white">
                  Sua Jornada no Futebol Brasileiro
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Crie seu jogador em Pixel Art, assine com um dos 20 clubes da Série A, dispute 38 rodadas, copas e evolua até o estrelato.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {career ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    clickSfx();
                    onContinueCareer();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-base transition-colors cursor-pointer"
                >
                  <Play size={18} fill="currentColor" />
                  Continuar Carreira
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNewCareerClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw size={15} />
                  Nova Carreira
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleNewCareerClick}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-base transition-colors cursor-pointer"
              >
                <User size={19} />
                Nova Carreira
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </section>

        {/* Right: 6 Modular Exploration & Settings Cards (making 8 total menu options) */}
        <section className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-stretch">
          {navCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => {
                  clickSfx();
                  card.onClick();
                }}
                className="text-left bg-[#111B2B] hover:bg-[#162338] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer min-h-[72px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Icon size={18} className={card.accent} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm text-white truncate">
                      {card.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {card.subtitle}
                    </div>
                  </div>
                </div>
                <ChevronRight size={17} className="text-slate-500 shrink-0" />
              </button>
            );
          })}
        </section>
      </main>

      {/* Confirm Overwrite Modal when starting Nova Carreira with existing career */}
      {confirmOverwrite && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111B2B] border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Iniciar Nova Carreira?
                </h3>
                <p className="text-xs text-slate-400">
                  Você já possui uma carreira ativa ({career?.personal.nickname} · OVR {career?.ovr}).
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ao concluir a criação de um novo jogador e assinar com um clube, o progresso da carreira anterior será substituído.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  clickSfx();
                  setConfirmOverwrite(false);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clickSfx();
                  setConfirmOverwrite(false);
                  onNewCareer();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs cursor-pointer"
              >
                Sim, Criar Novo Atleta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
