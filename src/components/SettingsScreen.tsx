import React, { useEffect, useState } from 'react';
import { ArrowLeft, Maximize2, Minimize2, RotateCcw, Sliders, Volume2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  ButtonSizePref,
  CameraAngleId,
  CameraZoomPreset,
  ControlPositionPref,
  GameSettings,
  GraphicsQuality,
  LanguageCode,
  OrientationPref,
} from '../types/game';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { PixelBackdrop } from './PixelBackdrop';
import { PixelCameraIcon, PixelStadiumIcon } from './PixelIcons';

interface SettingsScreenProps {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onBack: () => void;
}

export const CAMERA_ANGLE_OPTIONS: {
  id: CameraAngleId;
  label: string;
  desc: string;
}[] = [
  { id: 'cima', label: 'Câmera Cima', desc: 'Visão top-down clássica equilibrada' },
  { id: 'lado', label: 'Câmera Lado', desc: 'Ângulo lateral da arquibancada' },
  { id: 'tv', label: 'Câmera TV', desc: 'Transmissão esportiva com antecipação' },
  { id: 'dinamica', label: 'Câmera Dinâmica', desc: 'Acompanha lance a lance de perto' },
  { id: 'tatica', label: 'Câmera Tática', desc: 'Visão ampla do campo e passes' },
  { id: 'jogador', label: 'Câmera Jogador', desc: 'Foco direto no seu atleta' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onChange,
  onBack,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(typeof document !== 'undefined' && document.fullscreenElement)
  );

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    soundEngine.play('menu');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  const setAudio = (patch: Partial<GameSettings['audio']>) => {
    const next: GameSettings = {
      ...settings,
      audio: { ...settings.audio, ...patch },
    };
    soundEngine.updateSettings(next);
    onChange(next);
  };

  const handleReset = () => {
    soundEngine.play('menu');
    soundEngine.updateSettings(DEFAULT_SETTINGS);
    onChange(DEFAULT_SETTINGS);
  };

  return (
    <div className="px-shell animate-fadeIn">
      <PixelBackdrop dimOpacity={0.86} />

      <header className="relative z-10 px-header px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="px-btn-secondary flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
          <div className="px-divider-v h-6 hidden sm:block" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-lg text-white tracking-wide truncate">
              CONFIGURAÇÕES DO JOGO
            </h1>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              Câmeras, HUD da partida, controles, áudio e gráficos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-btn-secondary flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs cursor-pointer whitespace-nowrap"
        >
          <RotateCcw size={14} />
          Restaurar Padrão
        </button>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto custom-scroll p-3 sm:p-5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {/* CAMERAS & MATCH TRANSMISSION */}
          <section className="px-panel p-4 space-y-3 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E3346] pb-2">
              <h2 className="font-display font-bold text-sm sm:text-base text-sky-300 flex items-center gap-2 tracking-wide">
                <PixelCameraIcon size={18} />
                CÂMERAS DA PARTIDA &amp; ZOOM
              </h2>
              <span className="font-mono-num text-[11px] text-emerald-400 font-bold uppercase">
                Ativa: {CAMERA_ANGLE_OPTIONS.find((c) => c.id === settings.cameraAngle)?.label || 'Câmera Cima'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {CAMERA_ANGLE_OPTIONS.map((cam) => {
                const active = settings.cameraAngle === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      soundEngine.play('menu');
                      onChange({ ...settings, cameraAngle: cam.id });
                    }}
                    className={`p-2.5 text-left transition-colors cursor-pointer min-h-[68px] flex flex-col justify-between ${
                      active ? 'px-panel-active text-white' : 'px-panel-soft text-slate-300 hover:border-[#395b79]'
                    }`}
                  >
                    <div className="font-display font-bold text-xs text-white leading-tight">
                      {cam.label}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-snug mt-1">
                      {cam.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-[#1A2D3E]">
              <ChoiceGroup
                label="Distância (Zoom Base)"
                value={settings.cameraZoom}
                options={[
                  { id: 'close' as CameraZoomPreset, label: 'Próxima' },
                  { id: 'normal' as CameraZoomPreset, label: 'Padrão' },
                  { id: 'wide' as CameraZoomPreset, label: 'Ampla' },
                ]}
                onSelect={(cameraZoom) => onChange({ ...settings, cameraZoom })}
              />

              <SliderRow
                label={`Ajuste Fino de Zoom: ${Math.round((settings.cameraCustomScale ?? 1) * 100)}%`}
                value={settings.cameraCustomScale ?? 1.0}
                min={0.75}
                max={1.35}
                step={0.05}
                onChange={(cameraCustomScale) => onChange({ ...settings, cameraCustomScale })}
              />
            </div>
          </section>

          {/* OPTIONAL MATCH HUD */}
          <section className="px-panel p-4 space-y-3">
            <h2 className="font-display font-bold text-sm text-emerald-400 flex items-center gap-2 border-b border-[#1E3346] pb-2">
              <PixelStadiumIcon size={17} />
              HUD DA PARTIDA (OPCIONAL)
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Durante o jogo, apenas o placar, os controles analógicos e o botão de menu no canto aparecem por padrão. Ative abaixo se desejar ver elementos extras:
            </p>
            <ToggleRow
              label="Comentários / Narração em campo"
              value={settings.showMatchCommentary}
              onToggle={() =>
                onChange({
                  ...settings,
                  showMatchCommentary: !settings.showMatchCommentary,
                  hudCleanV2: true,
                })
              }
            />
            <ToggleRow
              label="Radar tático (minimapa)"
              value={settings.showMatchRadar}
              onToggle={() =>
                onChange({
                  ...settings,
                  showMatchRadar: !settings.showMatchRadar,
                  hudCleanV2: true,
                })
              }
            />
            <ToggleRow
              label="Barra de energia e nota ao vivo"
              value={settings.showMatchPlayerBar}
              onToggle={() =>
                onChange({
                  ...settings,
                  showMatchPlayerBar: !settings.showMatchPlayerBar,
                  hudCleanV2: true,
                })
              }
            />
            <ToggleRow
              label="Dicas rápidas dos botões"
              value={settings.showMatchHints}
              onToggle={() =>
                onChange({
                  ...settings,
                  showMatchHints: !settings.showMatchHints,
                  hudCleanV2: true,
                })
              }
            />
          </section>

          {/* AUDIO */}
          <section className="px-panel p-4 space-y-3">
            <h2 className="font-display font-bold text-sm text-emerald-400 flex items-center gap-2 border-b border-[#1E3346] pb-2">
              <Volume2 size={16} />
              ÁUDIO &amp; AMBIENTE DO ESTÁDIO
            </h2>
            <ToggleRow
              label="Música de Fundo"
              value={settings.audio.musicEnabled}
              onToggle={() => setAudio({ musicEnabled: !settings.audio.musicEnabled })}
            />
            <SliderRow
              label="Volume da Música"
              value={settings.audio.musicVolume}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setAudio({ musicVolume: v })}
            />
            <ToggleRow
              label="Efeitos Sonoros (Geral)"
              value={settings.audio.sfxEnabled}
              onToggle={() => setAudio({ sfxEnabled: !settings.audio.sfxEnabled })}
            />
            <SliderRow
              label="Volume Geral SFX"
              value={settings.audio.sfxVolume}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setAudio({ sfxVolume: v })}
            />

            <div className="pt-2 border-t border-[#1A2D3E] space-y-2.5">
              <div className="text-[11px] font-mono-num font-semibold text-slate-400 uppercase tracking-wider">
                Volumes Detalhados
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <SliderRow
                  label="Toque na Bola"
                  value={settings.audio.ballVolume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setAudio({ ballVolume: v })}
                />
                <SliderRow
                  label="Chute"
                  value={settings.audio.kickVolume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setAudio({ kickVolume: v })}
                />
                <SliderRow
                  label="Torcida"
                  value={settings.audio.crowdVolume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setAudio({ crowdVolume: v })}
                />
                <SliderRow
                  label="Rede / Gol"
                  value={settings.audio.netVolume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setAudio({ netVolume: v })}
                />
                <SliderRow
                  label="Apito"
                  value={settings.audio.whistleVolume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setAudio({ whistleVolume: v })}
                />
                <SliderRow
                  label="Comemoração"
                  value={settings.audio.celebrationVolume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setAudio({ celebrationVolume: v })}
                />
              </div>
            </div>
          </section>

          {/* CONTROLS & TOUCH */}
          <section className="px-panel p-4 space-y-3">
            <h2 className="font-display font-bold text-sm text-sky-300 flex items-center gap-2 border-b border-[#1E3346] pb-2">
              <Sliders size={16} />
              CONTROLES &amp; JOGABILIDADE
            </h2>
            <SliderRow
              label={`Sensibilidade do Analógico: ${Math.round(settings.controlSensitivity * 100)}%`}
              value={settings.controlSensitivity}
              min={0.5}
              max={1.5}
              step={0.05}
              onChange={(controlSensitivity) => onChange({ ...settings, controlSensitivity })}
            />
            <ChoiceGroup
              label="Tamanho dos Botões de Toque"
              value={settings.buttonSize}
              options={[
                { id: 'normal' as ButtonSizePref, label: 'Normal' },
                { id: 'large' as ButtonSizePref, label: 'Grande' },
              ]}
              onSelect={(buttonSize) => onChange({ ...settings, buttonSize })}
            />
            <ChoiceGroup
              label="Posição dos Botões"
              value={settings.controlPosition}
              options={[
                { id: 'standard' as ControlPositionPref, label: 'Padrão' },
                { id: 'compact' as ControlPositionPref, label: 'Compacto' },
              ]}
              onSelect={(controlPosition) => onChange({ ...settings, controlPosition })}
            />
            <ToggleRow
              label="Assistência de Mira / Passe"
              value={settings.aimAssist}
              onToggle={() => onChange({ ...settings, aimAssist: !settings.aimAssist })}
            />
            <ToggleRow
              label="Vibração no Toque"
              value={settings.vibration}
              onToggle={() => onChange({ ...settings, vibration: !settings.vibration })}
            />
          </section>

          {/* GRAPHICS, HUD & SYSTEM (Includes Fullscreen strictly here & TitleScreen) */}
          <section className="px-panel p-4 space-y-3">
            <h2 className="font-display font-bold text-sm text-amber-300 border-b border-[#1E3346] pb-2">
              GRÁFICOS, TELA &amp; SISTEMA
            </h2>
            <ChoiceGroup
              label="Qualidade Geral Gráfica"
              value={settings.graphicsQuality}
              options={[
                { id: 'high' as GraphicsQuality, label: 'Alta' },
                { id: 'medium' as GraphicsQuality, label: 'Média' },
                { id: 'low' as GraphicsQuality, label: 'Leve' },
              ]}
              onSelect={(graphicsQuality) => onChange({ ...settings, graphicsQuality })}
            />
            <ChoiceGroup
              label="Detalhe da Torcida"
              value={settings.crowdDetail}
              options={[
                { id: 'high' as GraphicsQuality, label: 'Alta' },
                { id: 'medium' as GraphicsQuality, label: 'Média' },
                { id: 'low' as GraphicsQuality, label: 'Leve' },
              ]}
              onSelect={(crowdDetail) => onChange({ ...settings, crowdDetail })}
            />
            <SliderRow
              label={`Intensidade dos Efeitos: ${Math.round(settings.effectsIntensity * 100)}%`}
              value={settings.effectsIntensity}
              min={0.5}
              max={1.0}
              step={0.05}
              onChange={(effectsIntensity) => onChange({ ...settings, effectsIntensity })}
            />
            <ToggleRow
              label="Efeitos Ambientais (Chuva / Luzes / Papel)"
              value={settings.environmentalEffects}
              onToggle={() =>
                onChange({ ...settings, environmentalEffects: !settings.environmentalEffects })
              }
            />
            <ToggleRow
              label="HUD Alto Contraste"
              value={settings.highContrastHud}
              onToggle={() => onChange({ ...settings, highContrastHud: !settings.highContrastHud })}
            />
            <ChoiceGroup
              label="Orientação da Tela"
              value={settings.orientation}
              options={[
                { id: 'landscape-auto' as OrientationPref, label: 'Horizontal Auto' },
                { id: 'landscape-locked' as OrientationPref, label: 'Travar Horizontal' },
              ]}
              onSelect={(orientation) => onChange({ ...settings, orientation })}
            />

            <div className="flex items-center justify-between py-2 border-t border-[#1A2D3E]">
              <span className="text-xs font-medium text-slate-200">Modo de Exibição</span>
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`px-3 py-1.5 min-h-[36px] text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer ${
                  isFullscreen ? 'px-btn-primary' : 'px-btn-secondary'
                }`}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
              </button>
            </div>

            <ChoiceGroup
              label="Idioma"
              value={settings.language}
              options={[
                { id: 'pt-BR' as LanguageCode, label: 'PT-BR' },
                { id: 'en-US' as LanguageCode, label: 'EN' },
                { id: 'es-ES' as LanguageCode, label: 'ES' },
              ]}
              onSelect={(language) => onChange({ ...settings, language })}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1 gap-3">
      <span className="text-xs text-slate-200">{label}</span>
      <button
        type="button"
        onClick={() => {
          soundEngine.play('menu');
          onToggle();
        }}
        className={`min-w-[74px] px-3 py-1.5 min-h-[32px] font-display font-bold text-[11px] tracking-wide cursor-pointer rounded-[2px] border transition-colors ${
          value
            ? 'bg-emerald-500 text-slate-950 border-emerald-300'
            : 'bg-[#0C1724] text-slate-400 border-[#263E54] hover:text-slate-200'
        }`}
      >
        {value ? 'ATIVO' : 'OCULTO'}
      </button>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex justify-between text-[11px] text-slate-300">
        <span>{label}</span>
        <span className="font-mono-num text-emerald-400 font-bold">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500 cursor-pointer"
      />
    </label>
  );
}

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onSelect: (id: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onSelect(opt.id);
            }}
            className={`px-3 py-1.5 min-h-[34px] text-xs font-display font-semibold cursor-pointer rounded-[2px] border transition-colors ${
              value === opt.id
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-bold'
                : 'bg-[#0C1724] text-slate-300 border-[#263E54] hover:border-[#416585]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
