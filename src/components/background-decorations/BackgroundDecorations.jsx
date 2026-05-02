'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from "../../contexts/LanguageContext";
import './BackgroundDecorations.css';

const SHAPES = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    type: ['circle', 'triangle', 'square', 'cross', 'circle', 'square', 'triangle'][i % 7],
    size: (8 + (i * 13) % 32) + 'px',
    left: ((i * 6.5 + 3) % 96) + '%',
    top: ((i * 7.3 + 5) % 96) + '%',
    delay: ((i * 0.28) % 5) + 's',
    duration: (18 + (i * 0.9) % 14) + 's',
    parallaxSpeed: (((i % 7) - 3) * 0.08),
    rotation: ((i * 31) % 360) + 'deg',
}));

export default function BackgroundDecorations() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const containerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        setIsMobile(mq.matches);
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        if (isMobile) return;

        let rafId;
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                rafId = requestAnimationFrame(() => {
                    if (containerRef.current) {
                        containerRef.current.style.setProperty('--scroll-y', `${window.scrollY}px`);
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
    }, [isMobile]);

    const showDecorations = pathname === '/';

    const shapeElements = useMemo(() => {
        if (isMobile || !showDecorations) return null;
        return SHAPES.map((shape) => (
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
        ));
    }, [isMobile, showDecorations]);

    return (
        <div className="bg-decorations-container" ref={containerRef}>
            <div className="bg-grid-pattern" />

            {showDecorations && (
                <>
                    {shapeElements}

                    {!isMobile && (
                        <>
                            <div
                                className="bg-shape bg-large-circle"
                                style={{ transform: `translateY(calc(var(--scroll-y, 0px) * 0.15)) rotate(calc(var(--scroll-y, 0px) * 0.05deg))` }}
                            />
                            <div
                                className="bg-shape bg-large-triangle"
                                style={{ transform: `translateY(calc(var(--scroll-y, 0px) * -0.1))` }}
                            />
                        </>
                    )}

                    <div className="bg-text-container" aria-hidden="true">
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
                </>
            )}
        </div>
    );
}
