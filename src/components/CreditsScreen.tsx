import React from 'react';
import { ArrowLeft, Gamepad2, Music, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { PixelBackdrop } from './PixelBackdrop';

interface CreditsScreenProps {
  onBack: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ onBack }) => {
  return (
    <div className="px-shell animate-fadeIn">
      <PixelBackdrop dimOpacity={0.86} />

      <header className="relative z-10 px-header px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => {
            soundEngine.play('menu');
            onBack();
          }}
          className="px-btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs uppercase cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div className="px-flag-stripe-br" />
        <h1 className="font-display text-lg sm:text-xl font-bold text-white uppercase">
          Créditos
        </h1>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scroll p-6 flex items-center justify-center">
        <div className="px-panel max-w-2xl w-full p-6 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-white uppercase">
              PIXEL <span className="text-emerald-400">FOOTBALL</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Jogo de futebol 2D em Pixel Art projetado para experiência móvel horizontal, com motor de partidas 11v11, 6 câmeras oficiais, inteligência artificial tática e Modo Carreira completo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1E3346]">
            <div className="px-panel-soft p-3.5">
              <Gamepad2 size={18} className="text-emerald-400 mb-2" />
              <div className="text-xs font-display font-bold text-white uppercase">Motor & Pixel Art</div>
              <p className="text-xs text-slate-400 mt-1">
                Sprites procedurais em Pixel Art, 6 câmeras táticas e física 2D em tempo real.
              </p>
            </div>
            <div className="px-panel-soft p-3.5">
              <Music size={18} className="text-sky-400 mb-2" />
              <div className="text-xs font-display font-bold text-white uppercase">Áudio Original</div>
              <p className="text-xs text-slate-400 mt-1">
                Efeitos sonoros e trilha ambiente sintetizados proceduralmente via Web Audio API.
              </p>
            </div>
            <div className="px-panel-soft p-3.5">
              <ShieldCheck size={18} className="text-[#E6B84C] mb-2" />
              <div className="text-xs font-display font-bold text-white uppercase">Clubes Fictícios</div>
              <p className="text-xs text-slate-400 mt-1">
                Todos os 40 clubes, escudos, estádios e atletas são criações originais fictícias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
