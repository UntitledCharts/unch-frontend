"use client";
import { Heart, Music, User, Play, Pause, MessageSquare, Calendar } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./HomepageChartCard.css";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatRelativeTime } from "../../utils/dateUtils";

export default function HomepageChartCard({
    chart,
    index = 0,
    showPlayButton = true,
    onPlay,
    onStop,
    isPlaying = false,
    audioRef
}) {
    const { t } = useLanguage();
    const router = useRouter();
    const {
        id,
        title,
        artists,
        author,
        rating,
        coverUrl,
        likeCount,
        bgmUrl,
        backgroundUrl,
        backgroundV3Url,
        commentsCount: initialCommentsCount,
        createdAt
    } = chart;

    const [isMobile, setIsMobile] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const localAudioRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia("(max-width: 768px)").matches || 'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (audioRef && localAudioRef.current) {
            audioRef(localAudioRef.current);
        }
    }, [audioRef]);

    useEffect(() => {
        if (localAudioRef.current) {
            if (isPlaying) {
                localAudioRef.current.play().catch(e => { });
            } else {
                localAudioRef.current.pause();
                localAudioRef.current.currentTime = 0;
            }
        }
    }, [isPlaying]);

    // usage of initialCommentsCount is enough, no need to fetch individually to avoid N+1 problem
    const commentsCount = initialCommentsCount || 0;

    const handleMouseEnter = () => {
        if (isMobile) return;
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        if (isMobile) return;
        setIsHovered(false);
    };

    const handleCardClick = (e) => {
        if (e.target.closest('button')) return;

        if (isMobile) {
            if (!isFocused) {
                setIsFocused(true);
            } else {
                router.push(`/levels/UnCh-${encodeURIComponent(id)}`);
            }
        } else {
            router.push(`/levels/UnCh-${encodeURIComponent(id)}`);
        }
    };

    const bgImage = backgroundUrl || backgroundV3Url || coverUrl || "/placeholder.jpg";

    return (
        <div
            className={`homepage-chart-card animate-fade-in-up ${isPlaying ? 'playing' : ''}`}
            style={{ "--index": index, cursor: 'pointer' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleCardClick}
        >
            <div
                className={`card-bg-blur ${isHovered || isFocused ? 'hovered' : ''}`}
                style={{
                    backgroundImage: `url(${bgImage})`
                }}
            />

            <div className="card-image-container">
                <div className="card-image-wrapper">
                    {coverUrl ? (
                        <div className="disc-wrapper">
                            <img src={coverUrl} alt={title} className="card-cover" loading="lazy" />
                            <div className="disc-center-hole"></div>
                        </div>
                    ) : (
                        <div className="card-cover placeholder">
                            <span>{t('hero.noImage', 'No Image')}</span>
                        </div>
                    )}
                </div>

                <div className={`card-overlay ${isHovered || isFocused ? 'visible' : ''}`}>
                    <button
                        className={`play-btn ${isPlaying ? "playing" : ""}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isPlaying && onStop) onStop(id);
                            else if (onPlay) onPlay(id, bgmUrl);
                        }}
                        style={{ position: 'relative', zIndex: 50 }}
                    >
                        {isPlaying ? <Pause size={24} className="text-blue-500" /> : <Play size={24} className="text-blue-500" />}
                    </button>
                </div>

                <div className="level-badge">{t('card.level', { 1: rating })}</div>
            </div>

            <div className="card-content">
                <div className="card-title-wrapper">
                    <h3 className="card-title" title={title}>{title}</h3>
                </div>



                <div className="card-footer-vertical">
                    <div className="footer-row artists">
                        <Music size={14} />
                        <span className="info-artists" title={artists}>{t('hero.by')}: {artists}</span>
                    </div>
                    <div className="footer-row date">
                        <Calendar size={14} />
                        <span className="relative-date">{formatRelativeTime(createdAt, t)}</span>
                    </div>
                    <div className="footer-row author">
                        <User size={14} />
                        <span className="author-name truncate">{t('hero.chartedBy')}: {author}</span>
                    </div>

                    <div className="footer-stats-row">
                        <div className="likes-info">
                            <Heart size={14} className={likeCount > 0 ? "text-red-400 fill-current" : ""} />
                            <span>{likeCount}</span>
                        </div>
                        <div className="likes-info">
                            <MessageSquare size={14} className="text-blue-400" />
                            <span>{commentsCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
