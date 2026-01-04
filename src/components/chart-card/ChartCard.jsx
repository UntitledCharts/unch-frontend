"use client";
import { useLanguage } from "../../contexts/LanguageContext";

import { Heart, Calendar, MessageSquare } from 'lucide-react';

export default function ChartCard({
    chart,
    index = 0,
    showPlayButton = false,
    onPlay,
    isPlaying = false,
    audioRef 
}) {
    const { t } = useLanguage();
    const {
        id,
        title,
        artists,
        author,
        rating,
        coverUrl,
        likeCount,
        bgmUrl,
        createdAt
    } = chart;

    const localAudioRef = useRef(null);

    useEffect(() => {
        if (audioRef && localAudioRef.current) {
            audioRef(localAudioRef.current);
        }
    }, [audioRef]);

    useEffect(() => {
        if (localAudioRef.current) {
            if (isPlaying) {
                localAudioRef.current.play().catch(e => console.error("Audio play error", e));
            } else {
                localAudioRef.current.pause();
                localAudioRef.current.currentTime = 0;
            }
        }
    }, [isPlaying]);

    
    const truncate = (str, len) => {
        if (!str) return "";
        return str.length > len ? str.substring(0, len) + "..." : str;
    };

    

    
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days}d ago`;
        if (days < 30) return `${Math.floor(days / 7)}w ago`;
        return date.toLocaleDateString();
    };

    return (
        <Link
            href={`/levels/UnCh-${encodeURIComponent(id)}`}
            className="chart-card animate-fade-in-up"
            style={{ "--index": index }}
        >
            {}
            <div className="chart-card-cover">
                <img
                    src={coverUrl || "/placeholder-cover.png"}
                    alt={title}
                    loading="lazy"
                />
                {}
                <div className="chart-card-overlay">
                    {showPlayButton && (
                        <button
                            className={`chart-card-play ${isPlaying ? "playing" : ""}`}
                            onClick={(e) => {
                                e.preventDefault();
                                onPlay(id);
                            }}
                        >
                            {isPlaying ? "❚❚" : "▶"}
                        </button>
                    )}
                    <div className="chart-card-play-hint">View Details</div>
                </div>
            </div>

            {bgmUrl && <audio ref={localAudioRef} src={bgmUrl} loop />}

            {}
            <div className="chart-card-content">
                <h3 className="chart-card-title" title={title}>
                    {truncate(title, 20)}
                </h3>
                <p className="chart-card-artist" title={artists}>
                    {truncate(artists, 25)}
                </p>

                <div className="chart-card-meta">
                    <span className="chart-card-level">
                        Lv.{rating}
                    </span>
                    {likeCount !== undefined && (
                        <span className="chart-card-likes">
                            <Heart size={12} />
                            {likeCount}
                        </span>
                    )}
                    {(chart.commentsCount !== undefined) && (
                        <span className="chart-card-likes" style={{ color: 'var(--foreground-muted)' }}>
                            <MessageSquare size={12} />
                            {chart.commentsCount}
                        </span>
                    )}
                </div>

                <div className="chart-card-footer">
                    <span className="chart-card-author" title={author}>
                        {t('hero.by')} {truncate(author, 12)}
                    </span>
                    {createdAt && (
                        <span className="chart-card-date">
                            <Calendar size={12} style={{ marginRight: '4px' }} />
                            {formatDate(createdAt)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
