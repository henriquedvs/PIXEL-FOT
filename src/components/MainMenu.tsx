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
import './MainMenu.css';

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
    <div className="main-menu-shell animate-fadeIn">
      <header className="main-menu-header">
        <div className="main-menu-brand">
          <div className="main-menu-brand-mark"><PixelTrophyIcon size={24} /></div>
          <div><div className="main-menu-wordmark">PIXEL <b>FOOTBALL</b></div><div className="main-menu-tagline">FUTEBOL BRASILEIRO EM PIXEL ART</div></div>
        </div>
        <div className="main-menu-header-actions">
          {career && <div className="main-season-chip"><span className="main-season-dot" /> TEMPORADA {career.season}</div>}
          {career && <button type="button" className="main-menu-utility" onClick={() => { clickSfx(); onOpenCustomization(); }}><Paintbrush size={15} /><span>PERSONALIZAR</span></button>}
          <button type="button" className="main-menu-utility" onClick={() => { clickSfx(); onOpenCredits(); }}><Info size={15} /><span>CRÉDITOS</span></button>
        </div>
      </header>

      <main className="main-menu-stage">
        <section className="main-career-panel">
          <div className="main-menu-pitch" aria-hidden="true"><i /><b /><em /></div>
          {career && club ? (
            <>
              <div className="main-panel-overline"><span>CARREIRA ATIVA</span><span>T{career.season} · ROD. {career.round}/{maxRound}</span></div>
              <div className="main-player-spotlight">
                <canvas ref={spriteRef} width={96} height={96} className="main-player-canvas pixelated" aria-label="Retrato em pixel art do atleta" />
                <div className="main-player-copy">
                  <div className="main-player-rating"><span>OVR</span><b>{career.ovr}</b></div>
                  <h1>{career.personal.nickname || `${career.personal.firstName} ${career.personal.lastName}`}</h1>
                  <p>{getPositionMeta(career.position).code} · #{career.gear.jerseyNumber} · {age} ANOS</p>
                  <div className="main-player-club"><ClubCrest club={club} size={20} /><span>{club.name}</span></div>
                </div>
              </div>
              <div className="main-career-stats">
                <div><small>SÉRIE A</small><b>{leaguePos > 0 ? `${leaguePos}º` : '—'}</b></div>
                <div><small>GOLS</small><b>{career.seasonStats.goals}</b></div>
                <div><small>ASSIST.</small><b>{career.seasonStats.assists}</b></div>
                <div className="main-next-opponent"><small>PRÓXIMO JOGO</small><b>{oppClub ? `VS ${oppClub.shortName}` : 'AGENDA'}</b></div>
              </div>
              <div className="main-career-actions">
                <button type="button" className="main-primary-action" onClick={() => { clickSfx(); onContinueCareer(); }}><Play size={16} fill="currentColor" /> CONTINUAR CARREIRA <ChevronRight size={17} /></button>
                <button type="button" className="main-secondary-action" onClick={handleNewCareerClick}><RotateCcw size={15} /> NOVA CARREIRA</button>
              </div>
            </>
          ) : (
            <>
              <div className="main-panel-overline"><span>COMECE SUA JORNADA</span><span>BRASIL · 2026</span></div>
              <div className="main-new-career-promo">
                <div className="main-promo-emblem"><PixelShieldIcon size={34} /></div>
                <span className="main-promo-kicker">SEU CAMINHO. SUA HISTÓRIA.</span>
                <h1>O próximo craque<br />pode ser você.</h1>
                <p>Crie seu atleta, escolha um clube e conquiste espaço no futebol brasileiro.</p>
              </div>
              <div className="main-career-actions">
                <button type="button" className="main-primary-action" onClick={handleNewCareerClick}><User size={17} /> NOVA CARREIRA <ChevronRight size={17} /></button>
              </div>
            </>
          )}
        </section>

        <section className="main-menu-options" aria-label="Opções principais">
          <div className="main-options-heading"><span>MENU PRINCIPAL</span><span>SELECIONE UMA OPÇÃO</span></div>
          {menuCards.map((card, index) => (
            <button key={card.id} type="button" className="main-option-row" onClick={() => { clickSfx(); card.onClick(); }}>
              <span className="main-option-index">0{index + 1}</span>
              <span className="main-option-icon">{card.icon}</span>
              <span className="main-option-copy"><b>{card.title}</b><small>{card.subtitle}</small></span>
              <ChevronRight size={17} className="main-option-arrow" />
            </button>
          ))}
          <div className="main-menu-footer-note"><span className="main-controller-key">A</span> TOQUE PARA SELECIONAR</div>
        </section>
      </main>

      {confirmOverwrite && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111B2B] border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0"><AlertTriangle size={20} className="text-amber-400" /></div>
              <div><h3 className="font-display font-bold text-base text-white">Iniciar Nova Carreira?</h3><p className="text-xs text-slate-400">Você já possui uma carreira ativa ({career?.personal.nickname} · OVR {career?.ovr}).</p></div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">Ao concluir a criação de um novo jogador e assinar com um clube, o progresso da carreira anterior será substituído.</p>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => { clickSfx(); setConfirmOverwrite(false); }} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer">Cancelar</button>
              <button type="button" onClick={() => { clickSfx(); setConfirmOverwrite(false); onNewCareer(); }} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs cursor-pointer">Sim, Criar Novo Atleta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
