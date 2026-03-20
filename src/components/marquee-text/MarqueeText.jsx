import React, { useRef, useState, useEffect } from 'react';
import './MarqueeText.css';

export default function MarqueeText({ text, children, maxLength = 15, className = '', style = {}, textComponent = 'span' }) {
    const rawText = text || (typeof children === 'string' ? children : '');
    const Component = textComponent;
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                setShouldScroll(textRef.current.scrollWidth > containerRef.current.clientWidth);
            }
        };

        checkOverflow();

        const observer = new ResizeObserver(() => checkOverflow());
        if (containerRef.current) observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [rawText]);

    if (!rawText) return <>{children}</>;

    return (
        <div ref={containerRef} className={`marquee-wrapper ${className}`} style={{ width: '100%', overflow: 'hidden', position: 'relative', ...style }}>
            {shouldScroll ? (
                <div className="marquee-container" style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <div className="marquee-track" style={{ animationDuration: `${Math.max(6, rawText.length * 0.35)}s` }}>
                        {[...Array(4)].map((_, i) => (
                            <Component key={i} className="marquee-content" aria-hidden={i > 0 ? "true" : undefined}>
                                {children || text}
                            </Component>
                        ))}
                    </div>
                </div>
            ) : (
                <Component ref={textRef} style={{ whiteSpace: 'nowrap', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {children || text}
                </Component>
            )}
        </div>
    );
}
