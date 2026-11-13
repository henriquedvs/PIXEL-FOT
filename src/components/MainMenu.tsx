import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Info,
  Paintbrush,
  Play,
  RotateCcw,
  Settings,
  User,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { getPositionMeta } from '../data/positions';
import { drawPixelPlayerSprite } from '../engine/pixelRenderer';
import { PlayerCareer } from '../types/game';
import { calculateAge } from '../utils/storage';
import { ClubCrest } from './ClubCrest';
import {
  PixelBootIcon,
  PixelCalendarIcon,
  PixelShieldIcon,
  PixelStadiumIcon,
  PixelTrophyIcon,
} from './PixelIcons';
import { PixelPortrait } from './PixelPortrait';

interface MainMenuProps {
  career: PlayerCareer | null;
  onContinueCareer: () => void;
  onNewCareer: () => void;
  onOpenPlayerProfile: () => void;
  onOpenClubs: () => void;
  onOpenStadiums: () => void;
  onOpenCompetitions: () => void;
  onOpenCalendar: () => void;
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
  onOpenCalendar,
  onOpenCustomization,
  onOpenSettings,
  onOpenCredits,
}) => {
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const spriteRef = useRef<HTMLCanvasElement | null>(null);

  const club = career ? getClubById(career.clubId) : null;
  const maxRound = career ? career.schedule.reduce((m, f) => Math.max(m, f.round), 38) : 38;
  const leaguePos = career
    ? career.standings.findIndex((s) => s.clubId === career.clubId) + 1
    : 0;
  const nextMatchDay = career
    ? career.calendar.find(
        (d, idx) => idx >= career.currentDayIndex && !d.completed && d.activity === 'PARTIDA'
      )
    : null;
  const oppClub =
    career && nextMatchDay?.opponentClubId
      ? getClubById(nextMatchDay.opponentClubId)
      : null;

  useEffect(() => {
    if (!career || !club) return;
    const canvas = spriteRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
    const render = () => {
      phase += 0.055;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0D1726';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#186A3B';
      ctx.fillRect(10, canvas.height - 22, canvas.width - 20, 12);

      drawPixelPlayerSprite(
        ctx,
        canvas.width / 2,
        canvas.height / 2 + 12 + Math.sin(phase) * 0.9,
        4.8,
        {
          appearance: career.appearance,
          gear: career.gear,
          kit: club.kit,
          isGoalkeeper: career.position === 'GK_TRAD' || career.position === 'GK_SWEEPER',
          isUserControlled: false,
          facingAngle: 0,
          animPhase: phase,
          isSprinting: false,
          isDribbling: false,
          hasBall: false,
          viewAngle: 'front',
        },
        'preview'
      );
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [career, club]);

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

  const menuCards = [
    {
      id: 'profile',
      title: 'Meu Jogador',
      subtitle: career
        ? `OVR ${career.ovr} · ${career.careerStats.goals}G ${career.careerStats.assists}A · Evolução`
        : 'Ficha completa, atributos e gráfico de evolução',
      icon: <PixelBootIcon size={22} />,
      onClick: onOpenPlayerProfile,
    },
    {
      id: 'clubs',
      title: 'Clubes',
      subtitle: '40 equipes (Série A e B) · 3 uniformes',
      icon: <PixelShieldIcon size={22} />,
      onClick: onOpenClubs,
    },
    {
      id: 'competitions',
      title: 'Competições',
      subtitle: 'Série A, Série B, Copa do Brasil e Supercopa',
      icon: <PixelTrophyIcon size={22} />,
      onClick: onOpenCompetitions,
    },
    {
      id: 'calendar',
      title: 'Calendário',
      subtitle: career
        ? `${career.calendar[career.currentDayIndex]?.dateLabel || 'Agenda'} · Compromissos e rodadas`
        : 'Agenda da temporada, rodadas e copas',
      icon: <PixelCalendarIcon size={22} />,
      onClick: onOpenCalendar,
    },
    {
      id: 'stadiums',
      title: 'Estádios',
      subtitle: '20 arenas em Pixel Art interativo',
      icon: <PixelStadiumIcon size={22} />,
      onClick: onOpenStadiums,
    },
    {
      id: 'settings',
      title: 'Configurações',
      subtitle: 'Áudio, controles, gráficos e tela cheia',
      icon: <Settings size={20} className="text-slate-200" />,
      onClick: onOpenSettings,
    },
  ];

  const age = career ? calculateAge(career.personal.birthDate) : 18;

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto custom-scroll animate-fadeIn">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <PixelTrophyIcon size={20} />
          </div>
          <div className="min-w-0">
            <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white whitespace-nowrap">
              PIXEL <span className="text-emerald-400">FOOTBALL</span>
            </span>
            <div className="text-[11px] text-slate-400 hidden sm:block truncate">
              Carreira Profissional · Brasileirão Série A & B · Copa do Brasil · Supercopa
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {career && (
            <button
              type="button"
              onClick={() => {
                clickSfx();
                onOpenCustomization();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-emerald-300 cursor-pointer whitespace-nowrap"
            >
              <Paintbrush size={14} />
              <span className="hidden sm:inline">Personalizar Atleta</span>
            </button>
          )}
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
        </div>
      </header>

      {/* Main 2-Column Sports Hub (8 Primary Entries) */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 my-3 items-stretch min-h-0">
        {/* Left: Continuar Carreira & Nova Carreira */}
        <section className="md:col-span-5 bg-[#111B2B] border border-emerald-500/35 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                Central do Atleta
              </span>
              {career && (
                <span className="text-xs text-slate-300 font-mono-num">
                  Temp. {career.season} · Rod. {career.round}/{maxRound}
                </span>
              )}
            </div>

            {career && club ? (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <canvas
                      ref={spriteRef}
                      width={78}
                      height={78}
                      className="w-16 h-16 rounded-xl border border-slate-700 bg-[#0D1726] pixelated shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <PixelPortrait
                          skinColor={career.appearance.skinColor}
                          hairColor={career.appearance.hairColor}
                          hairStyle={career.appearance.hairStyle}
                          shirtPrimary={club.kit.primary}
                          shirtSecondary={club.kit.secondary}
                          size={28}
                        />
                        <div className="font-display font-bold text-base text-white truncate">
                          {career.personal.nickname || `${career.personal.firstName} ${career.personal.lastName}`}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-1">
                        {getPositionMeta(career.position).code} · #{career.gear.jerseyNumber} · {age} anos · {club.name}
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

                <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-2.5 text-center">
                  <div className="bg-slate-950/60 rounded-lg py-1.5 px-2">
                    <div className="text-[10px] text-slate-400">Tabela Série A</div>
                    <div className="font-mono-num text-xs font-bold text-white">
                      {leaguePos > 0 ? `${leaguePos}º lugar` : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 rounded-lg py-1.5 px-2">
                    <div className="text-[10px] text-slate-400">Temporada</div>
                    <div className="font-mono-num text-xs font-bold text-emerald-400">
                      {career.seasonStats.goals}G · {career.seasonStats.assists}A
                    </div>
                  </div>
                  <div className="bg-slate-950/60 rounded-lg py-1.5 px-2">
                    <div className="text-[10px] text-slate-400">Próx. Jogo</div>
                    <div className="font-mono-num text-xs font-bold text-amber-300 truncate">
                      {oppClub ? `vs ${oppClub.shortName}` : 'Agenda'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/75 border border-slate-800 space-y-2">
                <h2 className="font-display text-xl font-extrabold text-white">
                  Construa Sua Carreira no Futebol
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Crie seu atleta em Pixel Art, assine com um clube da Série A, dispute o Brasileirão, a Copa do Brasil e a Supercopa e acompanhe cada rodada no calendário oficial.
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
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-base transition-colors cursor-pointer shadow-lg"
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
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-base transition-colors cursor-pointer shadow-lg"
              >
                <User size={19} />
                Nova Carreira
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </section>

        {/* Right: 6 Structured Navigation Cards = 8 Total Main Menu Options */}
        <section className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-stretch">
          {menuCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                clickSfx();
                card.onClick();
              }}
              className="text-left bg-[#111B2B] hover:bg-[#162338] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer min-h-[76px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  {card.icon}
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
          ))}
        </section>
      </main>

      {/* Confirm Overwrite Modal when starting Nova Carreira with existing career */}
      {confirmOverwrite && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111B2B] border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
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
