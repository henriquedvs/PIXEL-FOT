import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MapPin, Shield, Users } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CLUBS, SERIE_B_CLUBS } from '../data/clubs';
import { getPositionMeta } from '../data/positions';
import { drawPixelPlayerSprite } from '../engine/pixelRenderer';
import { Club } from '../types/game';
import { ClubCrest } from './ClubCrest';
import { PixelBackdrop } from './PixelBackdrop';
import { PixelPortrait } from './PixelPortrait';

interface ClubsBrowserScreenProps {
  onBack: () => void;
}

export const ClubsBrowserScreen: React.FC<ClubsBrowserScreenProps> = ({ onBack }) => {
  const [division, setDivision] = useState<'SERIE_A' | 'SERIE_B'>('SERIE_A');
  const pool = division === 'SERIE_A' ? CLUBS : SERIE_B_CLUBS;
  const [selectedId, setSelectedId] = useState(CLUBS[0].id);
  const [kitSlot, setKitSlot] = useState<'home' | 'away' | 'third'>('home');
  const [search, setSearch] = useState('');
  const kitCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const visibleClubs = pool.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase())
  );

  const club: Club = pool.find((c) => c.id === selectedId) || pool[0];
  const activeKit =
    kitSlot === 'away' && club.awayKit
      ? club.awayKit
      : kitSlot === 'third' && club.thirdKit
      ? club.thirdKit
      : club.kit;

  useEffect(() => {
    const canvas = kitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
    const render = () => {
      phase += 0.055;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#07111B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#14532D';
      ctx.fillRect(14, canvas.height - 30, canvas.width - 28, 16);
      ctx.fillStyle = '#1E7A42';
      ctx.fillRect(20, canvas.height - 26, canvas.width - 40, 8);

      drawPixelPlayerSprite(
        ctx,
        canvas.width / 2,
        canvas.height / 2 + 16 + Math.sin(phase) * 0.9,
        6.2,
        {
          appearance: {
            skinColor: club.squad[9]?.skinColor || '#D19A6E',
            hairStyle: club.squad[9]?.hairStyle || 'Topete',
            hairColor: club.squad[9]?.hairColor || '#18181B',
            faceStyle: 'Confiante',
            eyeStyle: 'Padrão',
            eyebrowStyle: 'Grossa',
            beardStyle: club.squad[9]?.beard || 'Nenhuma',
            mustacheStyle: 'Nenhum',
            bodyType: 'Atlético',
            visualHeightScale: 1,
          },
          gear: {
            jerseyNumber: club.squad[9]?.number || 9,
            shirtName: club.shortName,
            collarStyle: 'Redonda',
            dominantFoot: 'Direito',
            bootModel: 'Velocidade',
            bootColor: '#FACC15',
            sleeveLength: 'Curta',
            sockType: 'Alta',
            accessory: 'Nenhum',
          },
          kit: activeKit,
          isGoalkeeper: false,
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
  }, [club, activeKit]);

  return (
    <div className="px-shell animate-fadeIn">
      <PixelBackdrop homeKit={club.kit} awayKit={club.awayKit} dimOpacity={0.86} />

      <header className="relative z-10 px-header px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="px-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase cursor-pointer"
          >
            <ArrowLeft size={15} />
            Menu
          </button>
          <div className="px-flag-stripe-br shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight uppercase truncate">
              Clubes do Futebol Brasileiro (40 Equipes)
            </h1>
            <p className="text-[11px] font-mono-num text-slate-400 truncate">
              Série A (20) e Série B (20) com escudos em Pixel Art, uniformes e elencos completos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#081018] p-1 rounded-[2px] border border-[#22384C]">
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                setDivision('SERIE_A');
                setSelectedId(CLUBS[0].id);
                setKitSlot('home');
              }}
              className={`px-3 py-1 rounded-[2px] text-xs font-display font-bold uppercase cursor-pointer ${
                division === 'SERIE_A' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Série A (20)
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                setDivision('SERIE_B');
                setSelectedId(SERIE_B_CLUBS[0].id);
                setKitSlot('home');
              }}
              className={`px-3 py-1 rounded-[2px] text-xs font-display font-bold uppercase cursor-pointer ${
                division === 'SERIE_B' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Série B (20)
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clube, cidade..."
            className="hidden md:block w-48 px-3 py-1.5 rounded-[2px] bg-[#081018] border border-[#22384C] text-xs text-white focus:border-emerald-500 outline-none"
          />
        </div>
      </header>

      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Left List */}
        <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#1E3346] overflow-y-auto custom-scroll p-3 space-y-1.5 bg-[#071019]/80">
          {visibleClubs.map((c) => {
            const active = c.id === club.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setSelectedId(c.id);
                  setKitSlot('home');
                }}
                className={`w-full text-left p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  active ? 'px-panel-active' : 'px-panel-soft hover:border-[#4b7496]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ClubCrest club={c} size={36} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm text-white uppercase truncate">
                      {c.name}
                    </div>
                    <div className="text-[11px] font-mono-num text-slate-400 truncate">
                      {c.city}/{c.state} · {c.stadiumName}
                    </div>
                  </div>
                </div>
                <div className="font-mono-num text-xs font-bold text-emerald-400 shrink-0">
                  OVR {c.squadQuality}
                </div>
              </button>
            );
          })}
        </aside>

        {/* Right Details */}
        <section className="md:col-span-8 overflow-y-auto custom-scroll p-4 space-y-4">
          <div className="px-panel p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-8 flex items-start gap-4">
              <ClubCrest club={club} size={68} className="shrink-0" />
              <div className="min-w-0 space-y-1">
                <div className="text-xs font-mono-num font-bold uppercase text-emerald-400">
                  {club.division} · Fundado em {club.foundedYear} · Formação {club.formation}
                </div>
                <h2 className="font-display text-2xl font-extrabold text-white uppercase truncate">
                  {club.name}
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin size={13} className="text-emerald-400 shrink-0" />
                  {club.city}/{club.state} · Técnico: {club.coachName} · Mascote: {club.mascotName}
                </div>
                <p className="text-xs text-slate-300 pt-1 leading-relaxed">{club.history}</p>
              </div>
            </div>

            {/* Live Pixel Player in Kit 1 / 2 / 3 */}
            <div className="sm:col-span-4 px-panel-soft flex flex-col items-center gap-2 p-2.5">
              <canvas
                ref={kitCanvasRef}
                width={130}
                height={130}
                className="w-24 h-24 rounded-[2px] border border-[#243B4F] pixelated bg-[#07111B]"
              />
              <div className="flex gap-1">
                {(['home', 'away', 'third'] as const).map((slot, idx) => {
                  const hasSlot =
                    slot === 'home' ||
                    (slot === 'away' && Boolean(club.awayKit)) ||
                    (slot === 'third' && Boolean(club.thirdKit));
                  if (!hasSlot) return null;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        setKitSlot(slot);
                      }}
                      className={`px-2 py-1 rounded-[2px] text-[11px] font-display font-bold uppercase cursor-pointer ${
                        kitSlot === slot
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-[#081018] border border-[#22384C] text-slate-300 hover:border-[#4b7496]'
                      }`}
                    >
                      Kit {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <InfoBox label="Estádio Oficial" value={club.stadiumName} />
            <InfoBox label="Capacidade" value={club.stadiumCapacity.toLocaleString('pt-BR')} />
            <InfoBox label="Reputação" value={`${club.reputation} / 100`} />
            <InfoBox label="Finanças" value={club.finances} />
          </div>

          {/* Full 16-Player Squad */}
          <div className="px-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-white uppercase flex items-center gap-2">
                <Users size={16} className="text-emerald-400" />
                Elenco Completo ({club.squad.length} Jogadores)
              </h3>
              <span className="text-[11px] font-mono-num text-slate-400 flex items-center gap-1">
                <Shield size={13} className="text-emerald-400" /> 11 Titulares + 5 Reservas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {club.squad.map((m, idx) => {
                const posCode = getPositionMeta(m.position).code;
                return (
                  <div
                    key={m.id}
                    className="px-panel-soft flex items-center justify-between gap-2 p-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PixelPortrait
                        skinColor={m.skinColor}
                        hairColor={m.hairColor}
                        hairStyle={m.hairStyle}
                        shirtPrimary={idx === 0 || idx === 11 ? club.kit.gkPrimary : club.kit.primary}
                        shirtSecondary={club.kit.secondary}
                        size={30}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-display font-bold text-white truncate">
                          #{m.number} {m.name}
                        </div>
                        <div className="text-[10px] font-mono-num text-slate-400">
                          {posCode} · {m.age ?? 24}a · {idx < 11 ? 'Titular' : 'Reserva'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono-num text-xs font-extrabold text-emerald-400 shrink-0">
                      {m.ovr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-panel-soft p-2.5">
      <div className="text-[10px] font-mono-num uppercase text-slate-400">{label}</div>
      <div className="font-mono-num text-xs sm:text-sm font-bold text-white truncate mt-0.5">
        {value}
      </div>
    </div>
  );
}
