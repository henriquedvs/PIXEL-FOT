import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, Mic, ShieldAlert, Users } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { NarrativeChoice, NarrativeEvent } from '../types/game';

interface NarrativeEventModalProps {
  event: NarrativeEvent;
  onSelectChoice: (choice: NarrativeChoice) => void;
  onClose: () => void;
}

const CATEGORY_LABEL: Record<NarrativeEvent['category'], string> = {
  COLETIVA: 'Coletiva de Imprensa',
  ZONA_MISTA: 'Zona Mista',
  TREINADOR: 'Reunião Técnica',
  VESTIARIO: 'Vestiário',
  CONTRATO: 'Mercado & Contrato',
  ESPECIAL: 'Evento com a Torcida',
};

export const NarrativeEventModal: React.FC<NarrativeEventModalProps> = ({
  event,
  onSelectChoice,
  onClose,
}) => {
  const [selected, setSelected] = useState<NarrativeChoice | null>(null);

  const renderEffects = (fx: NarrativeChoice['effects']) => {
    const items: { label: string; delta: number }[] = [];
    if (fx.morale) items.push({ label: 'Moral', delta: fx.morale });
    if (fx.coachTrust) items.push({ label: 'Treinador', delta: fx.coachTrust });
    if (fx.pressRelation) items.push({ label: 'Imprensa', delta: fx.pressRelation });
    if (fx.teamChemistry) items.push({ label: 'Entrosamento', delta: fx.teamChemistry });
    if (fx.fanSupport) items.push({ label: 'Torcida', delta: fx.fanSupport });
    if (fx.popularity) items.push({ label: 'Popularidade', delta: fx.popularity });
    if (fx.xp) items.push({ label: 'XP', delta: fx.xp });
    if (fx.fatigue) items.push({ label: 'Fadiga', delta: fx.fatigue });
    return items;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="max-w-xl w-full bg-[#0E1725] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-5 py-4 border-b border-slate-800 bg-[#0A111C] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              {event.category === 'COLETIVA' || event.category === 'ZONA_MISTA' ? (
                <Mic size={19} />
              ) : event.category === 'CONTRATO' ? (
                <ShieldAlert size={19} />
              ) : event.category === 'VESTIARIO' ? (
                <Users size={19} />
              ) : (
                <MessageSquare size={19} />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase text-emerald-400 font-mono-num">
                {CATEGORY_LABEL[event.category]} · {event.contextTag}
              </div>
              <h2 className="font-display font-extrabold text-base text-white truncate">
                {event.title}
              </h2>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scroll max-h-[72dvh]">
          <div className="p-4 rounded-xl bg-[#111B2B] border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold text-amber-300">
              {event.speakerName} <span className="text-slate-400 font-normal">· {event.speakerRole}</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{event.prompt}</p>
          </div>

          {!selected ? (
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Escolha sua postura
              </div>
              {event.choices.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    soundEngine.play('menu');
                    setSelected(ch);
                  }}
                  className="w-full min-h-[48px] text-left p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700 hover:border-emerald-500 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <span className="text-xs sm:text-sm font-semibold text-white">{ch.label}</span>
                  <span className="text-[10px] font-mono-num uppercase text-emerald-400 shrink-0">
                    {ch.tone}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-emerald-500/12 border border-emerald-500/45 space-y-2">
                <div className="text-[11px] font-bold uppercase text-emerald-400 font-mono-num">
                  Sua Resposta ({selected.tone})
                </div>
                <p className="text-sm text-white leading-relaxed">{selected.responseText}</p>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Impacto na Carreira
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {renderEffects(selected.effects).map((ef) => {
                    const good = ef.label === 'Fadiga' ? ef.delta < 0 : ef.delta > 0;
                    return (
                      <div
                        key={ef.label}
                        className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono-num"
                      >
                        <span className="text-slate-300">{ef.label}</span>
                        <span className={good ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                          {ef.delta > 0 ? `+${ef.delta}` : ef.delta}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-5 py-3.5 border-t border-slate-800 bg-[#0A111C] flex items-center justify-end gap-2">
          {selected ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                onSelectChoice(selected);
                onClose();
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                onClose();
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              Decidir Depois
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
