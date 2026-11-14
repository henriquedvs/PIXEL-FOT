import React, { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

export const OrientationGuard: React.FC = () => {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortraitMobile(portrait);
      if (!portrait) setDismissed(false);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!isPortraitMobile || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#071019]/96 flex flex-col items-center justify-center p-6 text-center">
      <div className="px-panel p-6 max-w-xs w-full flex flex-col items-center">
        <div className="w-16 h-16 rounded-[2px] bg-emerald-500/15 border border-emerald-500/45 flex items-center justify-center mb-4">
          <RotateCw size={30} className="text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="font-display text-xl font-bold text-white uppercase">
          Gire para a Horizontal
        </h2>
        <p className="text-xs text-slate-300 mt-2">
          PIXEL FOOTBALL foi projetado para jogar em modo paisagem com controles por toque.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="px-btn-secondary mt-5 px-5 py-2.5 text-xs uppercase cursor-pointer"
        >
          Continuar assim mesmo
        </button>
      </div>
    </div>
  );
};
