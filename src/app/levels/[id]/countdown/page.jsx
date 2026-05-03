"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Clock, Calendar, Eye } from "lucide-react";
import { useLanguage } from "../../../../contexts/LanguageContext";
import { useUser } from "../../../../contexts/UserContext";
import AdBanner from "../../../../components/ad-banner/AdBanner";
import "./countdown.css";

export default function CountdownPage({ params, chartStatus }) {
    const { id } = use(params);
    const router = useRouter();
    const { t, locale } = useLanguage();
    const { sonolusUser } = useUser();
    const [level, setLevel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(null);
    const [dominantColor, setDominantColor] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiPieces, setConfettiPieces] = useState([]);
    const jacketImgRef = useRef(null);
    const [authorData, setAuthorData] = useState(null);
    const [assetBaseUrl, setAssetBaseUrl] = useState("");

    useEffect(() => {
        const fetchLevel = async () => {
            try {
                const cleanId = id.replace(/^UnCh-/, '');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanId}/scheduled/`);
                if (!response.ok) {
                    router.replace(`/levels/${id}`);
                    return;
                }
                const json = await response.json();
                const d = json.data;
                const base = json.asset_base_url || "";
                setAssetBaseUrl(base);

                const buildUrl = (hash) => hash && base && d.author ? `${base}/${d.author}/${d.id}/${hash}` : null;

                setLevel({
                    ...d,
                    thumbnail: buildUrl(d.jacket_file_hash),
                    backgroundUrl: buildUrl(d.background_file_hash),
                    backgroundV3Url: buildUrl(d.background_v3_file_hash),
                });

                if (d.author) {
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${d.author}`)
                        .then(r => r.ok ? r.json() : null)
                        .then(data => { if (data?.account) setAuthorData(data.account); })
                        .catch(() => {});
                }
            } catch (error) {
                console.error("Error fetching level:", error);
                router.replace(`/levels/${id}`);
            } finally {
                setLoading(false);
            }
        };
        fetchLevel();
    }, [id, router]);

    useEffect(() => {
        if (!level?.scheduled_publish) return;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const target = new Date(level.scheduled_publish).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
                setShowConfetti(true);
                generateConfetti();
                setTimeout(() => {
                    router.refresh();
                }, 4000);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ days, hours, minutes, seconds, total: diff / 1000 });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [level, id, router]);

    useEffect(() => {
        if (!level?.thumbnail || !jacketImgRef.current) return;

        const img = jacketImgRef.current;
        img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 1;
                canvas.height = 1;
                ctx.drawImage(img, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                setDominantColor(`rgb(${r}, ${g}, ${b})`);
            } catch (e) {
                console.log("Could not extract color");
            }
        };
    }, [level?.thumbnail]);

    const generateConfetti = () => {
        const colors = ['#38bdf8', '#a855f7', '#f59e0b', '#22c55e', '#ef4444', '#ec4899'];
        const pieces = [];
        for (let i = 0; i < 100; i++) {
            pieces.push({
                id: i,
                x: Math.random() * 100,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 10 + 5,
                delay: Math.random() * 2,
                rotation: Math.random() * 360
            });
        }
        setConfettiPieces(pieces);
    };

    const tzAbbr = Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'Local';

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString(locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="countdown-page">
                <div className="countdown-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('countdown.loading')}</p>
                </div>
            </div>
        );
    }

    if (!level || !countdown) {
        return null;
    }

    const isFinalCountdown = countdown.total <= 60;
    const isCritical = countdown.total <= 10;

    const authorName = authorData?.sonolus_username || level.author_full || level.author;
    const authorHandle = authorData?.sonolus_handle || level.author_handle || level.author;
    const authorUid = authorData?.sonolus_id || level.author;
    const authorPfpUrl = (authorData?.profile_hash && assetBaseUrl)
        ? `${assetBaseUrl}/${authorUid}/profile/${authorData.profile_hash}_webp`
        : "/defpfp.webp";
    const authorBannerUrl = (authorData?.banner_hash && assetBaseUrl)
        ? `${assetBaseUrl}/${authorUid}/banner/${authorData.banner_hash}_webp`
        : "/def.webp";

    return (
        <main className="countdown-page">
            <nav className="countdown-nav">
                <Link href="/" className="nav-btn home-btn">
                    <Home size={18} />
                    <span>{t('countdown.home')}</span>
                </Link>
            </nav>

            {showConfetti && confettiPieces.map(piece => (
                <div
                    key={piece.id}
                    className="confetti-piece"
                    style={{
                        left: `${piece.x}%`,
                        backgroundColor: piece.color,
                        width: `${piece.size}px`,
                        height: `${piece.size}px`,
                        animationDelay: `${piece.delay}s`,
                        transform: `rotate(${piece.rotation}deg)`
                    }}
                />
            ))}

            <div
                className="countdown-bg"
                style={{
                    backgroundImage: `url(${level.backgroundV3Url || level.backgroundUrl || level.thumbnail || "/def.webp"})`,
                    '--dominant-color': dominantColor || '#38bdf8'
                }}
            >
                <div className="countdown-bg-overlay"></div>
            </div>

            <div className="countdown-content">
                <div className="countdown-hero">
                    <div className="countdown-jacket-wrapper">
                        <img
                            ref={jacketImgRef}
                            src={level.thumbnail || "/def.webp"}
                            alt={level.title}
                            className="countdown-jacket"
                        />
                        <div className="countdown-jacket-glow" style={{ background: dominantColor }}></div>
                    </div>

                    <div className="countdown-info">
                        <h1 className="countdown-title">{level.title}</h1>
                        <p className="countdown-artist">{level.artists}</p>
                        {level.rating !== undefined && (
                            <span className="countdown-rating">{t('levelDetail.level', { 1: level.rating })}</span>
                        )}

                        <Link href={`/user/${authorHandle}`} className="countdown-author" style={{ backgroundImage: `url(${authorBannerUrl})` }}>
                            <div className="countdown-author-overlay" />
                            <img
                                src={authorPfpUrl}
                                alt={authorName}
                                className="countdown-author-pfp"
                                onError={(e) => { e.target.src = '/defpfp.webp'; }}
                            />
                            <div className="countdown-author-text">
                                <span className="countdown-author-name">{authorName}</span>
                                <span className="countdown-author-handle">#{authorHandle}</span>
                            </div>
                        </Link>

                        <div className="countdown-schedule">
                            <Calendar size={16} />
                            <span>{t('countdown.premieres', { 1: formatDate(level.scheduled_publish) })}</span>
                            <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 6, padding: '2px 8px', fontWeight: 600, marginLeft: 4 }}>{tzAbbr}</span>
                        </div>

                        {(chartStatus === 'UNLISTED' || sonolusUser?.sonolus_id === level.author || sonolusUser?.isMod || sonolusUser?.isAdmin) && (
                            <Link href={`/levels/${id}?is_preview=true`} className="countdown-preview-btn">
                                <Eye size={16} />
                                <span>{t('countdown.previewChart', 'Preview Chart Page')}</span>
                            </Link>
                        )}
                    </div>
                </div>

                <AdBanner style={{ margin: '24px 0' }} />

                <div className="countdown-timer-section">
                    <div className="timer-label">
                        <Clock size={18} />
                        <span>{t('countdown.countdownLabel')}</span>
                    </div>

                    {isFinalCountdown ? (
                        <div className="final-countdown">
                            <div className={`final-number ${isCritical ? 'critical' : ''}`}>
                                {countdown.seconds}
                            </div>
                            <p className={`final-message ${isCritical ? 'critical' : ''}`}>
                                {isCritical ? t('countdown.getReady') : t('countdown.almostThere')}
                            </p>
                        </div>
                    ) : (
                        <div className="countdown-timer">
                            {countdown.days > 0 && (
                                <div className="timer-unit">
                                    <span className="timer-value">{countdown.days}</span>
                                    <span className="timer-label-text">{t('countdown.days')}</span>
                                </div>
                            )}
                            {(countdown.days > 0 || countdown.hours > 0) && (
                                <div className="timer-unit">
                                    <span className="timer-value">{countdown.hours.toString().padStart(2, '0')}</span>
                                    <span className="timer-label-text">{t('countdown.hours')}</span>
                                </div>
                            )}
                            <div className="timer-unit">
                                <span className="timer-value">{countdown.minutes.toString().padStart(2, '0')}</span>
                                <span className="timer-label-text">{t('countdown.mins')}</span>
                            </div>
                            <div className={`timer-unit ${countdown.total <= 10 ? 'pulse' : ''}`}>
                                <span className="timer-value">{countdown.seconds.toString().padStart(2, '0')}</span>
                                <span className="timer-label-text">{t('countdown.secs')}</span>
                            </div>
                        </div>
                    )}
                </div>

                <p className="countdown-footer-msg">
                    {t('countdown.footerMsg')}
                </p>
            </div>
        </main>
    );
}
