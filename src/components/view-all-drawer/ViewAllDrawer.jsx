'use client';
import React, { useEffect, useRef, useState } from "react";
import { X, Search } from "lucide-react";
import HomepageChartCard from "../homepage-chart-card/HomepageChartCard";
import "./ViewAllDrawer.css";
import { useLanguage } from "../../contexts/LanguageContext";

export default function ViewAllDrawer({
    isOpen,
    onClose,
    title,
    initialCharts,
    fetchType,
    apiBase,
    audioRefs,
    currentlyPlaying,
    onPlay,
    onStop
}) {
    const { t } = useLanguage();
    const drawerRef = useRef(null);
    const [charts, setCharts] = useState(initialCharts || []);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isClosing, setIsClosing] = useState(false);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);

    useEffect(() => {
        setCharts(initialCharts || []);
        setPage(1);
        setHasMore(true);
    }, [initialCharts]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
            setDragY(0);
        }, 300);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleDragStart = (e) => {
        setIsDragging(true);
        startY.current = e.clientY || e.touches?.[0]?.clientY || 0;
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
        const delta = currentY - startY.current;
        if (delta > 0) {
            setDragY(delta);
        }
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragY > 150) {
            handleClose();
        } else {
            setDragY(0);
        }
    };

    const loadMore = async () => {
        if (!fetchType || loadingMore) return;
        setLoadingMore(true);

        try {
            let url = `${apiBase}/api/charts?limit=12&page=${page}`;
            if (fetchType === 'new') {
                url += `&type=quick&sort_by=created_at&sort_order=desc`;
            } else if (fetchType === 'trending') {
                url += `&type=advanced&sort_by=decaying_likes`;
            }

            const res = await fetch(url);
            const json = await res.json();
            const base = json.asset_base_url || "";

            const newItems = (json.data || []).map(item => {
                const authorHash = item.author;
                return {
                    ...item,
                    id: item.id || item.name || "",
                    title: item.title,
                    artists: item.artists || "Unknown Artist",
                    author: item.author_full || item.author || "Unknown",
                    coverUrl: (base && item.jacket_file_hash && authorHash) ? `${base}/${authorHash}/${item.id}/${item.jacket_file_hash}` : (item.coverUrl || item.thumbnail?.url),
                    bgmUrl: (base && item.music_file_hash && authorHash) ? `${base}/${authorHash}/${item.id}/${item.music_file_hash}` : (item.bgmUrl || item.bgm?.url),
                    rating: item.rating ?? 0,
                    likes: item.likes ?? 0,
                    commentsCount: item.comments ?? 0
                };
            });

            if (newItems.length > 0) {
                setCharts(prev => [...prev, ...newItems]);
                setPage(prev => prev + 1);
            } else {
                setHasMore(false);
            }
        } catch (e) {
            console.error("Load more failed", e);
        } finally {
            setLoadingMore(false);
        }
    };

    if (!isOpen && !isClosing) return null;

    const filteredCharts = charts.filter(c => {
        const q = searchQuery.toLowerCase();
        const title = (c.title || "").toLowerCase();
        const author = (c.author || "").toLowerCase();
        const artists = (c.artists || "").toLowerCase();
        const tags = Array.isArray(c.tags) ? c.tags.map(t => typeof t === 'object' ? t.title : t).join(" ").toLowerCase() : (c.tags || "").toString().toLowerCase();

        return title.includes(q) || author.includes(q) || artists.includes(q) || tags.includes(q);
    });

    return (
        <div
            className={`drawer-backdrop ${isClosing ? "fade-out" : "fade-in"}`}
            onClick={handleBackdropClick}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
        >
            <div
                className={`drawer-container ${isClosing ? "slide-down" : "slide-up"}`}
                ref={drawerRef}
                style={{
                    transform: dragY > 0 ? `translateY(${dragY}px)` : '',
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <div className="drawer-header">
                    <div
                        className="drawer-handle"
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    ></div>
                    <div className="drawer-title-row">
                        <h2>{title}</h2>
                        <button onClick={handleClose} className="close-btn">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="drawer-search">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder={t('search.keywordsPlaceholder') || "Filter charts..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="drawer-content">
                    <div className="charts-grid-view">
                        {filteredCharts.map((chart, index) => (
                            <HomepageChartCard
                                key={`${chart.id}-${index}`}
                                chart={chart}
                                index={index}
                                showPlayButton={true}
                                onPlay={onPlay}
                                onStop={onStop}
                                isPlaying={currentlyPlaying === chart.id}
                                audioRef={(ref) => {
                                    if (audioRefs && audioRefs.current && ref) {
                                        audioRefs.current[chart.id] = ref;
                                    }
                                }}
                            />
                        ))}
                        {filteredCharts.length === 0 && (
                            <div className="no-results">
                                <p>{t('viewAll.noResults')}</p>
                            </div>
                        )}
                    </div>
                    {filteredCharts.length > 0 && hasMore && fetchType && !searchQuery && (
                        <div className="load-more-container" style={{ textAlign: 'center', marginTop: '20px', paddingBottom: '20px' }}>
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="load-more-btn"
                                style={{
                                    padding: '12px 32px',
                                    borderRadius: '25px',
                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                    background: 'rgba(56, 189, 248, 0.1)',
                                    color: '#38bdf8',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loadingMore ? t('loading') : t('viewAll.loadMore')} ({filteredCharts.length} loaded)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
