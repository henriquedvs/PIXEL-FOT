import React from 'react';
import { ArrowLeft, Gamepad2, Music, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface CreditsScreenProps {
  onBack: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ onBack }) => {
  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden">
      <header className="px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center gap-3 shrink-0 bg-[#0D1624]">
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
        <h1 className="font-display text-lg sm:text-xl font-bold text-white">
          Créditos
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto custom-scroll p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-[#111B2B] border border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-white">
              PIXEL <span className="text-emerald-400">FOOTBALL</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Jogo de futebol 2D em Pixel Art projetado para experiência móvel horizontal, com motor de partidas 11v11, inteligência artificial tática e Modo Carreira completo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <Gamepad2 size={18} className="text-emerald-400 mb-2" />
              <div className="text-xs font-bold text-white">Motor & Pixel Art</div>
              <p className="text-xs text-slate-400 mt-1">
                Sprites procedurais em Pixel Art, câmera top-down e física 2D em tempo real.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <Music size={18} className="text-sky-400 mb-2" />
              <div className="text-xs font-bold text-white">Áudio Original</div>
              <p className="text-xs text-slate-400 mt-1">
                Efeitos sonoros e trilha ambiente sintetizados proceduralmente via Web Audio API.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <ShieldCheck size={18} className="text-amber-400 mb-2" />
              <div className="text-xs font-bold text-white">Clubes Fictícios</div>
              <p className="text-xs text-slate-400 mt-1">
                Todos os clubes, escudos, estádios e atletas são criações originais fictícias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
