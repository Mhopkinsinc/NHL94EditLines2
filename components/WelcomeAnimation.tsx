import React, { useState, useEffect } from 'react';
import { torontoLogoDataUri } from './TorontoLogo';
import { nhlLogoDataUri } from './NhlLogo';
import { chicagoLogoDataUri } from './ChicagoLogo';
import { nhl94LogoDataUri } from "./NHL94Logo";

interface StyleConfig {
  id: number;
  left: string;
  animationName: string;
  animationDuration: string;
  animationDelay: string;
  transform: string;
  zIndex: number;
  logoUri: string;
}

export const WelcomeAnimation: React.FC = () => {
    const [styles, setStyles] = useState<StyleConfig[]>([]);
    const [keyframes, setKeyframes] = useState('');
    const total = 20;
    const logos = [torontoLogoDataUri, nhlLogoDataUri, chicagoLogoDataUri, nhl94LogoDataUri];

    useEffect(() => {
        let keyframesString = '';
        const generatedStyles: StyleConfig[] = [];

        for (let i = 1; i <= total; i++) {
            const scale = Math.random() * 1.6 + 0.4;
            const initialRotate = Math.random() * 360;
            const endRotate = Math.random() * 360;

            keyframesString += `
                @keyframes raise${i} {
                    to {
                        bottom: 150vh;
                        transform: scale(${scale}) rotate(${endRotate}deg);
                    }
                }
                @keyframes fade${i} {
                    0% { opacity: 0; }
                    10% { opacity: 0.7; }
                    90% { opacity: 0.7; }
                    100% { opacity: 0; }
                }
            `;

            generatedStyles.push({
                id: i,
                left: `${Math.random() * 120 - 20}%`,
                animationName: `raise${i}, fade${i}`,
                animationDuration: `${6 + Math.random() * 15}s`,
                animationDelay: `${Math.random() * 5 - 5}s`,
                transform: `scale(${scale}) rotate(${initialRotate}deg)`,
                zIndex: i - 7,
                logoUri: logos[(i - 1) % logos.length],
            });
        }

        setKeyframes(keyframesString);
        setStyles(generatedStyles);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
            <style>{keyframes}</style>
            {styles.map(style => (
                <div
                    key={style.id}
                    className="logo-floater"
                    style={{
                        left: style.left,
                        animationName: style.animationName,
                        animationDuration: style.animationDuration,
                        animationDelay: style.animationDelay,
                        transform: style.transform,
                        zIndex: style.zIndex,
                        position: 'absolute',
                        bottom: '-100vh',
                        transformStyle: 'preserve-3d',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                    }}
                >
                    <img 
                        src={style.logoUri} 
                        alt="" 
                        role="presentation"
                        style={{ width: '60px', height: 'auto' }}
                    />
                </div>
            ))}
        </div>
    );
};