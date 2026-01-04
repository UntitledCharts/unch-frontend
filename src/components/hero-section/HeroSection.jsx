"use client";
import { useState, useEffect } from "react";
import { Play, Heart, Info, User, Music, Calendar, MessageSquare, ArrowDown } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../contexts/LanguageContext";
import "./HeroSection.css";

export default function HeroSection({ posts = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { t } = useLanguage();

    const [commentCounts, setCommentCounts] = useState({});

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
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % posts.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [posts.length]);

    if (!posts || posts.length === 0) return null;

    const currentPost = posts[currentIndex];
    const bgImage = currentPost.backgroundV3Url || currentPost.backgroundUrl || currentPost.coverUrl || "/placeholder-bg.jpg";

    return (
        <section className="hero-section relative" aria-label="Featured Charts">
            <div className="hero-bg-container">
                {posts.map((post, index) => (
                    <div
                        key={post.id}
                        className={`hero-bg-slide ${index === currentIndex ? "active" : ""}`}
                        style={{ backgroundImage: `url(${post.backgroundV3Url || post.backgroundUrl || post.coverUrl})` }}
                    />
                ))}
                <div className="hero-overlay"></div>
            </div>

            <div className="hero-content-wrapper">
                <div className="hero-left-col animate-slide-in-left">
                    <div className="hero-jacket-container">
                        <img
                            src={currentPost.coverUrl}
                            alt={currentPost.title}
                            className="hero-jacket"
                        />
                    </div>

                    <div className="hero-main-info">
                        <div className="hero-badge">
                            <Music size={14} />
                            <span>{t('home.staffPicks')}</span>
                        </div>
                        <h1 className="hero-title">{currentPost.title}</h1>

                        {/* <div className="hero-right-col animate-slide-in-right">*/}
                            <div className="hero-description-box">
                                {currentPost.description && <p>{currentPost.description}</p>}
                            </div>
                        {/* </div>*/}

                        <div className="hero-meta mb-0!">
                            <div className="hero-meta-item">
                                <span className="hero-label flex items-center justify-center gap-1">
                                  <User size={16} />
                                  {t('hero.by')}
                                </span>
                                <span>{currentPost.artists}</span>
                            </div>
                            <div className="hero-meta-item">
                                <span className="hero-label">
                                  {t('hero.chartedBy')}
                                </span>
                                <span>{currentPost.author}</span>
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

                {/* <div className="hero-right-col animate-slide-in-right">
                    <div className="hero-description-box">
                        {currentPost.description && <p>{currentPost.description}</p>}
                    </div>
                </div>*/}

                <div className="hero-indicators">
                    {posts.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator-dot ${index === currentIndex ? "active" : ""}`}
                            onClick={() => setCurrentIndex(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-9999 py-2 px-4 rounded-full flex items-center justify-center gap-2 text-sm bg-sky-200/10 select-none">
              <ArrowDown className="size-5" />
              <span>More</span>
            </div>
        </section>
    );
}
