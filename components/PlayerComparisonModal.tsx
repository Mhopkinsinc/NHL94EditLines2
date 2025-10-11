import React, { useEffect } from 'react';
import type { Player } from '../types';

interface PlayerComparisonModalProps {
  players: { p1: Player; p2: Player };
  onClose: () => void;
}

const ComparisonRow: React.FC<{
  label: string;
  value1: number | string;
  value2: number | string;
  higherIsBetter?: boolean;
}> = ({ label, value1, value2, higherIsBetter = true }) => {
  let p1Better = false;
  let p2Better = false;

  const numValue1 = typeof value1 === 'number' ? value1 : -1;
  const numValue2 = typeof value2 === 'number' ? value2 : -1;

  if (numValue1 !== -1 && numValue2 !== -1) {
    p1Better = higherIsBetter ? numValue1 > numValue2 : numValue1 < numValue2;
    p2Better = higherIsBetter ? numValue2 > numValue1 : numValue2 < numValue1;
  }

  const valueClasses = "font-bold font-mono text-lg";
  const p1Classes = p1Better ? 'text-green-400' : 'text-gray-300';
  const p2Classes = p2Better ? 'text-green-400' : 'text-gray-300';
  const p1DisplayValue = typeof value1 === 'string' ? <span className="text-gray-600">{value1}</span> : value1;
  const p2DisplayValue = typeof value2 === 'string' ? <span className="text-gray-600">{value2}</span> : value2;


  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm py-1.5 border-b border-white/10">
      <span className={`${valueClasses} ${p1Classes} text-right`}>
        {p1DisplayValue}
      </span>
      <span className="text-center text-gray-400 uppercase text-xs w-28 truncate" title={label}>
        {label}
      </span>
      <span className={`${valueClasses} ${p2Classes} text-left`}>
        {p2DisplayValue}
      </span>
    </div>
  );
};

export const PlayerComparisonModal: React.FC<PlayerComparisonModalProps> = ({ players, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const { p1, p2 } = players;
  const p1IsGoalie = p1.role === 'Goalie';
  const p2IsGoalie = p2.role === 'Goalie';
  const bothAreGoalies = p1IsGoalie && p2IsGoalie;

  const p1Fighting = Math.ceil(p1.attributes.fighting / 2);
  const p2Fighting = Math.ceil(p2.attributes.fighting / 2);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#212934] border-2 border-sky-500/50 shadow-sky-500/20 shadow-2xl rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: 'radial-gradient(circle at top, rgba(0, 32, 91, 0.4), transparent 60%)',
        }}
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-sky-500/30 shrink-0 bg-black/20 z-10 text-center">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <h3 className="text-lg font-bold text-white truncate text-right" title={p1.name}>{p1.name}</h3>
            <span className="text-gray-500 font-black text-xl px-4">VS</span>
            <h3 className="text-lg font-bold text-white truncate text-left" title={p2.name}>{p2.name}</h3>
          </div>
           <div className="grid grid-cols-[1fr_auto_1fr] items-center text-sm">
             <p className="text-gray-400 text-right">{p1.role}</p>
             <div />
             <p className="text-gray-400 text-left">{p2.role}</p>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 relative z-10">
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-sky-400 text-center mb-1">Skating</h4>
              <ComparisonRow label="Agility" value1={p1.attributes.agility} value2={p2.attributes.agility} />
              <ComparisonRow label="Speed" value1={p1.attributes.speed} value2={p2.attributes.speed} />
            </div>

             <div>
              <h4 className="font-bold text-sky-400 text-center mb-1">Awareness</h4>
              <ComparisonRow label="Off. Aware" value1={p1.attributes.oawareness} value2={p2.attributes.oawareness} />
              <ComparisonRow label="Def. Aware" value1={p1.attributes.dawareness} value2={p2.attributes.dawareness} />
            </div>
            
            {!bothAreGoalies && (
              <>
                <div>
                    <h4 className="font-bold text-sky-400 text-center mb-1">Skater Skills</h4>
                    <ComparisonRow label="SHT Power" value1={!p1IsGoalie ? p1.attributes.shtpower : '-'} value2={!p2IsGoalie ? p2.attributes.shtpower : '-'} />
                    <ComparisonRow label="SHT ACC" value1={!p1IsGoalie ? p1.attributes.shtacc : '-'} value2={!p2IsGoalie ? p2.attributes.shtacc : '-'} />
                    <ComparisonRow label="Stickhand" value1={!p1IsGoalie ? p1.attributes.stickhand : '-'} value2={!p2IsGoalie ? p2.attributes.stickhand : '-'} />
                    <ComparisonRow label="Pass ACC" value1={!p1IsGoalie ? p1.attributes.passacc : '-'} value2={!p2IsGoalie ? p2.attributes.passacc : '-'} />
                </div>
                <div>
                    <h4 className="font-bold text-sky-400 text-center mb-1">Physical</h4>
                    <ComparisonRow label="Aggressive" value1={!p1IsGoalie ? p1.attributes.aggressiveness : '-'} value2={!p2IsGoalie ? p2.attributes.aggressiveness : '-'} />
                    <ComparisonRow label="Checking" value1={!p1IsGoalie ? p1.attributes.checking : '-'} value2={!p2IsGoalie ? p2.attributes.checking : '-'} />
                    <ComparisonRow label="Fighting" value1={!p1IsGoalie ? p1Fighting : '-'} value2={!p2IsGoalie ? p2Fighting : '-'} />
                    <ComparisonRow label="Weight" value1={140 + (8 * p1.attributes.weight)} value2={140 + (8 * p2.attributes.weight)} />
                </div>
              </>
            )}

            {(p1IsGoalie || p2IsGoalie) && (
                <div>
                    <h4 className="font-bold text-sky-400 text-center mb-1">Goalie Skills</h4>
                    <ComparisonRow label="Puck Control" value1={p1IsGoalie ? p1.attributes.shtpower : '-'} value2={p2IsGoalie ? p2.attributes.shtpower : '-'} />
                    <ComparisonRow label="Stick Left" value1={p1IsGoalie ? p1.attributes.roughness : '-'} value2={p2IsGoalie ? p2.attributes.roughness : '-'} />
                    <ComparisonRow label="Stick Right" value1={p1IsGoalie ? p1.attributes.endurance : '-'} value2={p2IsGoalie ? p2.attributes.endurance : '-'} />
                    <ComparisonRow label="Glove Left" value1={p1IsGoalie ? p1.attributes.aggressiveness : '-'} value2={p2IsGoalie ? p2.attributes.aggressiveness : '-'} />
                    <ComparisonRow label="Glove Right" value1={p1IsGoalie ? p1.attributes.passacc : '-'} value2={p2IsGoalie ? p2.attributes.passacc : '-'} />
                </div>
            )}
            
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl font-bold bg-black/20 rounded-full w-7 h-7 flex items-center justify-center z-20"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
