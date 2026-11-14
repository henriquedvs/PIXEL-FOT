import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Building2, Lightbulb, MapPin, Users } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CLUBS, SERIE_B_CLUBS, getAllClubs } from '../data/clubs';
import { getStadiumForClub } from '../data/stadiums';
import { drawPixelStadium, generateCrowd, PITCH_GEO } from '../engine/pixelRenderer';
import { TimeOfDay } from '../types/game';
import { ClubCrest } from './ClubCrest';
import { PixelBackdrop } from './PixelBackdrop';

interface StadiumsBrowserScreenProps {
  onBack: () => void;
}

export const StadiumsBrowserScreen: React.FC<StadiumsBrowserScreenProps> = ({ onBack }) => {
  const allClubs = getAllClubs();
  const [selectedClubId, setSelectedClubId] = useState(CLUBS[0].id);
  const [divisionFilter, setDivisionFilter] = useState<'TODAS' | 'Série A' | 'Série B'>('TODAS');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('Noite');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const visibleList =
    divisionFilter === 'Série A'
      ? CLUBS
      : divisionFilter === 'Série B'
      ? SERIE_B_CLUBS
      : allClubs;
  const club = allClubs.find((c) => c.id === selectedClubId) || CLUBS[0];
  const stadium = getStadiumForClub(club);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const crowd = generateCrowd(club.kit.primary, club.kit.secondary, '#F8FAFC', 'high', {
      capacity: stadium.capacity,
      importance: 0.9,
    });

    let raf = 0;
    let t = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      t += dt;

      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#071019';
      ctx.fillRect(0, 0, w, h);

      const zoom = Math.max(w / 1480, h / 880);
      const camX = PITCH_GEO.worldW / 2 + Math.sin(t * 0.3) * 95;
      const camY = PITCH_GEO.worldH / 2 + Math.cos(t * 0.25) * 45;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-Math.round(camX), -Math.round(camY));

      drawPixelStadium(ctx, crowd, t, 0.45, 0, 0, 'high', {
        stadium,
        homeKit: club.kit,
        awayKit: club.awayKit || club.kit,
        homeShort: club.shortName,
        awayShort: 'VIS',
        homeScore: 0,
        awayScore: 0,
        matchMinuteStr: timeOfDay.toUpperCase(),
        mascot: club.mascot,
        crowdMood: 'excited',
        showMosaic: true,
        mosaicProgress: 1,
        env: {
          competitionName: 'Brasileirão Série A',
          roundLabel: 'Tour Arena',
          dateStr: '2026',
          kickoffTime: timeOfDay === 'Noite' ? '21:00' : timeOfDay === 'Fim de tarde' ? '18:30' : '16:00',
          timeOfDay,
          weather: 'Ensolarado',
          temperatureC: 24,
          stadium,
        },
        environmentalEffects: true,
        effectsIntensity: 0.9,
      });

      ctx.restore();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [club, stadium, timeOfDay]);

  const archLabel: Record<string, string> = {
    modern: 'Arena Moderna',
    grand: 'Arena Monumental',
    traditional: 'Estádio Clássico',
    compact: 'Caldeirão Compacto',
    municipal: 'Estádio Municipal',
    cauldron: 'Alçapão Urbano',
  };

  const lightLabel: Record<string, string> = {
    ring: 'Anel Contínuo de LED',
    towers: 'Torres de Refletores',
    poles: 'Postes Laterais',
  };

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
              Estádios do Brasil (40 Arenas em Pixel Art)
            </h1>
            <p className="text-[11px] font-mono-num text-slate-400 truncate">
              Arquibancadas, refletores, bandeirão e gramado exclusivo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#081018] p-1 rounded-[2px] border border-[#22384C]">
            {(['TODAS', 'Série A', 'Série B'] as const).map((div) => (
              <button
                key={div}
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setDivisionFilter(div);
                }}
                className={`px-2 py-1 rounded-[2px] text-[11px] font-display font-bold uppercase cursor-pointer ${
                  divisionFilter === div ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {div}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-[#081018] p-1 rounded-[2px] border border-[#22384C]">
            {(['Tarde', 'Fim de tarde', 'Noite'] as TimeOfDay[]).map((tod) => (
              <button
                key={tod}
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setTimeOfDay(tod);
                }}
                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-display font-bold uppercase cursor-pointer ${
                  timeOfDay === tod ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tod}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
        <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#1E3346] overflow-y-auto custom-scroll p-3 space-y-1.5 bg-[#071019]/80">
          {visibleList.map((c) => {
            const st = getStadiumForClub(c);
            const active = c.id === club.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setSelectedClubId(c.id);
                }}
                className={`w-full text-left p-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                  active ? 'px-panel-active' : 'px-panel-soft hover:border-[#4b7496]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ClubCrest club={c} size={32} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-xs sm:text-sm text-white uppercase truncate">
                      {st.name}
                    </div>
                    <div className="text-[11px] font-mono-num text-slate-400 truncate">
                      {st.city}/{st.state} · {c.shortName}
                    </div>
                  </div>
                </div>
                <span className="font-mono-num text-[11px] font-bold text-emerald-400 shrink-0">
                  {Math.round(st.capacity / 1000)}k
                </span>
              </button>
            );
          })}
        </aside>

        <section className="md:col-span-8 overflow-y-auto custom-scroll p-4 space-y-4">
          <div className="px-panel relative overflow-hidden">
            <canvas
              ref={canvasRef}
              width={900}
              height={420}
              className="w-full h-56 sm:h-72 object-cover pixelated"
            />
            <div className="px-panel-soft m-3 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <ClubCrest club={club} size={36} />
                <div>
                  <div className="font-display font-extrabold text-base text-white uppercase">
                    {stadium.name}
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin size={12} className="text-emerald-400" />
                    {stadium.city}, {stadium.state} · Casa do {club.name}
                  </div>
                </div>
              </div>
              <div className="font-mono-num text-sm font-bold text-emerald-400">
                {stadium.capacity.toLocaleString('pt-BR')} lugares
              </div>
            </div>
          </div>

          <p className="px-panel-soft text-xs sm:text-sm text-slate-300 p-3.5 leading-relaxed">
            {stadium.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <SpecCard icon={<Building2 size={15} className="text-emerald-400" />} label="Arquitetura" value={archLabel[stadium.architecture] || stadium.architecture} />
            <SpecCard icon={<Lightbulb size={15} className="text-[#E6B84C]" />} label="Iluminação" value={lightLabel[stadium.floodlightStyle]} />
            <SpecCard icon={<Users size={15} className="text-sky-400" />} label="Cobertura / Pista" value={`${stadium.roofCover ? 'Coberto' : 'Aberto'} · ${stadium.trackBorder ? 'Pista' : 'Alçapão'}`} />
            <SpecCard
              icon={<span className="w-3.5 h-3.5 inline-block border border-white/40" style={{ backgroundColor: stadium.turfToneB }} />}
              label="Gramado Pixel"
              value={`Tons ${stadium.turfToneA}`}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

function SpecCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-panel-soft p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-mono-num uppercase text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xs font-bold text-white truncate font-mono-num">{value}</div>
    </div>
  );
}
