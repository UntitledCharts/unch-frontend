'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from "../../contexts/LanguageContext";
import './BackgroundDecorations.css';

export default function BackgroundDecorations() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [scrollY, setScrollY] = useState(0);
    const [shapes, setShapes] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const newShapes = Array.from({ length: 40 }).map((_, i) => ({
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
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!mounted || pathname !== '/') return null;

    return (
        <div className="bg-decorations-container">
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
                        transform: `translateY(${scrollY * shape.parallaxSpeed}px) rotate(${shape.rotation})`
                    }}
                />
            ))}

            <div
                className="bg-shape bg-large-circle"
                style={{ transform: `translateY(${scrollY * 0.15}px)` }}
            ></div>
            <div
                className="bg-shape bg-large-triangle"
                style={{ transform: `translateY(${scrollY * -0.1}px)` }}
            ></div>

            <div className="bg-grid-pattern"></div>

            <div className="bg-text-container">
                <div
                    className="bg-text bg-text-1"
                    style={{ transform: `translateX(-10%) rotate(-5deg) translateY(${scrollY * 0.08}px)` }}
                >
                    {t('background.untitled')}
                </div>
                <div
                    className="bg-text bg-text-2"
                    style={{ transform: `translateX(10%) rotate(3deg) translateY(${scrollY * -0.05}px)` }}
                >
                    {t('background.charts')}
                </div>
                <div
                    className="bg-text bg-text-3"
                    style={{ transform: `translateY(${scrollY * 0.12}px) rotate(-2deg)` }}
                >
                    {t('background.community')}
                </div>
            </div>
        </div>
    );
}
