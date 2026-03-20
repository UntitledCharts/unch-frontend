'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from "../../contexts/LanguageContext";
import './BackgroundDecorations.css';

export default function BackgroundDecorations() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [shapes, setShapes] = useState([]);
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        
        const newShapes = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            type: ['circle', 'triangle', 'square', 'cross'][Math.floor(Math.random() * 4)],
            size: Math.random() * 30 + 10 + 'px',
            left: Math.random() * 95 + '%',
            top: Math.random() * 95 + '%',
            delay: Math.random() * 5 + 's',
            duration: Math.random() * 10 + 20 + 's',
            parallaxSpeed: (Math.random() - 0.5) * 0.4,
            rotation: Math.random() * 360 + 'deg'
        }));
        setShapes(newShapes);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        let rafId;
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                rafId = requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    if (containerRef.current) {
                        containerRef.current.style.setProperty('--scroll-y', `${scrollY}px`);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, [mounted]);

    if (!mounted || pathname !== '/') return null;

    return (
        <div className="bg-decorations-container" ref={containerRef}>
            {shapes.map((shape) => (
                <div
                    key={shape.id}
                    className={`bg-shape bg-common-${shape.type}`}
                    style={{
                        width: shape.size,
                        height: shape.size,
                        left: shape.left,
                        top: shape.top,
                        position: 'absolute',
                        animationDelay: shape.delay,
                        animationDuration: shape.duration,
                        transform: `translateY(calc(var(--scroll-y, 0px) * ${shape.parallaxSpeed})) rotate(calc(${shape.rotation} + var(--scroll-y, 0px) * 0.15deg))`
                    }}
                />
            ))}

            <div
                className="bg-shape bg-large-circle"
                style={{ transform: `translateY(calc(var(--scroll-y, 0px) * 0.15)) rotate(calc(var(--scroll-y, 0px) * 0.05deg))` }}
            ></div>
            <div
                className="bg-shape bg-large-triangle"
                style={{ transform: `translateY(calc(var(--scroll-y, 0px) * -0.1))` }}
            ></div>

            <div className="bg-grid-pattern"></div>

            <div className="bg-text-container">
                <div
                    className="bg-text bg-text-1"
                    style={{ transform: `translateX(-10%) rotate(-5deg) translateY(calc(var(--scroll-y, 0px) * 0.08))` }}
                >
                    {t('background.untitled')}
                </div>
                <div
                    className="bg-text bg-text-2"
                    style={{ transform: `translateX(10%) rotate(3deg) translateY(calc(var(--scroll-y, 0px) * -0.05))` }}
                >
                    {t('background.charts')}
                </div>
                <div
                    className="bg-text bg-text-3"
                    style={{ transform: `translateY(calc(var(--scroll-y, 0px) * 0.12)) rotate(-2deg)` }}
                >
                    {t('background.community')}
                </div>
            </div>
        </div>
    );
}
