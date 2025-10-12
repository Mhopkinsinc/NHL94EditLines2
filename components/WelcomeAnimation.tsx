import React, { useState, useEffect, useRef } from 'react';
import { torontoLogoDataUri } from './TorontoLogo';
import { nhlLogoDataUri } from './NhlLogo';
import { chicagoLogoDataUri } from './ChicagoLogo';
import { nhl94LogoDataUri } from "./NHL94Logo";
import { walesLogoDataUri } from "./WalesLogo";
import { campbellLogoDataUri } from "./CampbellLogo";
import { ducksLogoDataUri } from "./DucksLogo";

const LOGO_SIZE = 120; // Increased base size for all logos.

interface LogoState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  logoUri: string;
  opacity: number;
  size: number;
  radius: number;
}

const availableLogos = [torontoLogoDataUri, nhlLogoDataUri, chicagoLogoDataUri, nhl94LogoDataUri, walesLogoDataUri, campbellLogoDataUri, ducksLogoDataUri];
const totalLogos = availableLogos.length;


export const WelcomeAnimation: React.FC = () => {
    const [logos, setLogos] = useState<LogoState[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const { width, height } = container.getBoundingClientRect();

        const createLogo = (id: number): LogoState => {
            const logoUri = availableLogos[id % availableLogos.length];
            const size = LOGO_SIZE; // All logos are now the same larger size.
            const radius = size / 2;

            return {
                id,
                x: Math.random() * width,
                y: height + Math.random() * height, // Start below the screen
                vx: (Math.random() - 0.5) * 50, // Horizontal velocity
                vy: -50 - Math.random() * 50,   // Upward velocity
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 30,
                logoUri,
                opacity: 0,
                size,
                radius,
            };
        };
        
        const initialLogos = Array.from({ length: totalLogos }, (_, i) => createLogo(i));
        setLogos(initialLogos);
        
        let lastTime = 0;
        const animate = (timestamp: number) => {
            if (!lastTime) {
                lastTime = timestamp;
                animationFrameId.current = requestAnimationFrame(animate);
                return;
            }
            const dt = (timestamp - lastTime) / 1000; // time delta in seconds
            lastTime = timestamp;

            setLogos(prevLogos => {
                const newLogos = prevLogos.map(logo => ({ ...logo }));

                // Update positions and handle wall collisions
                newLogos.forEach(logo => {
                    logo.x += logo.vx * dt;
                    logo.y += logo.vy * dt;
                    logo.rotation += logo.rotationSpeed * dt;

                    // Fade in
                    if (logo.opacity < 1) {
                        logo.opacity += 2 * dt;
                    }
                    if (logo.opacity > 1) logo.opacity = 1;

                    // Wall collisions
                    if (logo.x < logo.radius && logo.vx < 0) {
                        logo.vx *= -1;
                        logo.x = logo.radius;
                    } else if (logo.x > width - logo.radius && logo.vx > 0) {
                        logo.vx *= -1;
                        logo.x = width - logo.radius;
                    }

                    // If logo goes off the top, reset it at the bottom
                    if (logo.y < -logo.size) {
                        Object.assign(logo, createLogo(logo.id));
                    }
                });

                // Handle inter-logo collisions
                for (let i = 0; i < newLogos.length; i++) {
                    for (let j = i + 1; j < newLogos.length; j++) {
                        const logo1 = newLogos[i];
                        const logo2 = newLogos[j];

                        const dx = logo2.x - logo1.x;
                        const dy = logo2.y - logo1.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < logo1.radius + logo2.radius) {
                            // 1. Resolve overlap
                            const overlap = (logo1.radius + logo2.radius - distance) / 2;
                            const nx = dx / distance; // Normalized collision axis x
                            const ny = dy / distance; // Normalized collision axis y
                            logo1.x -= overlap * nx;
                            logo1.y -= overlap * ny;
                            logo2.x += overlap * nx;
                            logo2.y += overlap * ny;

                            // 2. Elastic collision response
                            const tx = -ny; // Tangent x
                            const ty = nx;  // Tangent y

                            const v1n = logo1.vx * nx + logo1.vy * ny; // velocity along normal
                            const v1t = logo1.vx * tx + logo1.vy * ty; // velocity along tangent
                            const v2n = logo2.vx * nx + logo2.vy * ny;
                            const v2t = logo2.vx * tx + logo2.vy * ty;

                            // Swap normal velocities (for equal mass objects)
                            const v1n_new = v2n;
                            const v2n_new = v1n;

                            // Convert back to cartesian coordinates and update velocities
                            logo1.vx = v1n_new * nx + v1t * tx;
                            logo1.vy = v1n_new * ny + v1t * ty;
                            logo2.vx = v2n_new * nx + v2t * tx;
                            logo2.vy = v2n_new * ny + v2t * ty;
                        }
                    }
                }
                return newLogos;
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
            {logos.map(logo => (
                <div
                    key={logo.id}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${logo.size}px`,
                        height: `${logo.size}px`,
                        transform: `translate(${logo.x - logo.radius}px, ${logo.y - logo.radius}px) rotate(${logo.rotation}deg)`,
                        opacity: logo.opacity,
                        willChange: 'transform, opacity',
                    }}
                >
                    <img 
                        src={logo.logoUri} 
                        alt="" 
                        role="presentation"
                        style={{ width: '100%', height: 'auto' }}
                    />
                </div>
            ))}
        </div>
    );
};