import React, { useState } from 'react';
import { Award, CheckCircle2, CloudRain, Shield, Users } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { getPositionMeta } from '../data/positions';
import { MatchSimReport, SimPlayerRating } from '../types/game';
import { ClubCrest } from './ClubCrest';

interface MatchReportModalProps {
  report: MatchSimReport;
  onClose: () => void;
}

type ReportTab = 'EVENTOS' | 'ESTATS' | 'NOTAS';

export const MatchReportModal: React.FC<MatchReportModalProps> = ({ report, onClose }) => {
  const [tab, setTab] = useState<ReportTab>('EVENTOS');
  const homeClub = getClubById(report.homeClubId);
  const awayClub = getClubById(report.awayClubId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="max-w-4xl w-full max-h-[92dvh] bg-[#0E1725] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header / Scoreboard */}
        <header className="px-5 py-4 border-b border-slate-800 bg-[#0A111C] space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num text-slate-400">
            <span className="font-bold text-emerald-400 uppercase">
              {report.competition} · Rodada {report.round}
            </span>
            <span className="flex items-center gap-2">
              <CloudRain size={13} className="text-sky-400" />
              {report.stadiumName} · {report.weather} · Público: {report.attendance.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="grid grid-cols-3 items-center gap-3 py-1">
            <div className="flex items-center justify-end gap-2.5 text-right min-w-0">
              <div className="min-w-0">
                <div className="font-display font-bold text-sm sm:text-base text-white truncate">
                  {homeClub.name}
                </div>
                <div className="text-[11px] text-slate-400">Mandante</div>
              </div>
              <ClubCrest club={homeClub} size={44} className="shrink-0" />
            </div>

            <div className="text-center font-mono-num">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-wider">
                {report.homeScore} x {report.awayScore}
              </div>
              {report.penHomeScore !== undefined &&
                report.penAwayScore !== undefined &&
                report.homeScore === report.awayScore && (
                  <div className="text-xs text-amber-300 font-bold">
                    Pênaltis: {report.penHomeScore} - {report.penAwayScore}
                  </div>
                )}
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <ClubCrest club={awayClub} size={44} className="shrink-0" />
              <div className="min-w-0">
                <div className="font-display font-bold text-sm sm:text-base text-white truncate">
                  {awayClub.name}
                </div>
                <div className="text-[11px] text-slate-400">Visitante</div>
              </div>
            </div>
          </div>

          {/* User performance strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <SummaryBox label="Sua Função" value={report.userRole} />
            <SummaryBox label="Minutagem" value={`${report.userMinutes} min`} />
            <SummaryBox
              label="Sua Nota"
              value={report.userMinutes > 0 ? report.userRating.toFixed(1) : 'Não atuou'}
              highlight
            />
            <SummaryBox label="Craque do Jogo" value={report.motmName} amber />
          </div>
        </header>

        {/* Internal Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-[#0D1522] flex items-center gap-1.5 shrink-0">
          {(
            [
              { id: 'EVENTOS', label: `Lance a Lance (${report.events.length})` },
              { id: 'ESTATS', label: 'Estatísticas da Partida' },
              { id: 'NOTAS', label: 'Notas dos Elencos' },
            ] as { id: ReportTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                setTab(t.id);
              }}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold cursor-pointer ${
                tab === t.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll p-5">
          {tab === 'EVENTOS' && (
            <div className="space-y-2">
              {report.events.length === 0 ? (
                <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 text-center text-xs text-slate-400">
                  Partida equilibrada sem gols ou advertências relevantes.
                </div>
              ) : (
                report.events.map((ev, idx) => {
                  const evClub = getClubById(ev.clubId);
                  const typeColor =
                    ev.type === 'GOL'
                      ? 'text-emerald-400'
                      : ev.type === 'AMARELO'
                      ? 'text-amber-400'
                      : ev.type === 'VERMELHO'
                      ? 'text-rose-400'
                      : ev.type === 'DEFESA'
                      ? 'text-sky-400'
                      : 'text-slate-300';
                  return (
                    <div
                      key={`${ev.minute}_${idx}`}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        ev.isUserPlayer
                          ? 'bg-emerald-500/15 border-emerald-500/60'
                          : 'bg-slate-900/75 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono-num font-extrabold text-emerald-400 w-9 shrink-0">
                          {ev.minute}&apos;
                        </span>
                        <ClubCrest club={evClub} size={22} className="shrink-0" />
                        <div className="min-w-0">
                          <span className={`font-bold uppercase text-[10px] mr-2 ${typeColor}`}>
                            {ev.type}
                          </span>
                          <span className="text-slate-100">{ev.detail}</span>
                        </div>
                      </div>
                      {ev.isUserPlayer && (
                        <span className="text-[10px] font-bold text-emerald-300 shrink-0">VOCÊ</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'ESTATS' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              <StatBarRow
                label="Posse de Bola (%)"
                homeVal={report.stats.possessionHome}
                awayVal={100 - report.stats.possessionHome}
                homeColor={homeClub.kit.primary}
                awayColor={awayClub.kit.primary}
              />
              <StatBarRow
                label="Finalizações Totais"
                homeVal={report.stats.shotsHome}
                awayVal={report.stats.shotsAway}
                homeColor={homeClub.kit.primary}
                awayColor={awayClub.kit.primary}
              />
              <StatBarRow
                label="Chutes no Gol"
                homeVal={report.stats.shotsOnTargetHome}
                awayVal={report.stats.shotsOnTargetAway}
                homeColor={homeClub.kit.primary}
                awayColor={awayClub.kit.primary}
              />
              <StatBarRow
                label="Escanteios"
                homeVal={report.stats.cornersHome}
                awayVal={report.stats.cornersAway}
                homeColor={homeClub.kit.primary}
                awayColor={awayClub.kit.primary}
              />
              <StatBarRow
                label="Faltas Cometidas"
                homeVal={report.stats.foulsHome}
                awayVal={report.stats.foulsAway}
                homeColor={homeClub.kit.primary}
                awayColor={awayClub.kit.primary}
              />
              <StatBarRow
                label="Defesas de Goleiro"
                homeVal={report.stats.savesHome}
                awayVal={report.stats.savesAway}
                homeColor={homeClub.kit.primary}
                awayColor={awayClub.kit.primary}
              />
            </div>
          )}

          {tab === 'NOTAS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RatingsList title={homeClub.name} ratings={report.homeRatings} />
              <RatingsList title={awayClub.name} ratings={report.awayRatings} />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-5 py-3.5 border-t border-slate-800 bg-[#0A111C] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Award size={15} className="text-amber-400" />
            <span>Súmula oficial registrada na carreira</span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onClose();
            }}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            Continuar Carreira
          </button>
        </footer>
      </div>
    </div>
  );
};

function SummaryBox({
  label,
  value,
  highlight = false,
  amber = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  amber?: boolean;
}) {
  return (
    <div className="px-3 py-2 rounded-xl bg-[#111B2B] border border-slate-800">
      <div className="text-[10px] text-slate-400 uppercase">{label}</div>
      <div
        className={`text-xs sm:text-sm font-bold truncate font-mono-num mt-0.5 ${
          amber ? 'text-amber-300' : highlight ? 'text-emerald-400' : 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function StatBarRow({
  label,
  homeVal,
  awayVal,
  homeColor,
  awayColor,
}: {
  label: string;
  homeVal: number;
  awayVal: number;
  homeColor: string;
  awayColor: string;
}) {
  const sum = Math.max(1, homeVal + awayVal);
  const homePct = Math.round((homeVal / sum) * 100);
  return (
    <div className="p-3 rounded-xl bg-slate-900/75 border border-slate-800 space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono-num">
        <span className="font-bold text-white">{homeVal}</span>
        <span className="text-slate-300 font-sans font-semibold">{label}</span>
        <span className="font-bold text-white">{awayVal}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
        <div style={{ width: `${homePct}%`, backgroundColor: homeColor }} />
        <div style={{ width: `${100 - homePct}%`, backgroundColor: awayColor }} />
      </div>
    </div>
  );
}

function RatingsList({ title, ratings }: { title: string; ratings: SimPlayerRating[] }) {
  return (
    <div className="bg-slate-900/65 border border-slate-800 rounded-xl p-3 space-y-1.5">
      <div className="font-display font-bold text-xs text-white flex items-center gap-1.5 pb-1 border-b border-slate-800">
        <Shield size={13} className="text-emerald-400" />
        {title}
      </div>
      {ratings.map((p) => (
        <div
          key={p.playerId}
          className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs ${
            p.isUser ? 'bg-emerald-500/15 border border-emerald-500/40' : 'bg-slate-950/60'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono-num text-[11px] text-slate-400 w-5">{p.number}</span>
            <span className="text-white truncate font-medium">
              {p.name}
              {p.isUser ? ' (Você)' : ''}
            </span>
            <span className="text-[10px] text-slate-500">{getPositionMeta(p.position).code}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 font-mono-num">
            {p.goals > 0 && <span className="text-[11px] text-emerald-400 font-bold">{p.goals}G</span>}
            {p.assists > 0 && <span className="text-[11px] text-sky-400 font-bold">{p.assists}A</span>}
            {p.yellowCard && <span className="w-2.5 h-3.5 bg-amber-400 rounded-[2px] inline-block" />}
            <span
              className={`font-bold px-1.5 py-0.5 rounded ${
                p.rating >= 7.5
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              {p.rating.toFixed(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
