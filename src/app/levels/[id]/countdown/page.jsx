"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, ArrowLeft, Clock, Calendar, User } from "lucide-react";
import { useLanguage } from "../../../../contexts/LanguageContext";
import "./countdown.css";

export default function CountdownPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { t } = useLanguage();
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
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/levels/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setLevel(data);
                    setAssetBaseUrl(data.asset_base_url || "");

                    if (data.status !== 'scheduled' || !data.scheduled_publish) {
                        router.replace(`/levels/${id}`);
                        return;
                    }

                    if (data.author) {
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${data.author}`)
                            .then(r => r.ok ? r.json() : null)
                            .then(d => { if (d?.account) setAuthorData(d.account); })
                            .catch(() => {});
                    }
                } else {
                    router.replace('/');
                }
            } catch (error) {
                console.error("Error fetching level:", error);
                router.replace('/');
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
                setShowConfetti(true);
                generateConfetti();
                setTimeout(() => {
                    router.replace(`/levels/${id}`);
                }, 3000);
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

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
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
    const authorHandle = authorData?.sonolus_handle || level.author;
    const authorPfpUrl = (authorData?.profile_hash && assetBaseUrl)
        ? `${assetBaseUrl}/${authorData.sonolus_id}/profile/${authorData.profile_hash}_webp`
        : "/defpfp.webp";

    return (
        <main className="countdown-page">
            <nav className="countdown-nav">
                <Link href="/" className="nav-btn home-btn">
                    <Home size={18} />
                    <span>{t('countdown.home')}</span>
                </Link>
                <Link href={`/levels/${id}`} className="nav-btn back-btn">
                    <ArrowLeft size={18} />
                    <span>{t('countdown.backToChart')}</span>
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
                    backgroundImage: `url(${level.thumbnail || "/placeholder.png"})`,
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
                            src={level.thumbnail || "/placeholder.png"}
                            alt={level.title}
                            className="countdown-jacket"
                        />
                        <div className="countdown-jacket-glow" style={{ background: dominantColor }}></div>
                    </div>

                    <div className="countdown-info">
                        <h1 className="countdown-title">{level.title}</h1>
                        <p className="countdown-artist">{level.artists}</p>

                        <Link href={`/user/${authorHandle}`} className="countdown-author">
                            <img
                                src={authorPfpUrl}
                                alt={authorName}
                                className="countdown-author-pfp"
                                onError={(e) => { e.target.src = '/defpfp.webp'; }}
                            />
                            <span className="countdown-author-name">{authorName}</span>
                        </Link>

                        <div className="countdown-schedule">
                            <Calendar size={16} />
                            <span>{t('countdown.premieres', { 1: formatDate(level.scheduled_publish) })}</span>
                        </div>
                    </div>
                </div>

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
                            <div className={`timer-unit ${countdown.seconds <= 10 ? 'pulse' : ''}`}>
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
