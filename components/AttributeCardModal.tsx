import React, { useEffect, useMemo } from 'react';
import type { Player } from '../types';
import { AnchorIcon, FeatherIcon } from './icons';
import { chicagoLogoDataUri } from './ChicagoLogo';
import { torontoLogoDataUri } from './TorontoLogo';
import { nhlLogoDataUri } from './NhlLogo';


interface AttributeCardModalProps {
  player: Player;
  onClose: () => void;
  selectedTeamName?: string;
}

interface AttributeBarProps {
    label: string;
    value: number;
    fullName?: string;
    max?: number;
}

// Updated AttributeBar to be more compact to fix alignment
const AttributeBar: React.FC<AttributeBarProps> = ({ label, value, fullName, max = 6 }) => {
    const getBarColorForIndex = (index: number, totalValue: number): string => {
        if (index >= totalValue) {
            return 'bg-black/30'; // Not filled
        }

        if (totalValue < 3) {
            return 'bg-red-500';
        }
        if (totalValue === 3) {
            return 'bg-yellow-500';
        }
        // totalValue >= 4
        if (totalValue < 5) {
            return 'bg-green-500';
        }
        // totalValue >= 5
        if (index < 4) { // Bars 1-4 (0-indexed)
            return 'bg-green-500';
        } else { // Bars 5, 6, 7 (index 4, 5, 6)
            return 'bg-sky-500'; // Use highlight color for elite stats
        }
    };

    return (
        <div className="grid grid-cols-[auto_auto] justify-start items-center gap-x-2 mb-1.5">
            <span 
                className="w-20 text-xs uppercase tracking-wider text-gray-400 font-semibold truncate"
                title={fullName || label}
            >
                {label}
            </span>
            <div className="flex items-center gap-0.5">
                {Array.from({ length: max }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-sm ${getBarColorForIndex(i, value)}`}
                    />
                ))}
            </div>
        </div>
    );
}; 

const AttributeText: React.FC<{ label: string; value: string; fullName?: string }> = ({ label, value, fullName }) => (
    <div className="grid grid-cols-[auto_auto] justify-start items-center gap-x-2 mb-1.5">
        <span
            className="w-20 text-xs uppercase tracking-wider text-gray-400 font-semibold truncate"
            title={fullName || label}
        >
            {label}
        </span>
        <span className="font-mono text-sm text-white leading-tight font-bold">{value}</span>
    </div>
);


const AttributeCategory: React.FC<{
  title: string;
  children: React.ReactNode;
  value1?: number;
  value2?: number;
}> = ({ title, children, value1, value2 }) => {
    const displayValue =
      value1 !== undefined && value2 !== undefined
        ? `${value1}/${value2}`
        : value1 !== undefined
        ? value1
        : null;

    return (
        <div>
            <div className="flex justify-between items-baseline font-bold text-sky-400 mb-2 border-b border-sky-400/20 pb-1">
              <h3>{title}</h3>
              {displayValue !== null && (
                <span className="text-gray-300 text-sm font-mono">{displayValue}</span>
              )}
            </div>
            {children}
        </div>
    );
};


export const AttributeCardModal: React.FC<AttributeCardModalProps> = ({ player, onClose, selectedTeamName }) => {
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

    const teamLogoUrl = useMemo(() => {
        if (selectedTeamName === 'Toronto Maple Leafs') {
            return `${torontoLogoDataUri}`;
        }
        if (selectedTeamName === 'Chicago Blackhawks') {
            return `${chicagoLogoDataUri}`;
        }
        return `${nhlLogoDataUri}`;
    }, [selectedTeamName]);

    const backgroundStyle = useMemo(() => {
        const style = {
          backgroundRepeat: 'no-repeat',
        };
        if (selectedTeamName === 'Toronto Maple Leafs') {
          return {
            ...style,
            backgroundImage: `url(${torontoLogoDataUri})`,
            backgroundSize: '150%',
            backgroundPosition: '50% 10%',
            opacity: 0.1,
          };
        } else if (selectedTeamName === 'Chicago Blackhawks') {
          return {
            ...style,
            backgroundImage: `url(${chicagoLogoDataUri})`,
            backgroundSize: '150%',
            backgroundPosition: '50% 10%',
            opacity: 0.05,
          };
        }
        return {
          ...style,
          backgroundImage: `url(${nhlLogoDataUri})`,
          backgroundSize: 'contain',
          backgroundPosition: '50% 10%',
          opacity: 0.05,
        };
    }, [selectedTeamName]);

    const { attributes } = player;
    const isGoalie = player.role === 'Goalie';
    // The fighting attribute is out of 15 (max raw value). The user wants 7 bars.
    // Logic: if odd, round down to even, then divide by 2. This is Math.floor(value / 2).
    const fightingDisplayValue = Math.floor(attributes.fighting / 2);
    const fightingHeaderValue = attributes.fighting - (attributes.fighting % 2);
    const injuryValue = attributes.fighting >= 8 ? 'INJ G' : 'INJ P';
    const isLightweight = attributes.weight <= 5;
    const isHeavyweight = attributes.weight >= 10;


    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[#212934] border-2 border-sky-500/50 shadow-sky-500/20 shadow-2xl rounded-xl w-full max-w-sm max-h-[90vh] flex flex-col relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundImage: 'radial-gradient(circle at top, rgba(0, 32, 91, 0.4), transparent 60%)',
                }}
            >
                <div
                    className="absolute inset-0 z-0"
                    style={backgroundStyle}
                />
                {/* Header */}
                <div className="p-4 border-b-2 border-sky-500/30 flex justify-between items-center shrink-0 bg-black/20 relative z-10">
                    <div>
                        <h2 
                            className="text-2xl font-black tracking-wide text-white"
                            style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 5px rgba(0,0,0,0.8)' }}
                        >
                            {player.name}
                        </h2>
                        <p className="text-gray-400 font-semibold">{player.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <img 
                            src={teamLogoUrl} 
                            alt="Team Logo" 
                            className="w-12 h-12"
                        />
                         <div 
                            className="text-5xl font-black text-sky-300"
                            style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 5px rgba(0,0,0,0.8)' }}
                        >
                           {attributes.jerseynum}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-4 relative z-10">
                    <div className="grid grid-cols-2 gap-x-6">
                        {isGoalie ? (
                            <>
                                <div className="space-y-4">
                                    <AttributeCategory 
                                        title="Skating" 
                                        value1={attributes.agility} 
                                        value2={attributes.speed}
                                    >
                                        <AttributeBar label="Agility" value={attributes.agility} />
                                        <AttributeBar label="Speed" value={attributes.speed} />
                                    </AttributeCategory>
                                    <AttributeCategory 
                                        title="Stick"
                                        value1={attributes.roughness}
                                        value2={attributes.endurance}
                                    >
                                        <AttributeBar label="Stick Left" value={attributes.roughness} />
                                        <AttributeBar label="Stick Right" value={attributes.endurance} />
                                    </AttributeCategory>
                                    <AttributeCategory 
                                        title="Glove"
                                        value1={attributes.aggressiveness}
                                        value2={attributes.passacc}
                                    >
                                        <AttributeBar label="Glove Left" value={attributes.aggressiveness} />
                                        <AttributeBar label="Glove Right" value={attributes.passacc} />
                                    </AttributeCategory>
                                </div>
                                <div className="space-y-4">
                                    <AttributeCategory 
                                        title="Puck Control"
                                        value1={attributes.shtpower}
                                    >
                                        <AttributeBar label="Puck Control" value={attributes.shtpower} />
                                    </AttributeCategory>
                                    <AttributeCategory 
                                        title="Awareness"
                                        value1={attributes.oawareness}
                                        value2={attributes.dawareness}
                                    >
                                        <AttributeBar label="Off. Aware" value={attributes.oawareness} fullName="Offensive Awareness" />
                                        <AttributeBar label="Def. Aware" value={attributes.dawareness} fullName="Defensive Awareness" />
                                    </AttributeCategory>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <AttributeCategory 
                                        title="Skating" 
                                        value1={attributes.agility} 
                                        value2={attributes.speed}
                                    >
                                        <AttributeBar label="Agility" value={attributes.agility} />
                                        <AttributeBar label="Speed" value={attributes.speed} />
                                    </AttributeCategory>
                                    <AttributeCategory 
                                        title="Playmaking"
                                        value1={attributes.stickhand}
                                        value2={attributes.passacc}
                                    >
                                        <AttributeBar label="Stk Handl" value={attributes.stickhand} fullName="Stick Handling" />
                                        <AttributeBar label="Pass ACC" value={attributes.passacc} fullName="Passing Accuracy" />                            
                                    </AttributeCategory>
                                    <AttributeCategory 
                                        title="Physical"
                                        value1={attributes.aggressiveness}
                                        value2={attributes.checking}
                                    >
                                        <AttributeBar label="Aggressiveness" value={attributes.aggressiveness} />
                                        <AttributeBar label="Checking" value={attributes.checking} />
                                    </AttributeCategory>
                                    <AttributeCategory title="Pass/Shot Bias" value1={attributes.roughness}>
                                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2">
                                            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Pass</span>
                                            <div className="relative justify-self-center" style={{ width: '58px', height: '1rem' }}>
                                                <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                                                    {Array.from({ length: 6 }).map((_, i) => {
                                                        const isSelected = (attributes.roughness - 1) === i;
                                                        return (
                                                            <div key={i} className={`w-2 h-2 rounded-sm ${isSelected ? 'bg-green-500' : 'bg-black/30'}`} />
                                                        );
                                                    })}
                                                </div>
                                                {attributes.roughness >= 1 && attributes.roughness <= 6 && (
                                                    <div 
                                                        className="absolute -top-0.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-white"
                                                        style={{ 
                                                            left: `${((attributes.roughness - 1) * 10) + 4}px`,
                                                            transform: 'translateX(-50%)'
                                                        }}
                                                        title={`Pass/Shot Bias: ${attributes.roughness}`}
                                                    />
                                                )}
                                            </div>
                                            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Shot</span>
                                        </div>
                                    </AttributeCategory>
                                </div>
                                {/* Right Column */}
                                <div className="space-y-4">
                                    <AttributeCategory 
                                        title="Shooting"
                                        value1={attributes.shtpower}
                                        value2={attributes.shtacc}
                                    >
                                        <AttributeBar label="SHT Power" value={attributes.shtpower} fullName="Shot Power" />
                                        <AttributeBar label="SHT ACC" value={attributes.shtacc} fullName="Shot Accuracy" />
                                    </AttributeCategory>
                                    <AttributeCategory 
                                        title="Awareness"
                                        value1={attributes.oawareness}
                                        value2={attributes.dawareness}
                                    >
                                        <AttributeBar label="Off. Aware" value={attributes.oawareness} fullName="Offensive Awareness" />
                                        <AttributeBar label="Def. Aware" value={attributes.dawareness} fullName="Defensive Awareness" />
                                    </AttributeCategory>
                                    <AttributeCategory title="Misc" value1={attributes.endurance} value2={fightingHeaderValue}>
                                        <AttributeBar label="Endurance" value={attributes.endurance} />
                                        <AttributeBar label="Fighting" value={fightingDisplayValue} max={7} />
                                        <AttributeText label="DLV CHK" value={injuryValue} fullName="Injury (Delivering Check)" />
                                        <AttributeText label="RCV CHK" value={injuryValue} fullName="Injury (Receiving Check)" />
                                    </AttributeCategory>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 mt-auto bg-black/20 border-t-2 border-sky-500/30 text-sm flex justify-around items-center text-center relative z-10">
                    <div>
                        <span className="text-gray-400 uppercase text-xs font-bold block">{isGoalie ? 'Glove Hand' : 'Shoots'}</span>
                        <span className="font-semibold text-lg">{attributes.handed === 0 ? 'Left' : 'Right'}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 uppercase text-xs font-bold block">Weight</span>
                         <div className="relative inline-flex items-center">
                           <span className="font-semibold text-lg">{140 + (8 * attributes.weight)}</span>
                           <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2">
                               {isLightweight && <FeatherIcon className="w-5 h-5 text-white" />}
                               {isHeavyweight && <AnchorIcon className="w-5 h-5 text-white" />}
                           </div>
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