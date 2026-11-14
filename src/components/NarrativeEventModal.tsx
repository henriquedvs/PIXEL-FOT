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
    <div className="fixed inset-0 z-50 bg-[#050B12]/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="px-panel max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-header px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[2px] bg-emerald-500/15 border border-emerald-500/45 flex items-center justify-center shrink-0 text-emerald-400">
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
              <h2 className="font-display font-extrabold text-base text-white uppercase truncate">
                {event.title}
              </h2>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scroll max-h-[72dvh]">
          <div className="px-panel-soft p-4 space-y-1.5">
            <div className="text-xs font-display font-bold text-[#E6B84C] uppercase">
              {event.speakerName}{' '}
              <span className="text-slate-400 font-mono-num font-normal">· {event.speakerRole}</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{event.prompt}</p>
          </div>

          {!selected ? (
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono-num font-bold uppercase text-slate-400 tracking-wider">
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
                  className="px-panel-soft hover:border-emerald-400 w-full min-h-[48px] text-left p-3.5 transition-colors cursor-pointer flex items-center justify-between gap-3"
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
              <div className="px-panel-active p-4 space-y-2">
                <div className="text-[11px] font-bold uppercase text-emerald-400 font-mono-num">
                  Sua Resposta ({selected.tone})
                </div>
                <p className="text-sm text-white leading-relaxed">{selected.responseText}</p>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono-num font-bold uppercase text-slate-400 tracking-wider">
                  Impacto na Carreira
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {renderEffects(selected.effects).map((ef) => {
                    const good = ef.label === 'Fadiga' ? ef.delta < 0 : ef.delta > 0;
                    return (
                      <div
                        key={ef.label}
                        className="px-panel-soft px-3 py-2 flex items-center justify-between text-xs font-mono-num"
                      >
                        <span className="text-slate-300">{ef.label}</span>
                        <span className={good ? 'text-emerald-400 font-bold' : 'text-[#E6B84C] font-bold'}>
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
        <footer className="px-5 py-3.5 border-t border-[#1E3346] bg-[#081018] flex items-center justify-end gap-2">
          {selected ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                onSelectChoice(selected);
                onClose();
              }}
              className="px-btn-primary min-h-[44px] px-5 py-2.5 text-xs sm:text-sm uppercase flex items-center gap-2 cursor-pointer"
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
              className="px-btn-secondary min-h-[44px] px-4 py-2 text-xs uppercase cursor-pointer"
            >
              Decidir Depois
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
