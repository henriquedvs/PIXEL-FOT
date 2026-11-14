import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  FastForward,
  List,
  MessageSquare,
  Play,
  SkipForward,
  UserPlus,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { CalendarDay, PlayerCareer } from '../types/game';
import { ClubCrest } from './ClubCrest';
import { PixelCalendarIcon } from './PixelIcons';

interface SeasonCalendarViewProps {
  career: PlayerCareer | null;
  onPlayMatch?: (
    homeClubId: string,
    awayClubId: string,
    competitionName?: string,
    fixtureId?: string
  ) => void;
  onSimulateMatch?: (
    homeClubId: string,
    awayClubId: string,
    competitionName?: string,
    fixtureId?: string
  ) => void;
  onTriggerNarrativeEvent?: (day: CalendarDay) => void;
  onAdvanceDay?: () => void;
  onAdvanceToNextMatch?: () => void;
  onBack?: () => void;
  onStartNewCareer?: () => void;
}

type CalendarMode = 'MENSAL' | 'SEMANAL' | 'LISTA';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function getDayStyle(day: CalendarDay): {
  badge: string;
  card: string;
  tag: string;
} {
  if (day.activity === 'PARTIDA') {
    if (day.isSupercopa || day.competition?.includes('Supercopa')) {
      return {
        badge: 'text-amber-300',
        card: 'border-amber-500/50 bg-amber-500/12',
        tag: 'Supercopa',
      };
    }
    if (day.competition?.includes('Copa do Brasil')) {
      return {
        badge: 'text-yellow-300',
        card: 'border-yellow-500/50 bg-yellow-500/12',
        tag: 'Copa do Brasil',
      };
    }
    return {
      badge: 'text-emerald-300',
      card: 'border-emerald-500/50 bg-emerald-500/12',
      tag: 'Brasileirão',
    };
  }
  if (day.activity === 'TREINO') {
    return {
      badge: 'text-sky-300',
      card: 'border-sky-500/35 bg-sky-500/10',
      tag: 'Treino',
    };
  }
  if (day.activity === 'DESCANSO' || day.activity === 'RECUPERACAO') {
    return {
      badge: 'text-teal-300',
      card: 'border-teal-500/35 bg-teal-500/10',
      tag: day.activity === 'DESCANSO' ? 'Descanso' : 'Recuperação',
    };
  }
  return {
    badge: 'text-indigo-300',
    card: 'border-indigo-500/35 bg-indigo-500/10',
    tag: day.activity === 'VIAGEM' ? 'Viagem' : day.activity === 'ESPECIAL' ? 'Evento' : 'Agenda',
  };
}

export const SeasonCalendarView: React.FC<SeasonCalendarViewProps> = ({
  career,
  onPlayMatch,
  onSimulateMatch,
  onTriggerNarrativeEvent,
  onAdvanceDay,
  onAdvanceToNextMatch,
  onBack,
  onStartNewCareer,
}) => {
  const [mode, setMode] = useState<CalendarMode>('MENSAL');
  const currentDay = career?.calendar[career.currentDayIndex];
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDay?.monthIndex ?? 0
  );
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(
    career?.currentDayIndex ?? 0
  );

  const availableMonths = useMemo(() => {
    if (!career) return [];
    const set = new Set<number>();
    career.calendar.forEach((d) => set.add(d.monthIndex ?? 0));
    return Array.from(set).sort((a, b) => a - b);
  }, [career]);

  const activeMonth = availableMonths.includes(selectedMonth)
    ? selectedMonth
    : currentDay?.monthIndex ?? availableMonths[0] ?? 0;

  const monthDays = useMemo(() => {
    if (!career) return [];
    return career.calendar.filter((d) => (d.monthIndex ?? 0) === activeMonth);
  }, [career, activeMonth]);

  const weeklyDays = useMemo(() => {
    if (!career) return [];
    const start = Math.max(0, career.currentDayIndex - 1);
    return career.calendar.slice(start, start + 7);
  }, [career]);

  const upcomingMatches = useMemo(() => {
    if (!career) return [];
    return career.calendar
      .filter(
        (d, idx) =>
          idx >= Math.max(0, career.currentDayIndex - 2) &&
          (d.activity === 'PARTIDA' || d.isSupercopa || d.copaStage)
      )
      .slice(0, 14);
  }, [career]);

  const inspectedDay =
    career?.calendar.find((d) => d.dayIndex === selectedDayIdx) || currentDay;

  if (!career) {
    return (
      <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden">
        {onBack && (
          <header className="px-4 py-2.5 border-b border-slate-800 bg-[#0D1624] flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                onBack();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
            >
              <ArrowLeft size={15} />
              Menu
            </button>
            <h1 className="font-display font-bold text-base text-white">
              Calendário da Temporada
            </h1>
          </header>
        )}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111B2B] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <PixelCalendarIcon size={40} className="mx-auto" />
            <h2 className="font-display font-bold text-xl text-white">
              Calendário Disponível na Carreira
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inicie uma Carreira de Jogador para gerar sua agenda completa com Supercopa do Brasil, 38 rodadas do Brasileirão, Copa do Brasil e treinos.
            </p>
            {onStartNewCareer && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  onStartNewCareer();
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus size={16} />
                Iniciar Carreira Agora
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const userClub = getClubById(career.clubId);
  const activeDivision = career.division || 'Série A';
  const activeSchedule =
    activeDivision === 'Série B' && career.serieBSchedule?.length
      ? career.serieBSchedule
      : career.schedule;
  const canLaunchCurrentMatch =
    currentDay?.activity === 'PARTIDA' &&
    !currentDay.completed &&
    Boolean(onPlayMatch || onSimulateMatch);

  const canTriggerTodayEvent =
    Boolean(currentDay) &&
    !currentDay!.completed &&
    !currentDay!.narrativeEventId &&
    Boolean(onTriggerNarrativeEvent) &&
    ['COMPROMISSO', 'ESPECIAL', 'TREINO', 'VIAGEM'].includes(currentDay!.activity);

  const resolveMatchTeamsForDay = (day: CalendarDay) => {
    const fxMatch = activeSchedule.find(
      (f) =>
        f.round === (day.roundRef || career.round) &&
        (f.homeClubId === career.clubId || f.awayClubId === career.clubId)
    );
    let homeId = career.clubId;
    let awayId = day.opponentClubId || fxMatch?.awayClubId || career.clubId;
    if (day.opponentClubId) {
      homeId = day.isHome ? career.clubId : day.opponentClubId;
      awayId = day.isHome ? day.opponentClubId : career.clubId;
    } else if (fxMatch) {
      homeId = fxMatch.homeClubId;
      awayId = fxMatch.awayClubId;
    }
    return {
      homeId,
      awayId,
      competition: day.competition || `Brasileirão ${activeDivision}`,
      matchId: day.matchId,
    };
  };

  const launchMatchForDay = (day: CalendarDay) => {
    if (!onPlayMatch) return;
    const fx = resolveMatchTeamsForDay(day);
    soundEngine.play('whistle');
    onPlayMatch(fx.homeId, fx.awayId, fx.competition, fx.matchId);
  };

  const simulateMatchForDay = (day: CalendarDay) => {
    if (!onSimulateMatch) return;
    const fx = resolveMatchTeamsForDay(day);
    soundEngine.play('menu');
    onSimulateMatch(fx.homeId, fx.awayId, fx.competition, fx.matchId);
  };

  const inspectedOpp = inspectedDay?.opponentClubId
    ? getClubById(inspectedDay.opponentClubId)
    : null;

  return (
    <div
      className={`w-full ${
        onBack ? 'h-[100dvh]' : 'h-full'
      } bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden animate-fadeIn`}
    >
      {onBack && (
        <header className="px-4 py-2.5 border-b border-slate-800 bg-[#0D1624] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                onBack();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
            >
              <ArrowLeft size={15} />
              Menu
            </button>
            <div>
              <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
                Calendário Oficial · Temporada {career.season}
              </h1>
              <p className="text-[11px] text-slate-400">
                {userClub.name} · Hoje: {currentDay?.weekday} {currentDay?.dateLabel} ({currentDay?.title})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {(
              [
                { id: 'MENSAL', label: 'Mensal' },
                { id: 'SEMANAL', label: 'Semana' },
                { id: 'LISTA', label: 'Compromissos' },
              ] as { id: CalendarMode; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setMode(m.id);
                }}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                  mode === m.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </header>
      )}

      <div className="flex-1 overflow-y-auto custom-scroll p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Today Action & Mode Switcher Bar */}
          <section className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                <PixelCalendarIcon size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase text-emerald-400 font-mono-num">
                  Hoje · {currentDay?.weekday} {currentDay?.dateLabel} · Rodada {career.round}/38
                </div>
                <h2 className="font-display font-bold text-base sm:text-lg text-white truncate">
                  {currentDay?.title || 'Temporada em Andamento'}
                </h2>
                <p className="text-xs text-slate-400 truncate">{currentDay?.note}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!onBack && (
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 mr-1">
                  {(
                    [
                      { id: 'MENSAL', label: 'Mensal', icon: CalendarIcon },
                      { id: 'SEMANAL', label: 'Semana', icon: FastForward },
                      { id: 'LISTA', label: 'Lista', icon: List },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        setMode(m.id);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        mode === m.id
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              {canLaunchCurrentMatch && currentDay ? (
                <>
                  {onPlayMatch && (
                    <button
                      type="button"
                      onClick={() => launchMatchForDay(currentDay)}
                      className="min-h-[42px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Play size={15} fill="currentColor" />
                      Ir para o Estádio
                    </button>
                  )}
                  {onSimulateMatch && (
                    <button
                      type="button"
                      onClick={() => simulateMatchForDay(currentDay)}
                      className="min-h-[42px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FastForward size={14} />
                      Simular Partida
                    </button>
                  )}
                </>
              ) : (
                <>
                  {canTriggerTodayEvent && currentDay && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        onTriggerNarrativeEvent?.(currentDay);
                      }}
                      className="min-h-[42px] px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      Participar do Evento
                    </button>
                  )}
                  {onAdvanceDay && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        onAdvanceDay();
                        const nextIdx = Math.min(career.calendar.length - 1, career.currentDayIndex + 1);
                        setSelectedDayIdx(nextIdx);
                        if (career.calendar[nextIdx]) {
                          setSelectedMonth(career.calendar[nextIdx].monthIndex ?? activeMonth);
                        }
                      }}
                      className="min-h-[42px] px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FastForward size={14} />
                      Avançar Dia
                    </button>
                  )}
                  {onAdvanceToNextMatch && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        onAdvanceToNextMatch();
                      }}
                      className="min-h-[42px] px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <SkipForward size={14} />
                      Ir até Próximo Jogo
                    </button>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Competition Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Brasileirão {activeDivision}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> Copa do Brasil
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Supercopa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" /> Treinos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-400 inline-block" /> Descanso & Recuperação
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left/Main Calendar Display */}
            <div className="lg:col-span-8 space-y-3">
              {mode === 'MENSAL' && (
                <div className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {availableMonths.map((mIdx) => (
                      <button
                        key={mIdx}
                        type="button"
                        onClick={() => {
                          soundEngine.play('menu');
                          setSelectedMonth(mIdx);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          activeMonth === mIdx
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {MONTH_NAMES[mIdx]?.slice(0, 3) || `M${mIdx + 1}`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm text-white">
                      {MONTH_NAMES[activeMonth]} {career.season}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono-num">
                      {monthDays.length} compromissos no mês
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {monthDays.map((day) => {
                      const style = getDayStyle(day);
                      const isToday = day.dayIndex === career.currentDayIndex;
                      const isSelected = day.dayIndex === selectedDayIdx;
                      return (
                        <button
                          key={day.dayIndex}
                          type="button"
                          onClick={() => {
                            soundEngine.play('menu');
                            setSelectedDayIdx(day.dayIndex);
                          }}
                          className={`text-left p-2.5 rounded-xl border transition-colors cursor-pointer relative ${
                            isSelected
                              ? 'ring-2 ring-emerald-400 ' + style.card
                              : style.card
                          } ${day.completed ? 'opacity-65' : ''}`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono-num">
                            <span className="font-bold text-white">
                              {day.dateLabel} · {day.weekday}
                            </span>
                            {isToday ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold text-[9px]">
                                HOJE
                              </span>
                            ) : day.completed ? (
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            ) : null}
                          </div>
                          <div className={`text-[10px] font-bold uppercase mt-1 ${style.badge}`}>
                            {style.tag}
                          </div>
                          <div className="font-display font-bold text-xs text-white truncate mt-0.5">
                            {day.title}
                          </div>
                          {day.resultText && (
                            <div className="text-[10px] font-mono-num text-emerald-300 mt-1 truncate">
                              {day.resultText}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === 'SEMANAL' && (
                <div className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h3 className="font-display font-bold text-sm text-white">
                    Planejamento da Semana Atual
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {weeklyDays.map((day) => {
                      const style = getDayStyle(day);
                      const isToday = day.dayIndex === career.currentDayIndex;
                      return (
                        <button
                          key={day.dayIndex}
                          type="button"
                          onClick={() => {
                            soundEngine.play('menu');
                            setSelectedDayIdx(day.dayIndex);
                          }}
                          className={`text-left p-3.5 rounded-xl border cursor-pointer ${style.card} ${
                            isToday ? 'ring-2 ring-emerald-400' : ''
                          } ${day.completed ? 'opacity-65' : ''}`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono-num">
                            <span className="font-bold text-white">
                              {day.weekday} · {day.dateLabel}
                            </span>
                            <span className={`text-[10px] font-bold uppercase ${style.badge}`}>
                              {isToday ? 'HOJE · ' : ''}
                              {style.tag}
                            </span>
                          </div>
                          <div className="font-display font-bold text-sm text-white mt-1">
                            {day.title}
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5">{day.note}</div>
                          {day.resultText && (
                            <div className="text-xs font-mono-num font-bold text-emerald-300 mt-1.5">
                              Placar: {day.resultText}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === 'LISTA' && (
                <div className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <h3 className="font-display font-bold text-sm text-white">
                    Próximos Jogos & Datas Decisivas
                  </h3>
                  <div className="space-y-2">
                    {upcomingMatches.map((day) => {
                      const style = getDayStyle(day);
                      const opp = day.opponentClubId ? getClubById(day.opponentClubId) : null;
                      const isToday = day.dayIndex === career.currentDayIndex;
                      return (
                        <button
                          key={day.dayIndex}
                          type="button"
                          onClick={() => {
                            soundEngine.play('menu');
                            setSelectedDayIdx(day.dayIndex);
                          }}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer ${style.card} ${
                            isToday ? 'ring-2 ring-emerald-400' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-center font-mono-num shrink-0 w-12">
                              <div className="text-xs font-bold text-white">{day.dateLabel}</div>
                              <div className="text-[10px] text-slate-400">{day.weekday}</div>
                            </div>
                            {opp && <ClubCrest club={opp} size={28} className="shrink-0" />}
                            <div className="min-w-0">
                              <div className={`text-[10px] font-bold uppercase ${style.badge}`}>
                                {day.competition || style.tag}
                                {day.kickoffTime ? ` · ${day.kickoffTime}` : ''}
                              </div>
                              <div className="font-display font-bold text-sm text-white truncate">
                                {day.title}
                              </div>
                            </div>
                          </div>
                          {day.resultText ? (
                            <span className="font-mono-num text-xs font-bold text-emerald-300 shrink-0">
                              {day.resultText}
                            </span>
                          ) : isToday ? (
                            <span className="px-2 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] shrink-0">
                              HOJE
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {day.isHome === true ? 'Casa' : day.isHome === false ? 'Fora' : 'Evento'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Selected Day Details Panel */}
            <aside className="lg:col-span-4 bg-[#111B2B] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Detalhes da Data Selecionada
              </div>
              {inspectedDay ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <div className="font-mono-num text-sm font-bold text-emerald-400">
                        {inspectedDay.weekday} · {inspectedDay.dateLabel}/{career.season}
                      </div>
                      <div className="font-display font-bold text-base text-white mt-0.5">
                        {inspectedDay.title}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {inspectedDay.completed
                        ? 'Concluído'
                        : inspectedDay.dayIndex === career.currentDayIndex
                        ? 'Hoje'
                        : 'Agendado'}
                    </span>
                  </div>

                  {inspectedOpp && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-around gap-2">
                      <div className="flex flex-col items-center text-center">
                        <ClubCrest club={inspectedDay.isHome ? userClub : inspectedOpp} size={40} />
                        <span className="text-xs font-bold text-white mt-1">
                          {(inspectedDay.isHome ? userClub : inspectedOpp).shortName}
                        </span>
                      </div>
                      <span className="font-display font-extrabold text-sm text-emerald-400">VS</span>
                      <div className="flex flex-col items-center text-center">
                        <ClubCrest club={inspectedDay.isHome ? inspectedOpp : userClub} size={40} />
                        <span className="text-xs font-bold text-white mt-1">
                          {(inspectedDay.isHome ? inspectedOpp : userClub).shortName}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-300 space-y-1.5">
                    {inspectedDay.competition && (
                      <div>
                        <span className="text-slate-400">Competição:</span>{' '}
                        <strong className="text-white">{inspectedDay.competition}</strong>
                      </div>
                    )}
                    {inspectedDay.kickoffTime && (
                      <div>
                        <span className="text-slate-400">Horário:</span>{' '}
                        <strong className="text-white font-mono-num">{inspectedDay.kickoffTime}</strong>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Resumo:</span> {inspectedDay.note}
                    </div>
                    {inspectedDay.resultText && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 font-mono-num text-xs font-bold text-emerald-300">
                        Resultado Oficial: {inspectedDay.resultText}
                      </div>
                    )}
                  </div>

                  {inspectedDay.dayIndex === career.currentDayIndex &&
                    inspectedDay.activity === 'PARTIDA' &&
                    !inspectedDay.completed && (
                      <div className="space-y-2">
                        {onPlayMatch && (
                          <button
                            type="button"
                            onClick={() => launchMatchForDay(inspectedDay)}
                            className="w-full min-h-[44px] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Play size={15} fill="currentColor" />
                            Entrar em Campo Hoje
                          </button>
                        )}
                        {onSimulateMatch && (
                          <button
                            type="button"
                            onClick={() => simulateMatchForDay(inspectedDay)}
                            className="w-full min-h-[42px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-display font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <FastForward size={14} />
                            Simular Partida
                          </button>
                        )}
                      </div>
                    )}
                </>
              ) : (
                <p className="text-xs text-slate-400">Selecione um dia no calendário para ver os detalhes.</p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
