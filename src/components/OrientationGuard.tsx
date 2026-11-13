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
    <div className="fixed inset-0 z-[100] bg-[#081018]/95 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mb-4">
        <RotateCw size={30} className="text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      <h2 className="font-display text-xl font-bold text-white">
        Gire o aparelho para a horizontal
      </h2>
      <p className="text-sm text-slate-300 mt-2 max-w-xs">
        PIXEL FOOTBALL foi projetado para jogar em modo paisagem (horizontal) com controles por toque.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-5 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
      >
        Continuar assim mesmo
      </button>
    </div>
  );
};
