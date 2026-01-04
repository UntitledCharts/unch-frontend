"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChartCard from "../chart-card/ChartCard";
import SectionHeader from "../section-header/SectionHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import "./TrendingCarousel.css";

export default function TrendingCarousel({
    title,
    icon = null,
    charts = [],
    loading = false,
    linkHref,
    onPlay,
    currentlyPlaying,
    audioRefs,
    CardComponent,
    onStop,
    onViewAll
}) {
    const { t } = useLanguage();
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) {
            el.addEventListener("scroll", checkScroll);
            return () => el.removeEventListener("scroll", checkScroll);
        }
    }, [charts]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const cardWidth = 300;
            const scrollAmount = cardWidth * 3;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            });
        }
    };

    if (loading) {
        return (
            <section className="carousel-section">
                <SectionHeader icon={icon} title={title} linkHref={linkHref} />
                <div className="carousel-container">
                    <div className="carousel-scroll">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="carousel-skeleton animate-shimmer" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (charts.length === 0) {
        return null;
    }

    return (
        <section className="carousel-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <SectionHeader
                    icon={icon}
                    title={title}
                    linkHref={linkHref}
                    count={charts.length > 10 ? charts.length : undefined}
                />
                {onViewAll && (
                    <button onClick={onViewAll} className="view-all-text-btn" style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                        {t('home.viewAll')}
                    </button>
                )}
            </div>

            <div className="carousel-container">
                <button
                    className={`carousel-arrow carousel-arrow-left ${!canScrollLeft ? 'hidden' : ''}`}
                    onClick={() => scroll("left")}
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="carousel-scroll" ref={scrollRef}>
                    {charts.map((chart, index) => {
                        const Card = CardComponent || ChartCard;
                        return (
                            <Card
                                key={chart.id}
                                chart={chart}
                                index={index}
                                showPlayButton={true}
                                onPlay={onPlay}
                                onStop={onStop}
                                isPlaying={currentlyPlaying === chart.id}
                                audioRef={(ref) => {
                                    if (audioRefs && audioRefs.current) {
                                        audioRefs.current[chart.id] = ref;
                                    }
                                }}
                            />
                        );
                    })}
                </div>

                <button
                    className={`carousel-arrow carousel-arrow-right ${!canScrollRight ? 'hidden' : ''}`}
                    onClick={() => scroll("right")}
                    aria-label="Scroll right"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </section>
    );
}
