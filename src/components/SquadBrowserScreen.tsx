import React, { useMemo, useState } from 'react';
import { ArrowLeft, Shield, Users } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CLUBS, SERIE_B_CLUBS, getAllClubs, getClubById } from '../data/clubs';
import { getPositionMeta } from '../data/positions';
import { Club, ClubSquadMember, FormationId, PlayerCareer, PositionId } from '../types/game';
import { ClubCrest } from './ClubCrest';
import { PixelPortrait } from './PixelPortrait';

interface SquadBrowserScreenProps {
  career: PlayerCareer | null;
  club?: Club;
  embedded?: boolean;
  onBack?: () => void;
  onStartNewCareer?: () => void;
}

interface PitchCoord {
  xPct: number;
  yPct: number;
}

const FORMATION_COORDS: Record<FormationId, PitchCoord[]> = {
  '4-3-3': [
    { xPct: 50, yPct: 90 }, // GK
    { xPct: 84, yPct: 71 }, // RB
    { xPct: 62, yPct: 74 }, // CB1
    { xPct: 38, yPct: 74 }, // CB2
    { xPct: 16, yPct: 71 }, // LB
    { xPct: 50, yPct: 56 }, // CDM
    { xPct: 68, yPct: 45 }, // CM
    { xPct: 32, yPct: 42 }, // CAM
    { xPct: 80, yPct: 24 }, // RW
    { xPct: 50, yPct: 16 }, // ST
    { xPct: 20, yPct: 24 }, // LW
  ],
  '4-4-2': [
    { xPct: 50, yPct: 90 },
    { xPct: 84, yPct: 71 },
    { xPct: 62, yPct: 74 },
    { xPct: 38, yPct: 74 },
    { xPct: 16, yPct: 71 },
    { xPct: 54, yPct: 54 },
    { xPct: 78, yPct: 46 },
    { xPct: 22, yPct: 46 },
    { xPct: 46, yPct: 38 },
    { xPct: 62, yPct: 18 },
    { xPct: 38, yPct: 18 },
  ],
  '3-5-2': [
    { xPct: 50, yPct: 90 },
    { xPct: 74, yPct: 73 },
    { xPct: 50, yPct: 75 },
    { xPct: 26, yPct: 73 },
    { xPct: 14, yPct: 50 },
    { xPct: 86, yPct: 50 },
    { xPct: 62, yPct: 53 },
    { xPct: 38, yPct: 53 },
    { xPct: 50, yPct: 37 },
    { xPct: 62, yPct: 17 },
    { xPct: 38, yPct: 17 },
  ],
  '4-2-3-1': [
    { xPct: 50, yPct: 90 },
    { xPct: 84, yPct: 72 },
    { xPct: 62, yPct: 75 },
    { xPct: 38, yPct: 75 },
    { xPct: 16, yPct: 72 },
    { xPct: 62, yPct: 56 },
    { xPct: 38, yPct: 56 },
    { xPct: 50, yPct: 37 },
    { xPct: 78, yPct: 33 },
    { xPct: 50, yPct: 15 },
    { xPct: 22, yPct: 33 },
  ],
};

interface DisplaySlot {
  id: string;
  name: string;
  number: number;
  position: PositionId;
  ovr: number;
  potential?: number;
  age?: number;
  nationality?: string;
  preferredFoot?: string;
  traits?: string[];
  skinColor: string;
  hairColor: string;
  hairStyle: ClubSquadMember['hairStyle'];
  beard?: boolean;
  isUser: boolean;
  roleTag: string;
}

export const SquadBrowserScreen: React.FC<SquadBrowserScreenProps> = ({
  career,
  club: fixedClub,
  embedded = false,
  onBack,
  onStartNewCareer,
}) => {
  const defaultClub = fixedClub || (career ? getClubById(career.clubId) : CLUBS[0]);
  const [selectedClubId, setSelectedClubId] = useState<string>(defaultClub.id);
  const [divFilter, setDivFilter] = useState<'TODAS' | 'Série A' | 'Série B'>('TODAS');

  const activeClub = fixedClub || getClubById(selectedClubId);
  const isUserClub = Boolean(career && activeClub.id === career.clubId);

  const clubList = useMemo(() => {
    if (divFilter === 'Série A') return CLUBS;
    if (divFilter === 'Série B') return SERIE_B_CLUBS;
    return getAllClubs();
  }, [divFilter]);

  const { starters, reserves, userIncludedAs } = useMemo(() => {
    const baseStarters = activeClub.squad.slice(0, 11);
    const baseReserves = activeClub.squad.slice(11, 16);

    const toSlot = (m: ClubSquadMember, roleTag: string): DisplaySlot => ({
      id: m.id,
      name: m.name,
      number: m.number,
      position: m.position,
      ovr: m.ovr,
      potential: m.potential,
      age: m.age,
      nationality: m.nationality,
      preferredFoot: m.preferredFoot,
      traits: m.traits,
      skinColor: m.skinColor,
      hairColor: m.hairColor,
      hairStyle: m.hairStyle,
      beard: m.beard !== undefined && m.beard !== 'Nenhuma',
      isUser: false,
      roleTag,
    });

    const mappedStarters = baseStarters.map((m) => toSlot(m, 'Titular'));
    const mappedReserves = baseReserves.map((m) => toSlot(m, 'Reserva'));
    let status: 'Titular' | 'Reserva' | 'Fora' = 'Fora';

    if (isUserClub && career) {
      const userSlot: DisplaySlot = {
        id: 'user_player',
        name: career.personal.nickname || `${career.personal.firstName} ${career.personal.lastName}`,
        number: career.gear.jerseyNumber,
        position: career.position,
        ovr: career.ovr,
        potential: career.potential,
        nationality: career.personal.nationality,
        preferredFoot: career.gear.dominantFoot,
        traits: career.traits,
        skinColor: career.appearance.skinColor,
        hairColor: career.appearance.hairColor,
        hairStyle: career.appearance.hairStyle,
        beard: career.appearance.beardStyle !== 'Nenhuma',
        isUser: true,
        roleTag: career.contract.role,
      };

      const isStarter =
        career.contract.role === 'Estrela' ||
        career.contract.role === 'Titular' ||
        career.coachTrust >= 58 ||
        career.ovr >= activeClub.squadQuality - 3;

      if (isStarter) {
        const userGroup = getPositionMeta(career.position).group;
        let idx = mappedStarters.findIndex((m) => m.position === career.position);
        if (idx < 0) idx = mappedStarters.findIndex((m) => getPositionMeta(m.position).group === userGroup);
        if (idx < 0) idx = 10;
        mappedStarters[idx] = userSlot;
        status = 'Titular';
      } else {
        mappedReserves[mappedReserves.length - 1] = userSlot;
        status = 'Reserva';
      }
    }

    return { starters: mappedStarters, reserves: mappedReserves, userIncludedAs: status };
  }, [activeClub, career, isUserClub]);

  const coords = FORMATION_COORDS[activeClub.formation] || FORMATION_COORDS['4-3-3'];
  const avgStarterOvr = Math.round(
    starters.reduce((acc, s) => acc + s.ovr, 0) / Math.max(1, starters.length)
  );

  return (
    <div
      className={`w-full ${
        embedded ? 'h-full' : 'h-[100dvh]'
      } bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden animate-fadeIn`}
    >
      {!embedded && (
        <header className="px-4 py-2.5 border-b border-slate-800 bg-[#0D1624] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  onBack();
                }}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
              >
                <ArrowLeft size={15} />
                Menu
              </button>
            )}
            <div>
              <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
                Elenco & Escalação Tática
              </h1>
              <p className="text-[11px] text-slate-400">
                Visualização do elenco, titulares, reservas e seu status na equipe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!fixedClub && (
              <>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(['TODAS', 'Série A', 'Série B'] as const).map((div) => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        setDivFilter(div);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        divFilter === div ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>

                <select
                  value={activeClub.id}
                  onChange={(e) => {
                    soundEngine.play('menu');
                    setSelectedClubId(e.target.value);
                  }}
                  aria-label="Selecionar clube para ver elenco"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white max-w-[190px]"
                >
                  {clubList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.division})
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto custom-scroll p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Club Summary & Player Status Strip */}
          <section className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ClubCrest club={activeClub} size={46} className="shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase text-emerald-400 font-mono-num">
                  {activeClub.division} · Formação {activeClub.formation}
                </div>
                <h2 className="font-display font-extrabold text-lg text-white truncate">
                  {activeClub.name}
                </h2>
                <p className="text-xs text-slate-400 truncate">
                  Técnico: {activeClub.coachName} · Média Titulares: {avgStarterOvr} OVR
                </p>
              </div>
            </div>

            {isUserClub && career ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono-num">Seu Status</div>
                  <div className="font-display font-bold text-sm text-emerald-400">
                    {career.contract.role} ({userIncludedAs})
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono-num">Entrosamento</div>
                  <div className="font-mono-num font-bold text-sm text-sky-400">
                    {career.teamChemistry ?? 70}%
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono-num">Confiança Técnico</div>
                  <div className="font-mono-num font-bold text-sm text-amber-300">
                    {career.coachTrust}%
                  </div>
                </div>
              </div>
            ) : (
              !career &&
              onStartNewCareer && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.play('menu');
                    onStartNewCareer();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs cursor-pointer"
                >
                  Criar Meu Jogador
                </button>
              )
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Tactical Pitch Visualization (Read-only player career view) */}
            <section className="lg:col-span-5 bg-[#111B2B] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <Shield size={15} className="text-emerald-400" />
                  Escalação Tática ({activeClub.formation})
                </h3>
                <span className="text-[11px] font-mono-num text-slate-400">11 Titulares</span>
              </div>

              <div
                className="relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-emerald-700/50 bg-[#124829] select-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 10%, transparent 10% 20%)',
                }}
              >
                {/* Pitch markings */}
                <div className="absolute inset-3 border border-white/30 pointer-events-none" />
                <div className="absolute left-3 right-3 top-1/2 h-px bg-white/30 pointer-events-none" />
                <div className="absolute left-1/2 top-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 pointer-events-none" />
                <div className="absolute left-1/2 top-3 w-36 h-14 -translate-x-1/2 border-x border-b border-white/30 pointer-events-none" />
                <div className="absolute left-1/2 bottom-3 w-36 h-14 -translate-x-1/2 border-x border-t border-white/30 pointer-events-none" />

                {starters.map((player, idx) => {
                  const pt = coords[idx] || { xPct: 50, yPct: 50 };
                  const posCode = getPositionMeta(player.position).code;
                  const shortLabel = player.name.split(' ')[0];
                  return (
                    <div
                      key={`${player.id}_${idx}`}
                      style={{ left: `${pt.xPct}%`, top: `${pt.yPct}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center pointer-events-none"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono-num text-xs font-extrabold border-2 shadow-md ${
                          player.isUser
                            ? 'bg-emerald-400 text-slate-950 border-white ring-2 ring-amber-400'
                            : idx === 0
                            ? 'bg-amber-400 text-slate-950 border-slate-900'
                            : 'bg-slate-900 text-white border-emerald-400/80'
                        }`}
                      >
                        {player.number}
                      </div>
                      <div
                        className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold leading-none whitespace-nowrap ${
                          player.isUser
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-950/85 text-slate-100'
                        }`}
                      >
                        {shortLabel} · {posCode}
                      </div>
                      <div className="text-[9px] font-mono-num font-bold text-amber-300 leading-tight drop-shadow">
                        {player.ovr}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                A escalação é definida pelo técnico {activeClub.coachName}. Melhore sua confiança nos treinos e jogos para garantir a titularidade.
              </p>
            </section>

            {/* Right: Complete 16-Player Roster */}
            <section className="lg:col-span-7 space-y-4">
              <div className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                    <Users size={15} className="text-emerald-400" />
                    Titulares ({starters.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">11 iniciais do elenco</span>
                </div>
                <div className="space-y-1.5">
                  {starters.map((m, idx) => (
                    <SquadMemberRow
                      key={`${m.id}_${idx}`}
                      member={m}
                      shirtPrimary={idx === 0 ? activeClub.kit.gkPrimary : activeClub.kit.primary}
                      shirtSecondary={activeClub.kit.secondary}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-white">
                    Banco de Reservas ({reserves.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">Opções imediatas de banco</span>
                </div>
                <div className="space-y-1.5">
                  {reserves.map((m, idx) => (
                    <SquadMemberRow
                      key={`${m.id}_res_${idx}`}
                      member={m}
                      shirtPrimary={m.position.startsWith('GK') ? activeClub.kit.gkPrimary : activeClub.kit.primary}
                      shirtSecondary={activeClub.kit.secondary}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

function SquadMemberRow({
  member,
  shirtPrimary,
  shirtSecondary,
}: {
  member: DisplaySlot;
  shirtPrimary: string;
  shirtSecondary: string;
}) {
  const posMeta = getPositionMeta(member.position);
  return (
    <div
      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
        member.isUser
          ? 'bg-emerald-500/15 border-emerald-500'
          : 'bg-slate-900/75 border-slate-800'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="font-mono-num text-xs font-bold text-slate-400 w-6 text-center shrink-0">
          #{member.number}
        </span>
        <PixelPortrait
          skinColor={member.skinColor}
          hairColor={member.hairColor}
          hairStyle={member.hairStyle}
          shirtPrimary={shirtPrimary}
          shirtSecondary={shirtSecondary}
          beard={member.beard}
          size={34}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-xs sm:text-sm text-white truncate">
              {member.name}
            </span>
            {member.isUser && (
              <span className="text-[10px] font-bold uppercase text-emerald-400 shrink-0">
                (Você)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {posMeta.code} · {posMeta.name}
            {member.age ? ` · ${member.age}a` : ''}
            {member.nationality ? ` · ${member.nationality}` : ''}
            {member.preferredFoot ? ` · Pé ${member.preferredFoot}` : ''}
          </div>
          {member.traits && member.traits.length > 0 && (
            <div className="text-[10px] text-amber-300/90 truncate mt-0.5">
              {member.traits.slice(0, 2).join(' · ')}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 font-mono-num text-right">
        {member.potential && (
          <div className="hidden sm:block">
            <div className="text-[9px] text-slate-500 uppercase">Pot</div>
            <div className="text-xs font-bold text-sky-400">{member.potential}</div>
          </div>
        )}
        <div>
          <div className="text-[9px] text-slate-500 uppercase">OVR</div>
          <div className="text-sm font-extrabold text-emerald-400">{member.ovr}</div>
        </div>
      </div>
    </div>
  );
}
