"use client";
import { Heart, User, MessageSquare, Calendar } from "lucide-react";
import { useRef, useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./HomepageChartCard.css";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import { formatRelativeTime } from "../../utils/dateUtils";
import MarqueeText from "../marquee-text/MarqueeText";

function CardVisualizer({ audioRef, isPlaying }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const lastHeights = useRef([]);

    useEffect(() => {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (!isPlaying) {
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
            lastHeights.current = [];
            return;
        }

        const audio = audioRef?.current;
        if (audio && !audio._cardAnalyser) {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const source = ctx.createMediaElementSource(audio);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                analyser.connect(ctx.destination);
                audio._cardCtx = ctx;
                audio._cardAnalyser = analyser;
            } catch (e) {
                if (audio._cardCtx?.state === "suspended") audio._cardCtx.resume().catch(() => {});
            }
        }
        if (audio?._cardCtx?.state === "suspended") audio._cardCtx.resume().catch(() => {});

        const bars = 20;
        let lastFrame = 0;

        const draw = (timestamp) => {
            if (timestamp - lastFrame < 33) { rafRef.current = requestAnimationFrame(draw); return; }
            lastFrame = timestamp;

            const c = canvas.getContext("2d");
            const w = canvas.width, h = canvas.height;
            c.clearRect(0, 0, w, h);

            const analyser = audio?._cardAnalyser;
            const bufLen = analyser?.frequencyBinCount || 16;
            const data = analyser ? new Uint8Array(bufLen) : null;
            if (analyser) analyser.getByteFrequencyData(data);

            const barW = (w / bars) - 1.5;
            let anyActive = false;

            for (let i = 0; i < bars; i++) {
                const di = Math.floor((i / bars) * (bufLen * 0.75));
                let bh = 0;
                if (data && audio && !audio.paused) {
                    bh = (data[di] / 255) * h;
                    lastHeights.current[i] = bh;
                } else if ((lastHeights.current[i] || 0) > 0) {
                    lastHeights.current[i] *= 0.78;
                    bh = lastHeights.current[i];
                }
                if (bh < 0.5) { lastHeights.current[i] = 0; continue; }
                anyActive = true;
                const x = i * (barW + 1.5);
                const g = c.createLinearGradient(0, h, 0, h - bh);
                g.addColorStop(0, "rgba(56,189,248,1)");
                g.addColorStop(1, "rgba(99,102,241,0.7)");
                c.fillStyle = g;
                c.beginPath();
                c.roundRect(x, h - bh, barW, bh, 2);
                c.fill();
            }

            if (anyActive || (audio && !audio.paused)) {
                rafRef.current = requestAnimationFrame(draw);
            } else {
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    }, [audioRef, isPlaying]);

    return <canvas ref={canvasRef} width={280} height={44} className="card-visualizer" />;
}

function AuthorPopout({ authorId, authorName, assetBaseUrl, side }) {
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        if (!authorId) return;
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        fetch(`${apiBase}/api/accounts/${authorId}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.account) {
                    setProfileData({ ...data.account, _base: data.asset_base_url || assetBaseUrl });
                }
            })
            .catch(() => {});
    }, [authorId, assetBaseUrl]);

    const base = profileData?._base || assetBaseUrl;
    const uid = profileData?.sonolus_id || authorId;
    const profileUrl = (profileData?.profile_hash && base && uid)
        ? `${base}/${uid}/profile/${profileData.profile_hash}_webp`
        : "/defpfp.webp";
    const bannerUrl = (profileData?.banner_hash && base && uid)
        ? `${base}/${uid}/banner/${profileData.banner_hash}_webp`
        : "/def.webp";

    return (
        <div className={`author-popout${side === "left" ? " author-popout-left" : ""}`}>
            <div className="author-popout-banner" style={{ backgroundImage: `url(${bannerUrl})` }}>
                <div className="author-popout-body">
                    <img src={profileUrl} alt={authorName} className="author-popout-avatar"
                        onError={(e) => { e.target.src = "/defpfp.webp"; }} />
                    <span className="author-popout-name">{authorName}</span>
                </div>
            </div>
        </div>
    );
}

export default memo(function HomepageChartCard({ chart, index = 0 }) {
    const { t, tReact } = useLanguage();
    const router = useRouter();
    const { audioRef, trackId, isPlaying, isBuffering, play, pause } = useAudioPlayer();

    const { id, title, artists, author, authorId, authorHandle, assetBaseUrl,
            rating, coverUrl, likeCount, bgmUrl, commentsCount = 0, createdAt } = chart;

    const proxiedBgmUrl = bgmUrl
        ? (bgmUrl.startsWith("http") ? `/api/audio-proxy?url=${encodeURIComponent(bgmUrl)}` : bgmUrl)
        : null;

    const isThisPlaying = trackId === id && isPlaying;
    const isThisBuffering = trackId === id && isBuffering;
    const isThisActive = trackId === id && (isPlaying || isBuffering);

    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [panelLeft, setPanelLeft] = useState(false);
    const [showAuthorPopout, setShowAuthorPopout] = useState(false);
    const cardRef = useRef(null);
    const authorTimerRef = useRef(null);

    const isMobileRef = useRef(false);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        isMobileRef.current = mq.matches || "ontouchstart" in window;
        const handler = (e) => { isMobileRef.current = e.matches || "ontouchstart" in window; };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const checkPanelSide = useCallback(() => {
        if (!cardRef.current) return;
        requestAnimationFrame(() => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            setPanelLeft(window.innerWidth - rect.right < 220);
        });
    }, []);

    const handleMouseEnter = () => { if (!isMobileRef.current) { checkPanelSide(); setIsHovered(true); } };
    const handleMouseLeave = () => { if (!isMobileRef.current) setIsHovered(false); };
    const handleCardClick = (e) => {
        if (e.target.closest("button") || e.target.closest("a")) return;
        if (isMobileRef.current) {
            if (!isFocused) { checkPanelSide(); setIsFocused(true); return; }
        }
        router.push(`/levels/UnCh-${encodeURIComponent(id)}`);
    };

    const handleAuthorEnter = () => {
        authorTimerRef.current = setTimeout(() => setShowAuthorPopout(true), 250);
    };
    const handleAuthorLeave = () => {
        clearTimeout(authorTimerRef.current);
        setShowAuthorPopout(false);
    };

    const handlePlayClick = (e) => {
        e.stopPropagation();
        if (!proxiedBgmUrl) return;
        if (isThisActive) {
            pause();
        } else {
            play(id, proxiedBgmUrl, {
                title,
                thumbnail: coverUrl,
                href: `/levels/UnCh-${encodeURIComponent(id)}`,
            });
        }
    };

    const handleCoverClick = (e) => {
        if (e.target.closest("button") || e.target.closest("a")) return;
        if (!isMobileRef.current) return;
        if (!proxiedBgmUrl) return;
        if (isThisActive) {
            pause();
        } else {
            play(id, proxiedBgmUrl, {
                title,
                thumbnail: coverUrl,
                href: `/levels/UnCh-${encodeURIComponent(id)}`,
            });
        }
    };

    const active = isHovered || isFocused || isThisActive;
    const profileSlug = (authorHandle && authorHandle !== authorId) ? authorHandle : authorId;
    const profileLink = profileSlug ? `/user/${profileSlug}` : null;

    return (
        <div
            ref={cardRef}
            className={`homepage-chart-card${isThisActive ? " playing" : ""}${active ? " hovered" : ""}`}
            style={{ "--index": index }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleCardClick}
        >
            <div className="card-inner">
                {coverUrl && <div className="card-ambience" style={{ backgroundImage: `url(${coverUrl})` }} />}

                <div className="card-image-container" onClick={handleCoverClick}>
                    {coverUrl
                        ? <img src={coverUrl} alt={title} className="card-cover" loading="eager" />
                        : <div className="card-cover placeholder"><span>{t("hero.noImage", "No Image")}</span></div>
                    }
                    <div className="level-badge">Lv. {parseFloat(Number(rating).toFixed(2))}</div>
                    <div className={`card-visualizer-container${isThisActive ? " active" : ""}`}>
                        <CardVisualizer audioRef={audioRef} isPlaying={isThisActive} />
                    </div>
                </div>

                <div className={`card-overlay${active ? " visible" : ""}`}>
                    {proxiedBgmUrl && (
                        <button
                            className={`play-btn${isThisActive ? " playing" : ""}`}
                            onClick={handlePlayClick}
                            aria-label={isThisActive ? "Pause" : "Play"}
                        >
                            {isThisBuffering ? (
                                <span className="play-btn-spinner" />
                            ) : isThisPlaying ? (
                                <span className="play-btn-pause"><span /><span /></span>
                            ) : (
                                <span className="play-btn-triangle" />
                            )}
                        </button>
                    )}
                </div>

                <div className="card-content">
                    <MarqueeText textComponent="h3" className="card-title" maxLength={20}>
                        {title}
                    </MarqueeText>
                    <div className="footer-row">
                        <User size={12} />
                        <span className="footer-label">
                            {tReact("hero.chartedBy", {
                                1: <span className="author-link-wrapper"
                                    onMouseEnter={handleAuthorEnter}
                                    onMouseLeave={handleAuthorLeave}>
                                    {profileLink
                                        ? <Link href={profileLink} className="author-link" onClick={(e) => e.stopPropagation()}>{author}</Link>
                                        : <span className="author-link">{author}</span>
                                    }
                                </span>
                            })}
                        </span>
                    </div>
                    <div className="footer-row muted">
                        <span className="truncate">{t("hero.by", { 1: artists })}</span>
                    </div>
                    <div className="card-mobile-stats">
                        <span className="mobile-stat mobile-stat-likes">
                            <Heart size={11} fill="currentColor" />
                            {likeCount}
                        </span>
                        <span className="mobile-stat mobile-stat-comments">
                            <MessageSquare size={11} />
                            {commentsCount}
                        </span>
                        <span className="mobile-stat mobile-stat-date">
                            <Calendar size={11} />
                            {formatRelativeTime(createdAt, t)}
                        </span>
                    </div>
                </div>
            </div>

            <div className={`card-stats-panel${active ? " visible" : ""}${panelLeft ? " panel-left" : ""}`}>
                <div className="stat-item stat-likes">
                    <Heart size={13} fill="currentColor" />
                    <span>{likeCount}</span>
                </div>
                <div className="stat-item stat-comments">
                    <MessageSquare size={13} />
                    <span>{commentsCount}</span>
                </div>
                <div className="stat-item stat-date">
                    <Calendar size={13} />
                    <span>{formatRelativeTime(createdAt, t)}</span>
                </div>
            </div>

            {showAuthorPopout && (
                <AuthorPopout
                    authorId={authorId}
                    authorName={author}
                    assetBaseUrl={assetBaseUrl}
                    side={panelLeft ? "left" : "right"}
                />
            )}
        </div>
    );
})
