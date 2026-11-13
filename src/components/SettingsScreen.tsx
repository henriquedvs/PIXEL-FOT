import React from 'react';
import { ArrowLeft, RotateCcw, Sliders, Volume2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  AudioSettings,
  ButtonSizePref,
  ControlPositionPref,
  GameSettings,
  GraphicsQuality,
  LanguageCode,
  OrientationPref,
} from '../types/game';
import { DEFAULT_SETTINGS } from '../utils/storage';

interface SettingsScreenProps {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onBack: () => void;
}

const AUDIO_CHANNELS: { key: keyof AudioSettings; label: string }[] = [
  { key: 'musicVolume', label: 'Volume da música' },
  { key: 'sfxVolume', label: 'Volume geral dos efeitos' },
  { key: 'ballVolume', label: 'Som da bola' },
  { key: 'kickVolume', label: 'Som dos chutes' },
  { key: 'passVolume', label: 'Som dos passes' },
  { key: 'netVolume', label: 'Som das redes (Gol)' },
  { key: 'crowdVolume', label: 'Som da torcida' },
  { key: 'whistleVolume', label: 'Som do apito do árbitro' },
  { key: 'celebrationVolume', label: 'Sons das comemorações' },
  { key: 'footstepVolume', label: 'Som dos passos dos jogadores' },
  { key: 'menuVolume', label: 'Sons dos menus e botões' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onChange,
  onBack,
}) => {
  const updateAudio = (patch: Partial<AudioSettings>) => {
    const next: GameSettings = {
      ...settings,
      audio: { ...settings.audio, ...patch },
    };
    onChange(next);
  };

  const handleReset = () => {
    soundEngine.play('menu');
    onChange(DEFAULT_SETTINGS);
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden">
      <header className="px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-[#0D1624]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <h1 className="font-display text-lg sm:text-xl font-bold text-white whitespace-nowrap">
            Configurações e Personalização
          </h1>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw size={14} />
          Restaurar padrão
        </button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Audio Column */}
          <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Volume2 size={18} className="text-emerald-400" />
                Sistema de Áudio
              </h2>
              <button
                type="button"
                onClick={() => soundEngine.play('whistle')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300 cursor-pointer whitespace-nowrap"
              >
                Testar Som
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  updateAudio({ musicEnabled: !settings.audio.musicEnabled });
                }}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  settings.audio.musicEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">Música de fundo</div>
                <div className="text-sm font-bold mt-0.5">
                  {settings.audio.musicEnabled ? 'Ativada' : 'Desativada'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateAudio({ sfxEnabled: !settings.audio.sfxEnabled });
                  soundEngine.play('menu');
                }}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  settings.audio.sfxEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">Efeitos sonoros</div>
                <div className="text-sm font-bold mt-0.5">
                  {settings.audio.sfxEnabled ? 'Ativados' : 'Desativados'}
                </div>
              </button>
            </div>

            <div className="space-y-3">
              {AUDIO_CHANNELS.map((ch) => {
                const val = Number(settings.audio[ch.key] ?? 0.5);
                return (
                  <div key={ch.key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{ch.label}</span>
                      <span className="font-mono-num text-emerald-400 font-semibold">
                        {Math.round(val * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(val * 100)}
                      onChange={(e) =>
                        updateAudio({ [ch.key]: Number(e.target.value) / 100 })
                      }
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Visual, Controls & Accessibility Column */}
          <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 h-fit">
            <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Sliders size={18} className="text-sky-400" />
              Visual, Controles e Interface
            </h2>

            {/* Visual Quality & Crowd Detail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-300 font-medium">
                  Qualidade gráfica
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        onChange({ ...settings, graphicsQuality: q });
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                        settings.graphicsQuality === q
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {q === 'high' ? 'Alta' : q === 'medium' ? 'Média' : 'Baixa'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-slate-300 font-medium">
                  Detalhes da torcida
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        onChange({ ...settings, crowdDetail: q });
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                        settings.crowdDetail === q
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {q === 'high' ? 'Alta' : q === 'medium' ? 'Média' : 'Baixa'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Effects Intensity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Intensidade dos efeitos visuais</span>
                <span className="font-mono-num text-emerald-400 font-semibold">
                  {Math.round((settings.effectsIntensity ?? 0.9) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={100}
                value={Math.round((settings.effectsIntensity ?? 0.9) * 100)}
                onChange={(e) =>
                  onChange({ ...settings, effectsIntensity: Number(e.target.value) / 100 })
                }
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Control Sensitivity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Sensibilidade dos controles</span>
                <span className="font-mono-num text-emerald-400 font-semibold">
                  {Math.round(settings.controlSensitivity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={Math.round(settings.controlSensitivity * 100)}
                onChange={(e) =>
                  onChange({ ...settings, controlSensitivity: Number(e.target.value) / 100 })
                }
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Button Size & Control Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-300 font-medium">Tamanho dos botões</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['normal', 'large'] as ButtonSizePref[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        onChange({ ...settings, buttonSize: sz });
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                        settings.buttonSize === sz
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {sz === 'large' ? 'Grande' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-slate-300 font-medium">Posição dos botões</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['standard', 'compact'] as ControlPositionPref[]).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        onChange({ ...settings, controlPosition: pos });
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                        settings.controlPosition === pos
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {pos === 'compact' ? 'Compacto' : 'Padrão'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Boolean Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ToggleRow
                label="Efeitos ambientais"
                sub="Chuva e iluminação"
                value={settings.environmentalEffects}
                onToggle={() => onChange({ ...settings, environmentalEffects: !settings.environmentalEffects })}
              />
              <ToggleRow
                label="Assistência de mira"
                sub="Ajuda nos cantos do gol"
                value={settings.aimAssist}
                onToggle={() => onChange({ ...settings, aimAssist: !settings.aimAssist })}
              />
              <ToggleRow
                label="Vibração"
                sub="Chutes, trave e gols"
                value={settings.vibration}
                onToggle={() => {
                  const nextVal = !settings.vibration;
                  onChange({ ...settings, vibration: nextVal });
                  if (nextVal) soundEngine.vibrate(30);
                }}
              />
              <ToggleRow
                label="Alto contraste HUD"
                sub="Acessibilidade visual"
                value={settings.highContrastHud}
                onToggle={() => onChange({ ...settings, highContrastHud: !settings.highContrastHud })}
              />
              <ToggleRow
                label="Dicas em campo"
                sub="Comandos rápidos no jogo"
                value={settings.showMatchHints}
                onToggle={() => onChange({ ...settings, showMatchHints: !settings.showMatchHints })}
              />
            </div>

            {/* Language & Orientation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-300 font-medium">Idioma</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'pt-BR', label: 'PT-BR' },
                      { id: 'en-US', label: 'EN' },
                      { id: 'es-ES', label: 'ES' },
                    ] as { id: LanguageCode; label: string }[]
                  ).map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        onChange({ ...settings, language: lang.id });
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                        settings.language === lang.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-slate-300 font-medium">Orientação</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'landscape-auto', label: 'Auto' },
                      { id: 'landscape-locked', label: 'Travada' },
                    ] as { id: OrientationPref; label: string }[]
                  ).map((ori) => (
                    <button
                      key={ori.id}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        onChange({ ...settings, orientation: ori.id });
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                        settings.orientation === ori.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {ori.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

function ToggleRow({
  label,
  sub,
  value,
  onToggle,
}: {
  label: string;
  sub: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        soundEngine.play('menu');
        onToggle();
      }}
      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/75 border border-slate-800 text-left cursor-pointer hover:border-slate-600"
    >
      <div className="min-w-0 pr-2">
        <div className="text-xs font-semibold text-white truncate">{label}</div>
        <div className="text-[10px] text-slate-400 truncate">{sub}</div>
      </div>
      <span
        className={`px-2.5 py-1 rounded text-[11px] font-bold shrink-0 ${
          value ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
        }`}
      >
        {value ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
