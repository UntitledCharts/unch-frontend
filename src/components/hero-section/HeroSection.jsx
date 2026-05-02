"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Play, Heart, Info, User, Music, Calendar, MessageSquare, ArrowDown } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../contexts/LanguageContext";
import MarqueeText from "../marquee-text/MarqueeText";
import "./HeroSection.css";

function HeroAuthorPopout({ data, anchorRect }) {
    const base = data._base;
    const uid = data.sonolus_id;
    const profileUrl = (data.profile_hash && base && uid)
        ? `${base}/${uid}/profile/${data.profile_hash}_webp`
        : '/defpfp.webp';
    const bannerUrl = (data.banner_hash && base && uid)
        ? `${base}/${uid}/banner/${data.banner_hash}_webp`
        : '/def.webp';

    const style = anchorRect ? {
        position: 'fixed',
        bottom: `${window.innerHeight - anchorRect.top + 8}px`,
        left: `${anchorRect.left}px`,
    } : { position: 'fixed', bottom: '50%', left: '50%' };

    return (
        <div style={{
            ...style,
            width: '200px',
            background: 'rgba(8,12,24,0.96)',
            border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: '14px',
            overflow: 'hidden',
            zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            pointerEvents: 'none',
            animation: 'popout-in 0.2s cubic-bezier(0.4,0,0.2,1) forwards',
        }}>
            <div style={{
                width: '100%', height: '70px',
                backgroundImage: `url(${bannerUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                backgroundColor: 'rgba(56,189,248,0.08)',
                position: 'relative',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px',
                    background: 'linear-gradient(to right, rgba(8,12,24,0.7) 0%, rgba(8,12,24,0.3) 100%)',
                }}>
                    <img src={profileUrl} alt={data.sonolus_username}
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.5)', objectFit: 'cover', flexShrink: 0 }}
                        onError={(e) => { e.target.src = '/defpfp.webp'; }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                        {data.sonolus_username || data.sonolus_id}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function HeroSection({ posts = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { t, tReact } = useLanguage();
    const [commentCounts, setCommentCounts] = useState({});
    const [showAuthorPopout, setShowAuthorPopout] = useState(false);
    const [authorPopoutData, setAuthorPopoutData] = useState(null);
    const [authorAnchorRect, setAuthorAnchorRect] = useState(null);
    const authorTimerRef = useRef(null);
    const authorAnchorRef = useRef(null);
    const touchStartX = useRef(null);
    const intervalRef = useRef(null);

    const SLIDE_DURATION = 6000;

    const goTo = (index) => {
        setCurrentIndex(index);
        setShowAuthorPopout(false);
        setAuthorPopoutData(null);
        setProgress(0);
    };

    const goNext = () => goTo((currentIndex + 1) % posts.length);
    const goPrev = () => goTo((currentIndex - 1 + posts.length) % posts.length);

    const handleAuthorEnter = (post) => {
        clearTimeout(authorTimerRef.current);
        setShowAuthorPopout(false);
        setAuthorPopoutData(null);

        authorTimerRef.current = setTimeout(async () => {
            const authorId = post.authorId || post.author;
            if (!authorId) return;
            if (authorAnchorRef.current) {
                setAuthorAnchorRect(authorAnchorRef.current.getBoundingClientRect());
            }
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL;
                const res = await fetch(`${apiBase}/api/accounts/${authorId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.account) {
                        setAuthorPopoutData({ ...data.account, _base: data.asset_base_url || post.assetBaseUrl || '' });
                        setShowAuthorPopout(true);
                    }
                }
            } catch (e) {}
        }, 100);
    };

    const handleAuthorLeave = () => {
        clearTimeout(authorTimerRef.current);
        setShowAuthorPopout(false);
        setAuthorPopoutData(null);
    };

    useEffect(() => {
        if (!posts || posts.length === 0) return;

        const fetchCounts = async () => {
            const counts = {};
            const apiBase = process.env.NEXT_PUBLIC_API_URL;

            await Promise.all(posts.map(async (post) => {
                try {
                    const cleanId = post.id.toString().replace('UnCh-', '');
                    const res = await fetch(`${apiBase}/api/charts/${cleanId}/comment`);
                    if (res.ok) {
                        const data = await res.json();
                        const list = Array.isArray(data) ? data : (data.data || []);
                        counts[post.id] = list.length;
                    }
                } catch (e) {
                }
            }));
            setCommentCounts(prev => ({ ...prev, ...counts }));
        };

        fetchCounts();
    }, [posts]);

    
    useEffect(() => {
        if (posts.length <= 1) return;

        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % posts.length);
            setShowAuthorPopout(false);
            setAuthorPopoutData(null);
        }, SLIDE_DURATION);

        return () => {
            clearInterval(intervalRef.current);
        };
    }, [currentIndex, posts.length]);

    if (!posts || posts.length === 0) return null;

    const currentPost = posts[currentIndex];

    const getValidUrl = (url) => {
        if (!url) return "/def.webp";
        return url;
    };

    return (
    <>
        <section
            className="hero-section relative"
            aria-label="Featured Charts"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStartX.current;
                if (Math.abs(dx) > 50) dx < 0 ? goNext() : goPrev();
                touchStartX.current = null;
            }}
            onMouseDown={(e) => { touchStartX.current = e.clientX; }}
            onMouseUp={(e) => {
                if (touchStartX.current === null) return;
                const dx = e.clientX - touchStartX.current;
                if (Math.abs(dx) > 80) dx < 0 ? goNext() : goPrev();
                touchStartX.current = null;
            }}
        >
            <div className="hero-bg-container">
                {posts.map((post, index) => {
                    const imgUrl = getValidUrl(post.backgroundV3Url || post.backgroundUrl || post.coverUrl);
                    const isActive = index === currentIndex;
                    return (
                        <img
                            key={post.id}
                            src={imgUrl}
                            alt=""
                            aria-hidden="true"
                            className={`hero-bg-slide ${isActive ? "active" : ""}`}
                            loading={index === 0 ? "eager" : "lazy"}
                            fetchPriority={index === 0 ? "high" : "low"}
                            decoding={index === 0 ? "sync" : "async"}
                            onError={(e) => { e.target.src = "/def.webp"; }}
                        />
                    );
                })}
                <div className="hero-overlay"></div>
            </div>

            <div className="hero-content-wrapper">
                <div className="hero-left-col animate-slide-in-left">
                    <div className="hero-jacket-container">
                        <img
                            src={getValidUrl(currentPost.coverUrl)}
                            alt={currentPost.title}
                            className="hero-jacket"
                            loading="eager"
                            fetchPriority="high"
                            onError={(e) => { e.target.src = "/def.webp"; }}
                        />
                    </div>

                    <div className="hero-main-info">
                        <div className="hero-badge">
                            <Music size={14} />
                            <span>{t('home.staffPicks')}</span>
                        </div>
                        <div style={{ width: '100%', overflow: 'hidden' }}>
                            <h1 className="hero-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                                {currentPost.title}
                            </h1>
                        </div>

                        <div className="hero-description-box">
                            {currentPost.description && <p>{currentPost.description}</p>}
                        </div>

                        <div className="hero-meta mb-0!">
                            <div className="hero-meta-item">
                                <span className="hero-label flex items-center justify-center gap-1">
                                    <User size={16} />
                                </span>
                                <span>{t('hero.by', { 1: currentPost.artists })}</span>
                            </div>
                            <div className="hero-meta-item">
                                {tReact('hero.chartedBy', {
                                    1: <span
                                        ref={authorAnchorRef}
                                        className="hero-author-wrapper"
                                        onMouseEnter={() => handleAuthorEnter(currentPost)}
                                        onMouseLeave={handleAuthorLeave}
                                        style={{ position: 'relative', display: 'inline-block' }}
                                    >
                                        <Link
                                            href={`/user/${currentPost.authorHandle || currentPost.authorId || currentPost.author}`}
                                            className="hero-author-link"
                                            style={{ color: '#38bdf8', textDecoration: 'none' }}
                                        >
                                            {currentPost.author}
                                        </Link>
                                    </span>
                                })}
                            </div>
                        </div>
                        <div className="hero-meta">
                            <div className="hero-meta-item">
                                <Heart size={16} className="text-red-400" style={{ color: '#f87171' }} />
                                <span>{currentPost.likeCount || 0}</span>
                            </div>
                            <div className="hero-meta-item">
                                <MessageSquare size={16} className="text-blue-400" style={{ color: '#60a5fa' }} />
                                <span>{commentCounts[currentPost.id] !== undefined ? commentCounts[currentPost.id] : (currentPost.commentsCount || 0)}</span>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <Link href={`/levels/UnCh-${currentPost.id}`} className="btn-primary">
                                <Info size={18} />
                                <span>{t('hero.viewDetails')}</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="hero-indicators" aria-hidden="true">
                    {posts.map((_, index) => (
                        <div
                            key={index}
                            className={`indicator-dot ${index === currentIndex ? "active" : ""}`}
                        >
                            {index === currentIndex && (
                                <span
                                    key={currentIndex}
                                    className="indicator-progress"
                                    style={{ animation: `indicatorFill ${SLIDE_DURATION}ms linear forwards` }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <button
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 py-2 px-5 rounded-full flex items-center justify-center gap-2 text-base bg-sky-200/10 select-none cursor-pointer border-none text-white font-medium"
                onClick={() => {
                    const hero = document.querySelector('.hero-section');
                    if (hero) {
                        const next = hero.nextElementSibling;
                        if (next) next.scrollIntoView({ behavior: 'smooth' });
                    }
                }}
            >
                <ArrowDown className="size-5" />
                <span>{t('hero.more')}</span>
            </button>
        </section>

        {showAuthorPopout && authorPopoutData && typeof document !== 'undefined' &&
            createPortal(
                <HeroAuthorPopout data={authorPopoutData} anchorRect={authorAnchorRect} />,
                document.body
            )
        }
    </>
    );
}
