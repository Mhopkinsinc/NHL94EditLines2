import React, { useEffect } from 'react';
import type { Player } from '../types';
import { AnchorIcon, FeatherIcon } from './icons';

interface PlayerComparisonModalProps {
  players: { p1: Player; p2: Player };
  onClose: () => void;
}

const ComparisonRow: React.FC<{
  label: string;
  fullName?: string;
  value1: React.ReactNode;
  value2: React.ReactNode;
  numericValue1: number | string;
  numericValue2: number | string;
  higherIsBetter?: boolean;
  highlight?: boolean;
}> = ({ label, fullName, value1, value2, numericValue1, numericValue2, higherIsBetter = true, highlight = false }) => {
  let p1Better = false;
  let p2Better = false;

  const numValue1 = typeof numericValue1 === 'number' ? numericValue1 : -1;
  const numValue2 = typeof numericValue2 === 'number' ? numericValue2 : -1;

  if (numValue1 !== -1 && numValue2 !== -1) {
    p1Better = higherIsBetter ? numValue1 > numValue2 : numValue1 < numValue2;
    p2Better = higherIsBetter ? numValue2 > numValue1 : numValue2 < numValue1;
  }

  const valueClasses = "font-bold font-mono text-lg";
  const p1Classes = p1Better ? 'text-green-400' : 'text-gray-300';
  const p2Classes = p2Better ? 'text-green-400' : 'text-gray-300';
  
  // Display value can be a node (for weight with icon) or a simple value
  const p1DisplayValue = typeof numericValue1 === 'string' ? <span className="text-gray-600">{value1}</span> : value1;
  const p2DisplayValue = typeof numericValue2 === 'string' ? <span className="text-gray-600">{value2}</span> : value2;


  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm py-1.5 border-b border-white/10 ${highlight ? 'bg-sky-900/50 animate-pulse rounded px-2 -mx-2' : ''}`}>
      <span className={`${valueClasses} ${p1Classes} text-right flex justify-end items-center gap-1`}>
        {p1DisplayValue}
      </span>
      <span className={`text-center uppercase text-xs w-28 truncate ${highlight ? 'font-bold text-sky-300' : 'text-gray-400'}`} title={fullName || label}>
        {label}
      </span>
      <span className={`${valueClasses} ${p2Classes} text-left flex justify-start items-center gap-1`}>
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

  const p1Fighting = p1.attributes.fighting - (p1.attributes.fighting % 2);
  const p2Fighting = p2.attributes.fighting - (p2.attributes.fighting % 2);

  const p1IsLightweight = p1.attributes.weight <= 5;
  const p1IsHeavyweight = p1.attributes.weight >= 10;
  const p2IsLightweight = p2.attributes.weight <= 5;
  const p2IsHeavyweight = p2.attributes.weight >= 10;

  const p1Weight = 140 + (8 * p1.attributes.weight);
  const p2Weight = 140 + (8 * p2.attributes.weight);
  
  const p1WeightDisplay = (
    <>
      {p1IsLightweight && <FeatherIcon className="w-4 h-4 text-white" />}
      {p1IsHeavyweight && <AnchorIcon className="w-4 h-4 text-white" />}
      {p1Weight}
    </>
  );

  const p2WeightDisplay = (
    <>
      {p2Weight}
      {p2IsLightweight && <FeatherIcon className="w-4 h-4 text-white" />}
      {p2IsHeavyweight && <AnchorIcon className="w-4 h-4 text-white" />}
    </>
  );


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
             <p className="text-gray-400 text-right px-2">{p1.role}</p>
             <div />
             <p className="text-gray-400 text-left px-2">{p2.role}</p>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 relative z-10">
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-sky-400 text-center mb-1">Skating</h4>
              <ComparisonRow label="Agility" value1={p1.attributes.agility} numericValue1={p1.attributes.agility} value2={p2.attributes.agility} numericValue2={p2.attributes.agility} highlight={bothAreGoalies} />
              <ComparisonRow label="Speed" value1={p1.attributes.speed} numericValue1={p1.attributes.speed} value2={p2.attributes.speed} numericValue2={p2.attributes.speed} />
            </div>

             <div>
              <h4 className="font-bold text-sky-400 text-center mb-1">Awareness</h4>
              <ComparisonRow label="Off. Aware" fullName="Offensive Awareness" value1={p1.attributes.oawareness} numericValue1={p1.attributes.oawareness} value2={p2.attributes.oawareness} numericValue2={p2.attributes.oawareness} />
              <ComparisonRow label="Def. Aware" fullName="Defensive Awareness" value1={p1.attributes.dawareness} numericValue1={p1.attributes.dawareness} value2={p2.attributes.dawareness} numericValue2={p2.attributes.dawareness} highlight={bothAreGoalies} />
            </div>
            
            {!bothAreGoalies && (
              <div>
                  <h4 className="font-bold text-sky-400 text-center mb-1">Shooting & Playmaking</h4>
                  <ComparisonRow label="SHT Power" fullName="Shot Power" value1={p1.attributes.shtpower} numericValue1={p1.attributes.shtpower} value2={p2.attributes.shtpower} numericValue2={p2.attributes.shtpower} />
                  <ComparisonRow label="SHT ACC" fullName="Shot Accuracy" value1={p1.attributes.shtacc} numericValue1={p1.attributes.shtacc} value2={p2.attributes.shtacc} numericValue2={p2.attributes.shtacc} />
                  <ComparisonRow label="Stk Handl" fullName="Stick Handling" value1={p1.attributes.stickhand} numericValue1={p1.attributes.stickhand} value2={p2.attributes.stickhand} numericValue2={p2.attributes.stickhand} />
                  <ComparisonRow label="Pass ACC" fullName="Passing Accuracy" value1={p1.attributes.passacc} numericValue1={p1.attributes.passacc} value2={p2.attributes.passacc} numericValue2={p2.attributes.passacc} />
              </div>
            )}
            
            {bothAreGoalies && (
                <div>
                    <h4 className="font-bold text-sky-400 text-center mb-1">Goalie Skills</h4>
                    <ComparisonRow label="Puck Control" value1={p1.attributes.shtpower} numericValue1={p1.attributes.shtpower} value2={p2.attributes.shtpower} numericValue2={p2.attributes.shtpower} highlight={bothAreGoalies} />
                    <ComparisonRow label="Stick Left" value1={p1.attributes.roughness} numericValue1={p1.attributes.roughness} value2={p2.attributes.roughness} numericValue2={p2.attributes.roughness} />
                    <ComparisonRow label="Stick Right" value1={p1.attributes.endurance} numericValue1={p1.attributes.endurance} value2={p2.attributes.endurance} numericValue2={p2.attributes.endurance} />
                    <ComparisonRow label="Glove Left" value1={p1.attributes.aggressiveness} numericValue1={p1.attributes.aggressiveness} value2={p2.attributes.aggressiveness} numericValue2={p2.attributes.aggressiveness} />
                    <ComparisonRow label="Glove Right" value1={p1.attributes.passacc} numericValue1={p1.attributes.passacc} value2={p2.attributes.passacc} numericValue2={p2.attributes.passacc} />
                </div>
            )}
            
            <div>
              {!bothAreGoalies && (
                <h4 className="font-bold text-sky-400 text-center mb-1">Physical</h4>
              )}
              {!bothAreGoalies && (
                <>
                  <ComparisonRow label="Aggressiveness" value1={p1.attributes.aggressiveness} numericValue1={p1.attributes.aggressiveness} value2={p2.attributes.aggressiveness} numericValue2={p2.attributes.aggressiveness} />
                  <ComparisonRow label="Checking" value1={p1.attributes.checking} numericValue1={p1.attributes.checking} value2={p2.attributes.checking} numericValue2={p2.attributes.checking} />
                  <ComparisonRow label="Endurance" value1={p1.attributes.endurance} numericValue1={p1.attributes.endurance} value2={p2.attributes.endurance} numericValue2={p2.attributes.endurance} />
                  <ComparisonRow label="Fighting" value1={p1Fighting} numericValue1={p1Fighting} value2={p2Fighting} numericValue2={p2Fighting} />
                </>
              )}
              <ComparisonRow 
                  label="Weight" 
                  value1={p1WeightDisplay}
                  numericValue1={p1Weight}
                  value2={p2WeightDisplay}
                  numericValue2={p2Weight}
                  higherIsBetter={false}
                  highlight={bothAreGoalies}
              />
            </div>
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