import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  ChevronRight,
  Dumbbell,
  FastForward,
  Info,
  Newspaper,
  Paintbrush,
  Play,
  RotateCcw,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { getPositionMeta } from '../data/positions';
import { getStadiumForClub } from '../data/stadiums';
import {
  PITCH_GEO,
  drawPixelStadium,
  generateCrowd,
} from '../engine/pixelRenderer';
import { PlayerCareer } from '../types/game';
import { calculateAge } from '../utils/storage';
import { ClubCrest } from './ClubCrest';
import {
  PixelBallIcon,
  PixelCalendarIcon,
  PixelFlag,
  PixelShieldIcon,
  PixelStadiumIcon,
  PixelTrophyIcon,
} from './PixelIcons';
import { PixelPortrait } from './PixelPortrait';
import './MainMenu.css';

export type CareerHubTab =
  | 'CENTRAL'
  | 'CALENDARIO'
  | 'TREINO'
  | 'COMPETICOES'
  | 'NOTICIAS'
  | 'OBJETIVOS'
  | 'ESTATS'
  | 'CONTRATO'
  | 'ELENCO';

interface MainMenuProps {
  career: PlayerCareer | null;
  onContinueCareer: () => void;
  onNewCareer: () => void;
  onOpenPlayerProfile: () => void;
  onOpenSquad: () => void;
  onOpenClubs: () => void;
  onOpenStadiums: () => void;
  onOpenCompetitions: () => void;
  onOpenCalendar: () => void;
  onOpenCareerTab?: (tab: CareerHubTab) => void;
  onPlayNextMatch?: (
    homeClubId: string,
    awayClubId: string,
    competitionName?: string,
    fixtureId?: string
  ) => void;
  onSimulateNextMatch?: (
    homeClubId: string,
    awayClubId: string,
    competitionName?: string,
    fixtureId?: string
  ) => void;
  onOpenCustomization: () => void;
  onOpenSettings: () => void;
  onOpenCredits: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  career,
  onContinueCareer,
  onNewCareer,
  onOpenPlayerProfile,
  onOpenSquad,
  onOpenClubs,
  onOpenStadiums,
  onOpenCompetitions,
  onOpenCalendar,
  onOpenCareerTab,
  onPlayNextMatch,
  onSimulateNextMatch,
  onOpenCustomization,
  onOpenSettings,
  onOpenCredits,
}) => {
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const backdropRef = useRef<HTMLCanvasElement | null>(null);

  const club = career ? getClubById(career.clubId) : null;
  const activeDivision = career?.division || 'Série A';
  const activeStandings =
    career && activeDivision === 'Série B' && career.serieBStandings?.length
      ? career.serieBStandings
      : career?.standings || [];
  const activeSchedule =
    career && activeDivision === 'Série B' && career.serieBSchedule?.length
      ? career.serieBSchedule
      : career?.schedule || [];

  const maxRound = activeSchedule.reduce((m, f) => Math.max(m, f.round), 38);
  const leaguePos = career
    ? activeStandings.findIndex((s) => s.clubId === career.clubId) + 1
    : 0;

  const nextMatchDay = useMemo(() => {
    if (!career) return null;
    return career.calendar.find(
      (d, idx) => idx >= career.currentDayIndex && !d.completed && d.activity === 'PARTIDA'
    );
  }, [career]);

  const nextFixture = useMemo(() => {
    if (!career || !club) return null;
    if (nextMatchDay?.opponentClubId) {
      return {
        homeClubId: nextMatchDay.isHome ? career.clubId : nextMatchDay.opponentClubId,
        awayClubId: nextMatchDay.isHome ? nextMatchDay.opponentClubId : career.clubId,
        competition: nextMatchDay.competition || `Brasileirão ${activeDivision}`,
        fixtureId: nextMatchDay.matchId,
        dateLabel: nextMatchDay.dateLabel,
      };
    }
    const fx =
      activeSchedule.find(
        (f) =>
          f.round === career.round &&
          (f.homeClubId === career.clubId || f.awayClubId === career.clubId)
      ) || activeSchedule[0];
    if (!fx) return null;
    return {
      homeClubId: fx.homeClubId,
      awayClubId: fx.awayClubId,
      competition: fx.competition || `Brasileirão ${activeDivision}`,
      fixtureId: `${activeDivision === 'Série B' ? 'serieB' : 'serieA'}_${career.season}_r${career.round}`,
      dateLabel: `Rod. ${career.round}`,
    };
  }, [career, club, nextMatchDay, activeSchedule, activeDivision]);

  const homeClub = nextFixture ? getClubById(nextFixture.homeClubId) : null;
  const awayClub = nextFixture ? getClubById(nextFixture.awayClubId) : null;
  const oppClub =
    career && nextMatchDay?.opponentClubId
      ? getClubById(nextMatchDay.opponentClubId)
      : nextFixture
      ? getClubById(
          nextFixture.homeClubId === career?.clubId
            ? nextFixture.awayClubId
            : nextFixture.homeClubId
        )
      : null;

  useEffect(() => {
    const canvas = backdropRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgClub = club || getClubById('mirassol');
    const bgOpp = oppClub || getClubById('cruzeiro');
    const bgStadium = getStadiumForClub(bgClub);
    const crowd = generateCrowd(bgClub.kit.primary, bgClub.kit.secondary, '#F8FAFC', 'low', {
      capacity: bgStadium.capacity,
      importance: 0.78,
    });

    let raf = 0;
    let t = 0;
    let lastDraw = 0;

    const frame = (now: number) => {
      if (now - lastDraw >= 55) {
        lastDraw = now;
        t += 0.055;
        const w = canvas.width;
        const h = canvas.height;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#071019';
        ctx.fillRect(0, 0, w, h);

        const zoom = Math.max(w / 1450, h / 820);
        const camX = PITCH_GEO.worldW / 2 + Math.sin(t * 0.2) * 65;
        const camY = PITCH_GEO.worldH / 2 + Math.cos(t * 0.16) * 28;

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-Math.round(camX), -Math.round(camY));

        drawPixelStadium(ctx, crowd, t, 0.25, 0, 0, 'low', {
          stadium: bgStadium,
          homeKit: bgClub.kit,
          awayKit: bgOpp.awayKit || bgOpp.kit,
          homeShort: bgClub.shortName,
          awayShort: bgOpp.shortName,
          homeScore: 0,
          awayScore: 0,
          matchMinuteStr: 'NOITE',
          mascot: bgClub.mascot,
          crowdMood: 'calm',
          env: {
            competitionName: `Brasileirão ${activeDivision}`,
            roundLabel: 'Noite de Futebol',
            dateStr: '2026',
            kickoffTime: '21:00',
            timeOfDay: 'Noite',
            weather: 'Nublado',
            temperatureC: 21,
            stadium: bgStadium,
          },
          environmentalEffects: false,
          effectsIntensity: 0.5,
        });
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [club, oppClub, activeDivision]);

  const sfx = () => soundEngine.play('menu');
  const openCareerTab = (tab: CareerHubTab) => {
    sfx();
    if (career && onOpenCareerTab) {
      onOpenCareerTab(tab);
      return;
    }
    if (tab === 'CALENDARIO') onOpenCalendar();
    else if (tab === 'COMPETICOES') onOpenCompetitions();
    else if (tab === 'ELENCO') onOpenSquad();
    else if (tab === 'ESTATS') onOpenPlayerProfile();
    else onNewCareer();
  };

  const currentDay = career?.calendar[career.currentDayIndex];
  const age = career ? calculateAge(career.personal.birthDate) : 18;
  const posMeta = career ? getPositionMeta(career.position) : null;

  return (
    <div className="px-menu-shell animate-fadeIn">
      <canvas ref={backdropRef} width={960} height={540} className="px-menu-backdrop pixelated" />
      <div className="px-menu-scrim px-scanlines" />

      {/* Top Reference Header */}
      <header className="px-menu-topbar">
        <div className="px-menu-brand">
          <PixelBallIcon size={28} />
          <div className="px-menu-brand-title">PIXEL FOOTBALL</div>
          <div className="px-divider-v h-7 hidden sm:block" />
          <div className="px-menu-brand-sub hidden sm:block">
            <div>MAIS QUE FUTEBOL</div>
            <div>CARREIRA DE JOGADOR 11V11</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {career && club && (
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 px-panel-soft text-xs font-mono-num">
              <ClubCrest club={club} size={20} />
              <span className="font-bold text-white">{club.shortName}</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400">
                {currentDay ? currentDay.dateLabel : `ROD ${career.round}/${maxRound}`}
              </span>
            </div>
          )}

          {career ? (
            <button
              type="button"
              onClick={() => {
                sfx();
                onContinueCareer();
              }}
              className="px-btn-primary px-4 py-2 min-h-[38px] text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Play size={13} fill="currentColor" />
              CENTRAL DA CARREIRA
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sfx();
                onNewCareer();
              }}
              className="px-btn-primary px-4 py-2 min-h-[38px] text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Play size={13} fill="currentColor" />
              CRIAR JOGADOR
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sfx();
              onOpenSettings();
            }}
            className="px-btn-secondary w-[38px] h-[38px] flex items-center justify-center cursor-pointer"
            aria-label="Configurações"
            title="Configurações"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Split: Career Dossier Left + Pixel Menu Tiles Right */}
      <main className="px-menu-body custom-scroll">
        <div className="px-menu-grid">
          {/* LEFT COLUMN: Active Career Dossier OR New Career Hero */}
          <section className="px-panel p-4 flex flex-col justify-between gap-3">
            {career && club && posMeta ? (
              <>
                <div className="flex items-start gap-3.5">
                  <PixelPortrait
                    variant="bust"
                    size={90}
                    skinColor={career.appearance.skinColor}
                    hairColor={career.appearance.hairColor}
                    hairStyle={career.appearance.hairStyle}
                    shirtPrimary={club.kit.primary}
                    shirtSecondary={club.kit.secondary}
                    beard={career.appearance.beardStyle !== 'Nenhuma'}
                    jerseyNumber={career.gear.jerseyNumber}
                    crestBg={club.kit.primary}
                    crestAccent={club.kit.secondary}
                  />

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <PixelFlag nationality={career.personal.nationality} width={22} />
                      <span className="font-mono-num text-[11px] font-bold text-slate-400">
                        {age} ANOS
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-xl text-white leading-none truncate">
                      {(career.personal.nickname || career.personal.firstName).toUpperCase()}
                    </h2>
                    <div className="font-display font-bold text-base text-amber-400 leading-none">
                      #{career.gear.jerseyNumber}
                    </div>
                    <div className="text-[11px] text-slate-400 uppercase font-mono-num truncate">
                      {posMeta.name}
                    </div>

                    <div className="pt-2 border-t border-[#1D3143] flex items-end justify-between">
                      <div>
                        <div className="font-mono-num text-[10px] text-slate-400">OVR</div>
                        <div className="font-display font-bold text-3xl text-amber-300 leading-none">
                          {career.ovr}
                        </div>
                      </div>
                      <div className="text-right font-mono-num">
                        <div className="text-[10px] text-slate-400">TEMPORADA {career.season}</div>
                        <div className="text-xs font-bold text-emerald-400">
                          {leaguePos || 1}º {activeDivision}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Club & Season Split Counters */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-[#1C3042] text-center font-mono-num">
                  <div>
                    <div className="text-base font-bold text-white">{career.seasonStats.goals}</div>
                    <div className="text-[10px] text-slate-400">GOLS</div>
                  </div>
                  <div className="border-x border-[#1C3042]">
                    <div className="text-base font-bold text-white">{career.seasonStats.assists}</div>
                    <div className="text-[10px] text-slate-400">ASSIST.</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-400">
                      {career.seasonStats.matches}
                    </div>
                    <div className="text-[10px] text-slate-400">JOGOS</div>
                  </div>
                </div>

                {/* Next Fixture Mini Box */}
                {nextFixture && homeClub && awayClub && (
                  <div className="px-panel-soft p-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono-num text-slate-400">
                      <span className="text-emerald-400 font-bold uppercase truncate">
                        PRÓXIMO JOGO · {nextFixture.competition}
                      </span>
                      <span>{nextFixture.dateLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ClubCrest club={homeClub} size={28} />
                        <span className="font-display font-bold text-sm text-white truncate">
                          {homeClub.shortName}
                        </span>
                      </div>
                      <span className="font-display font-bold text-xs text-slate-400">X</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-display font-bold text-sm text-white truncate">
                          {awayClub.shortName}
                        </span>
                        <ClubCrest club={awayClub} size={28} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Menu Actions */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      sfx();
                      onContinueCareer();
                    }}
                    className="px-btn-primary w-full py-2.5 min-h-[42px] text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={15} fill="currentColor" />
                    ENTRAR NA CARREIRA
                  </button>

                  {nextFixture && onPlayNextMatch && onSimulateNextMatch && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.play('whistle');
                          onPlayNextMatch(
                            nextFixture.homeClubId,
                            nextFixture.awayClubId,
                            nextFixture.competition,
                            nextFixture.fixtureId
                          );
                        }}
                        className="px-btn-secondary py-2 min-h-[38px] text-xs text-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play size={12} fill="currentColor" />
                        JOGAR AGORA
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sfx();
                          onSimulateNextMatch(
                            nextFixture.homeClubId,
                            nextFixture.awayClubId,
                            nextFixture.competition,
                            nextFixture.fixtureId
                          );
                        }}
                        className="px-btn-secondary py-2 min-h-[38px] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FastForward size={12} />
                        SIMULAR
                      </button>
                    </div>
                  )}

                  {!confirmOverwrite ? (
                    <button
                      type="button"
                      onClick={() => {
                        sfx();
                        setConfirmOverwrite(true);
                      }}
                      className="w-full py-1.5 text-[11px] font-mono-num text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      COMEÇAR NOVA CARREIRA
                    </button>
                  ) : (
                    <div className="p-2.5 px-panel-soft border-amber-500/50 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
                        <AlertTriangle size={13} />
                        Substituir carreira atual?
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sfx();
                            setConfirmOverwrite(false);
                            onNewCareer();
                          }}
                          className="px-btn-gold py-1.5 text-xs cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sfx();
                            setConfirmOverwrite(false);
                          }}
                          className="px-btn-secondary py-1.5 text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-between gap-4 py-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono-num text-xs font-bold">
                    <span className="px-flag-stripe-br inline-block" />
                    NOVA CARREIRA DE JOGADOR
                  </div>
                  <h2 className="font-display font-bold text-2xl text-white leading-tight">
                    CRIE SEU CRAQUE E DOMINE O GRAMADO
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Escolha aparência em Pixel Art, posição, estilo de jogo e inicie sua jornada da Série B ou Série A rumo aos títulos nacionais.
                  </p>
                </div>

                <div className="px-panel-soft p-3 flex items-center justify-around">
                  <ClubCrest club={getClubById('mirassol')} size={38} />
                  <ClubCrest club={getClubById('flamengo')} size={38} />
                  <ClubCrest club={getClubById('palmeiras')} size={38} />
                  <ClubCrest club={getClubById('cruzeiro')} size={38} />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sfx();
                    onNewCareer();
                  }}
                  className="px-btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play size={16} fill="currentColor" />
                  INICIAR CARREIRA
                </button>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Pixel Game Menu Navigation Grid */}
          <section className="px-panel p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between border-b border-[#1C3042] pb-2">
              <div className="flex items-center gap-2">
                <span className="px-flag-stripe-br inline-block" />
                <h2 className="font-display font-bold text-base text-white tracking-wider">
                  MENU PRINCIPAL
                </h2>
              </div>
              <span className="font-mono-num text-[10px] text-slate-400 uppercase">
                SONHOS · DISCIPLINA · EVOLUÇÃO
              </span>
            </div>

            <div className="px-menu-nav-grid flex-1">
              <MenuTile
                icon={<User size={18} className="text-emerald-400" />}
                title="MEU JOGADOR"
                desc="Perfil, atributos e evolução"
                onClick={() => {
                  sfx();
                  onOpenPlayerProfile();
                }}
              />
              <MenuTile
                icon={<Users size={18} className="text-sky-400" />}
                title="ELENCO"
                desc="Formação tática e companheiros"
                onClick={() => {
                  sfx();
                  onOpenSquad();
                }}
              />
              <MenuTile
                icon={<Dumbbell size={18} className="text-amber-300" />}
                title="TREINOS"
                desc="Minijogos para ganhar XP"
                onClick={() => openCareerTab('TREINO')}
              />
              <MenuTile
                icon={<PixelCalendarIcon size={18} />}
                title="CALENDÁRIO"
                desc="Jogos, copa e agenda anual"
                onClick={() => {
                  sfx();
                  onOpenCalendar();
                }}
              />
              <MenuTile
                icon={<PixelTrophyIcon size={18} />}
                title="COMPETIÇÕES"
                desc="Série A, Série B, Copa e Supercopa"
                onClick={() => {
                  sfx();
                  onOpenCompetitions();
                }}
              />
              <MenuTile
                icon={<Newspaper size={18} className="text-slate-200" />}
                title="NOTÍCIAS"
                desc="Cobertura da imprensa e rodadas"
                onClick={() => openCareerTab('NOTICIAS')}
              />
              <MenuTile
                icon={<Briefcase size={18} className="text-emerald-300" />}
                title="CONTRATO"
                desc="Salário e propostas de clubes"
                onClick={() => openCareerTab('CONTRATO')}
              />
              <MenuTile
                icon={<PixelShieldIcon size={18} />}
                title="CLUBES"
                desc="40 times e uniformes em pixel"
                onClick={() => {
                  sfx();
                  onOpenClubs();
                }}
              />
              <MenuTile
                icon={<PixelStadiumIcon size={18} />}
                title="ESTÁDIOS"
                desc="Arenas brasileiras e capacidade"
                onClick={() => {
                  sfx();
                  onOpenStadiums();
                }}
              />
              <MenuTile
                icon={<Paintbrush size={18} className="text-amber-300" />}
                title="PERSONALIZAR"
                desc="Rosto, chuteiras e comemoração"
                onClick={() => {
                  sfx();
                  if (career) onOpenCustomization();
                  else onNewCareer();
                }}
              />
              <MenuTile
                icon={<Settings size={18} className="text-sky-300" />}
                title="CONFIGURAÇÕES"
                desc="Câmeras, HUD, áudio e toques"
                onClick={() => {
                  sfx();
                  onOpenSettings();
                }}
              />
              <MenuTile
                icon={<Info size={18} className="text-slate-300" />}
                title="CRÉDITOS"
                desc="Sobre o Pixel Football"
                onClick={() => {
                  sfx();
                  onOpenCredits();
                }}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

function MenuTile({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="px-menu-tile">
      <div className="flex items-center justify-between w-full">
        {icon}
        <ChevronRight size={14} className="text-slate-500" />
      </div>
      <div>
        <div className="px-menu-tile-title">{title}</div>
        <div className="px-menu-tile-desc truncate">{desc}</div>
      </div>
    </button>
  );
}
