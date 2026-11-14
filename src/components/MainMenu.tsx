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
  drawPixelPlayerSprite,
  drawPixelStadium,
  generateCrowd,
} from '../engine/pixelRenderer';
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
  const spriteRef = useRef<HTMLCanvasElement | null>(null);
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

  // Nocturnal live pixel-art stadium background behind the hub
  useEffect(() => {
    const canvas = backdropRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgClub = club || getClubById('flamengo');
    const bgOpp = oppClub || getClubById('palmeiras');
    const bgStadium = getStadiumForClub(bgClub);
    const crowd = generateCrowd(bgClub.kit.primary, bgClub.kit.secondary, '#F8FAFC', 'low', {
      capacity: bgStadium.capacity,
      importance: 0.78,
    });

    let raf = 0;
    let t = 0;
    let lastDraw = 0;

    const frame = (now: number) => {
      if (now - lastDraw >= 45) {
        lastDraw = now;
        t += 0.045;
        const w = canvas.width;
        const h = canvas.height;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#070D15';
        ctx.fillRect(0, 0, w, h);

        const zoom = Math.max(w / 1450, h / 820);
        const camX = PITCH_GEO.worldW / 2 + Math.sin(t * 0.22) * 70;
        const camY = PITCH_GEO.worldH / 2 + Math.cos(t * 0.18) * 32;

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

  // Animated pixel player sprite in spotlight
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
        ? `OVR ${career.ovr} · Pot ${career.potential ?? career.ovr} · ${career.careerStats.goals}G ${career.careerStats.assists}A`
        : 'Ficha completa, atributos e evolução',
      icon: <PixelBootIcon size={20} />,
      onClick: onOpenPlayerProfile,
    },
    {
      id: 'squad',
      title: 'Elenco',
      subtitle: club
        ? `${club.shortName} · Formação ${club.formation} · 16 atletas`
        : 'Escalação tática e elenco completo',
      icon: <Users size={18} className="text-emerald-300" />,
      onClick: onOpenSquad,
    },
    {
      id: 'training',
      title: 'Treinamento',
      subtitle: career
        ? `${career.trainingPoints} sessão(ões) · Fadiga ${career.fatigue}%`
        : 'Minijogos técnicos, físicos e táticos',
      icon: <Dumbbell size={18} className="text-emerald-300" />,
      onClick: () => (career && onOpenCareerTab ? onOpenCareerTab('TREINO') : onContinueCareer()),
    },
    {
      id: 'calendar',
      title: 'Calendário',
      subtitle: career
        ? `${career.calendar[career.currentDayIndex]?.dateLabel || 'Agenda'} · Compromissos`
        : 'Agenda da temporada e copas',
      icon: <PixelCalendarIcon size={20} />,
      onClick: onOpenCalendar,
    },
    {
      id: 'competitions',
      title: 'Competições',
      subtitle: 'Série A, Série B, Copa do Brasil e Supercopa',
      icon: <PixelTrophyIcon size={20} />,
      onClick: onOpenCompetitions,
    },
    {
      id: 'news',
      title: 'Notícias',
      subtitle: career?.news?.[0]?.headline || 'Portal de imprensa e destaques',
      icon: <Newspaper size={18} className="text-emerald-300" />,
      onClick: () => (career && onOpenCareerTab ? onOpenCareerTab('NOTICIAS') : onOpenCompetitions()),
    },
    {
      id: 'transfers',
      title: 'Transferências',
      subtitle: career
        ? `${career.offers.length} proposta(s) · Contrato ${career.contract.yearsRemaining}a`
        : 'Mercado, renovações e propostas',
      icon: <Briefcase size={18} className="text-emerald-300" />,
      onClick: () => (career && onOpenCareerTab ? onOpenCareerTab('CONTRATO') : onNewCareer()),
    },
    {
      id: 'clubs',
      title: 'Clubes',
      subtitle: '40 equipes (Série A e B) · 3 uniformes',
      icon: <PixelShieldIcon size={20} />,
      onClick: onOpenClubs,
    },
    {
      id: 'stadiums',
      title: 'Estádios',
      subtitle: '40 arenas em Pixel Art interativo',
      icon: <PixelStadiumIcon size={20} />,
      onClick: onOpenStadiums,
    },
    {
      id: 'settings',
      title: 'Configurações',
      subtitle: 'Áudio, controles, gráficos e tela cheia',
      icon: <Settings size={18} className="text-slate-200" />,
      onClick: onOpenSettings,
    },
  ];

  const age = career ? calculateAge(career.personal.birthDate) : 18;
  const latestNews = career?.news?.[0];
  const marketValueM = career?.marketValue
    ? `R$ ${(career.marketValue / 1000000).toFixed(1)}M`
    : '—';

  return (
    <div className="main-menu-shell animate-fadeIn">
      <header className="main-menu-header">
        <div className="main-menu-brand">
          <div className="main-menu-brand-mark">
            <PixelTrophyIcon size={24} />
          </div>
          <div>
            <div className="main-menu-wordmark">
              PIXEL <b>FOOTBALL</b>
            </div>
            <div className="main-menu-tagline">CARREIRA DE JOGADOR EM PIXEL ART</div>
          </div>
        </div>
        <div className="main-menu-header-actions">
          {career && (
            <div className="main-season-chip">
              TEMPORADA {career.season} · {activeDivision.toUpperCase()}
            </div>
          )}
          {career && (
            <button
              type="button"
              className="main-menu-utility"
              onClick={() => {
                clickSfx();
                onOpenCustomization();
              }}
            >
              <Paintbrush size={15} />
              <span>PERSONALIZAR</span>
            </button>
          )}
          <button
            type="button"
            className="main-menu-utility"
            onClick={() => {
              clickSfx();
              onOpenCredits();
            }}
          >
            <Info size={15} />
            <span>CRÉDITOS</span>
          </button>
        </div>
      </header>

      <main className="main-menu-stage">
        <canvas
          ref={backdropRef}
          width={960}
          height={540}
          className="main-menu-backdrop pixelated"
          aria-hidden="true"
        />
        <div className="main-menu-backdrop-scrim" aria-hidden="true" />

        <section className="main-career-panel">
          <div className="main-menu-pitch" aria-hidden="true">
            <i />
            <b />
            <em />
          </div>
          {career && club ? (
            <>
              <div className="main-panel-overline">
                <span>CARREIRA ATIVA · {career.contract.role.toUpperCase()}</span>
                <span>
                  T{career.season} · ROD. {career.round}/{maxRound}
                </span>
              </div>

              <div className="main-player-spotlight">
                <canvas
                  ref={spriteRef}
                  width={96}
                  height={96}
                  className="main-player-canvas pixelated"
                  aria-label="Retrato em pixel art do atleta"
                />
                <div className="main-player-copy">
                  <div className="main-player-rating">
                    <span>OVR / POT</span>
                    <b>
                      {career.ovr}
                      <small>/{career.potential ?? career.ovr}</small>
                    </b>
                  </div>
                  <h1>
                    {career.personal.nickname ||
                      `${career.personal.firstName} ${career.personal.lastName}`}
                  </h1>
                  <p>
                    {getPositionMeta(career.position).code} · #{career.gear.jerseyNumber} · {age} ANOS
                  </p>
                  <div className="main-player-club">
                    <ClubCrest club={club} size={20} />
                    <span>
                      {club.name} · {marketValueM}
                    </span>
                  </div>
                </div>
              </div>

              <div className="main-career-stats">
                <div>
                  <small>{activeDivision.toUpperCase()}</small>
                  <b>{leaguePos > 0 ? `${leaguePos}º` : '—'}</b>
                </div>
                <div>
                  <small>GOLS / ASS.</small>
                  <b>
                    {career.seasonStats.goals} / {career.seasonStats.assists}
                  </b>
                </div>
                <div>
                  <small>CONTRATO</small>
                  <b>
                    {career.contract.yearsRemaining}A · R${' '}
                    {Math.round(career.contract.weeklySalary / 1000)}k
                  </b>
                </div>
                <div className="main-next-opponent">
                  <small>PRÓXIMO JOGO</small>
                  <b>{oppClub ? `VS ${oppClub.shortName}` : 'AGENDA'}</b>
                </div>
              </div>

              {homeClub && awayClub && nextFixture && (
                <div className="main-next-match-card">
                  <div className="main-next-match-teams">
                    <span className="main-next-team">
                      <ClubCrest club={homeClub} size={20} />
                      {homeClub.shortName}
                    </span>
                    <span className="main-next-vs">x</span>
                    <span className="main-next-team">
                      {awayClub.shortName}
                      <ClubCrest club={awayClub} size={20} />
                    </span>
                  </div>
                  <div className="main-next-match-meta">
                    <span>{nextFixture.competition}</span>
                    <span>{getStadiumForClub(homeClub).name}</span>
                  </div>
                </div>
              )}

              {latestNews && (
                <button
                  type="button"
                  className="main-news-ticker"
                  onClick={() => {
                    clickSfx();
                    onOpenCareerTab?.('NOTICIAS');
                  }}
                >
                  <small>{latestNews.category}</small>
                  <span>{latestNews.headline}</span>
                </button>
              )}

              <div className="main-career-actions">
                <button
                  type="button"
                  className="main-primary-action"
                  onClick={() => {
                    clickSfx();
                    onContinueCareer();
                  }}
                >
                  <Play size={15} fill="currentColor" /> CENTRAL DA CARREIRA
                </button>
                {nextFixture && onPlayNextMatch && (
                  <button
                    type="button"
                    className="main-secondary-action is-accent"
                    onClick={() => {
                      soundEngine.play('whistle');
                      onPlayNextMatch(
                        nextFixture.homeClubId,
                        nextFixture.awayClubId,
                        nextFixture.competition,
                        nextFixture.fixtureId
                      );
                    }}
                  >
                    <Play size={13} fill="currentColor" /> JOGAR
                  </button>
                )}
                {nextFixture && onSimulateNextMatch && (
                  <button
                    type="button"
                    className="main-secondary-action"
                    onClick={() => {
                      clickSfx();
                      onSimulateNextMatch(
                        nextFixture.homeClubId,
                        nextFixture.awayClubId,
                        nextFixture.competition,
                        nextFixture.fixtureId
                      );
                    }}
                  >
                    <FastForward size={13} /> SIMULAR
                  </button>
                )}
                <button
                  type="button"
                  className="main-secondary-action"
                  onClick={handleNewCareerClick}
                  title="Iniciar Nova Carreira"
                >
                  <RotateCcw size={14} /> NOVA
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="main-panel-overline">
                <span>COMECE SUA JORNADA</span>
                <span>BRASIL · 2026</span>
              </div>
              <div className="main-new-career-promo">
                <div className="main-promo-emblem">
                  <PixelShieldIcon size={34} />
                </div>
                <span className="main-promo-kicker">SEU CAMINHO. SUA HISTÓRIA.</span>
                <h1>
                  O próximo craque
                  <br />
                  pode ser você.
                </h1>
                <p>
                  Crie seu atleta, escolha um dos 40 clubes da Série A ou Série B, evolua nos treinos e viva partidas 11v11 em Pixel Art.
                </p>
              </div>
              <div className="main-career-actions">
                <button
                  type="button"
                  className="main-primary-action"
                  onClick={handleNewCareerClick}
                >
                  <User size={17} /> NOVA CARREIRA <ChevronRight size={17} />
                </button>
              </div>
            </>
          )}
        </section>

        <section className="main-menu-options" aria-label="Opções principais">
          <div className="main-options-heading">
            <span>NAVEGAÇÃO RÁPIDA</span>
            <span>TOQUE PARA ABRIR</span>
          </div>
          <div className="main-options-grid">
            {menuCards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                className="main-option-row"
                onClick={() => {
                  clickSfx();
                  card.onClick();
                }}
              >
                <span className="main-option-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="main-option-icon">{card.icon}</span>
                <span className="main-option-copy">
                  <b>{card.title}</b>
                  <small>{card.subtitle}</small>
                </span>
                <ChevronRight size={15} className="main-option-arrow" />
              </button>
            ))}
          </div>
        </section>
      </main>

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
