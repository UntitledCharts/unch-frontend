"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Heart,
    Play,
    Pause,
    Music,
    Award,
    BarChart3,
    Crown,
    Shield,
    AlertCircle,
    MessageSquare,
    ArrowLeft,
    Star,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import "./page.css";

const DEFAULT_PFP = "https://yt3.googleusercontent.com/kyRX8fESnlAo8xoThhWanH8geyT_U6JIOgTAOU8D1PfzMXl_BW95y06R_sGNKosi_E2arwN9=s160-c-k-c0x00ffffff-no-rj";

import FormattedText from "../../../components/formatted-text/FormattedText";
import { customProfiles } from "../../../data/customProfiles";

export default function UserProfile({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { t } = useLanguage();
    const [account, setAccount] = useState(null);
    const [charts, setCharts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    const [assetBaseUrl, setAssetBaseUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentCounts, setCommentCounts] = useState({});
    const [playingId, setPlayingId] = useState(null);
    const audioRef = useRef(null);

    // Fetch account data from API
    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${id}`);
                if (!response.ok) {
                    throw new Error("Account not found");
                }
                const data = await response.json();
                setAccount(data.account);
                setCharts(data.charts || []);
                setAssetBaseUrl(data.asset_base_url || "");
            } catch (err) {
                console.error("Error fetching account:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAccount();
        }
    }, [id]);

    // Fetch comment counts for charts
    useEffect(() => {
        if (!charts || charts.length === 0) return;

        const fetchCounts = async () => {
            const counts = {};
            const apiBase = process.env.NEXT_PUBLIC_API_URL;

            await Promise.all(charts.map(async (chart) => {
                try {
                    const chartId = chart.id?.toString().replace('UnCh-', '') || chart.name?.replace('UnCh-', '');
                    if (!chartId) return;
                    const res = await fetch(`${apiBase}/api/charts/${chartId}/comment`);
                    if (res.ok) {
                        const data = await res.json();
                        const list = Array.isArray(data) ? data : (data.data || []);
                        counts[chart.id || chart.name] = list.length;
                    }
                } catch (e) { }
            }));
            setCommentCounts(counts);
        };

        fetchCounts();
    }, [charts]);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    // Calculate stats from charts
    const stats = {
        totalCharts: charts.length,
        totalLikes: charts.reduce((sum, c) => sum + (c.likes || c.like_count || 0), 0),
        totalComments: Object.values(commentCounts).reduce((sum, c) => sum + c, 0),
    };

    // Get chart thumbnail URL
    const getChartThumbnail = (chart) => {
        if (chart.thumbnail) return chart.thumbnail;
        if (chart.cover?.url) return chart.cover.url;
        if (assetBaseUrl && chart.author && chart.id) {
            const jacketHash = chart.jacket_file_hash || (chart.cover && chart.cover.hash);
            if (jacketHash) {
                return `${assetBaseUrl}/${chart.author}/${chart.id}/${jacketHash}`;
            }
        }
        return "/placeholder.png";
    };

    // Get chart music URL
    const getChartMusicUrl = (chart) => {
        if (assetBaseUrl && chart.author && chart.id) {
            const musicHash = chart.music_hash || chart.music_file_hash || (chart.bgm && chart.bgm.hash);
            if (musicHash) {
                return `${assetBaseUrl}/${chart.author}/${chart.id}/${musicHash}`;
            }
        }
        return null;
    };

    const handleBack = () => {
        router.back();
    };

    const handlePlayPause = (e, chart) => {
        e.preventDefault();
        e.stopPropagation();

        const chartKey = chart.id || chart.name;
        const musicUrl = getChartMusicUrl(chart);

        if (!musicUrl) return;

        if (playingId === chartKey) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(musicUrl);
            audioRef.current.volume = 0.5;
            audioRef.current.play().catch(() => { });
            audioRef.current.onended = () => setPlayingId(null);
            setPlayingId(chartKey);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Check if user has any special roles
    const hasCharts = charts.length > 0;

    // Custom Profile Logic
    const customProfile = account ? (customProfiles[account.id] || customProfiles[account.sonolus_id] || customProfiles[id]) : null;

    // Pagination Logic
    const totalPages = Math.ceil(charts.length / ITEMS_PER_PAGE);
    const displayedCharts = charts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Optional: Scroll to top of charts list
            // document.querySelector('.section-header')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-container">
                    <div className="profile-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading profile...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !account) {
        return (
            <main className="profile-page">
                <div className="profile-container">
                    <div className="profile-error">
                        <AlertCircle size={48} />
                        <h2>User Not Found</h2>
                        <p>{error || "This user profile doesn't exist."}</p>
                        <Link href="/" className="back-home-btn">Back to Home</Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="profile-page">
            {/* Custom Background Blur if Banner exists */}
            {customProfile?.banner && (
                <div
                    className="profile-bg-blur"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${customProfile.banner})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(40px) brightness(0.4)',
                        opacity: 0.6,
                        zIndex: 0,
                        pointerEvents: 'none'
                    }}
                />
            )}
            <div className="profile-container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Back Button */}
                <button className="back-btn" onClick={handleBack}>
                    <ArrowLeft size={18} />
                    <span>{t('userProfile.back', 'Back')}</span>
                </button>

                <div className={`profile-layout ${!hasCharts ? 'no-charts' : ''}`}>
                    {/* Main Content */}
                    <div className="profile-main">
                        {/* Profile Card */}
                        <div className="profile-card">
                            {/* Cover */}
                            <div className="profile-cover">
                                <img src={customProfile?.banner || "/def.webp"} alt="" className="cover-image" />
                                <div className="cover-overlay"></div>
                            </div>

                            {/* Profile Header */}
                            <div className="profile-header">
                                <div className="avatar-wrapper">
                                    <img
                                        src={customProfile?.pfp || DEFAULT_PFP}
                                        alt={account.sonolus_username}
                                        className="profile-avatar"
                                    />
                                    {account.owner && (
                                        <div className="avatar-badge owner"><Star size={12} /></div>
                                    )}
                                    {account.admin && !account.owner && (
                                        <div className="avatar-badge admin"><Crown size={12} /></div>
                                    )}
                                    {account.mod && !account.admin && !account.owner && (
                                        <div className="avatar-badge mod"><Shield size={12} /></div>
                                    )}
                                </div>

                                <div className="profile-info">
                                    <div className="name-line">
                                        <h1><FormattedText text={account.sonolus_username} /></h1>
                                        {account.owner && <span className="role owner">{t('userProfile.owner', 'Owner')}</span>}
                                        {account.admin && <span className="role admin">{t('userProfile.admin', 'Admin')}</span>}
                                        {account.mod && <span className="role mod">{t('userProfile.mod', 'Mod')}</span>}
                                    </div>
                                    <p className="handle">#{account.sonolus_handle}</p>

                                    {/* Custom Bio */}
                                    {customProfile?.bio && (
                                        <div className="profile-bio" style={{ marginTop: '12px', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                            <FormattedText text={customProfile.bio} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Badges */}
                            {(account.owner || account.admin || account.mod) && (
                                <div className="badges-section">
                                    {account.owner && (
                                        <div className="badge-card owner">
                                            <Star size={18} />
                                            <span>{t('userProfile.owner', 'Owner')}</span>
                                        </div>
                                    )}
                                    {account.admin && (
                                        <div className="badge-card admin">
                                            <Crown size={18} />
                                            <span>{t('userProfile.administrator', 'Administrator')}</span>
                                        </div>
                                    )}
                                    {account.mod && (
                                        <div className="badge-card mod">
                                            <Shield size={18} />
                                            <span>{t('userProfile.moderator', 'Moderator')}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Charts Section */}
                        <div className="section">
                            <div className="section-header">
                                <h2>
                                    <Music size={20} />
                                    {t('userProfile.charts', 'Popular Charts')}
                                </h2>
                                {hasCharts && <span className="count">{charts.length}</span>}
                            </div>

                            {!hasCharts ? (
                                <div className="empty-state">
                                    <Music size={48} />
                                    <p>{t('userProfile.noCharts', "This User hasn't made any charts yet :<")}</p>
                                </div>
                            ) : (
                                <div className="chart-list">
                                    {displayedCharts.map((chart, index) => {
                                        const chartKey = chart.id || chart.name;
                                        const isPlaying = playingId === chartKey;
                                        const musicUrl = getChartMusicUrl(chart);

                                        return (
                                            <Link
                                                key={chartKey || index}
                                                href={`/levels/${chart.name || `UnCh-${chart.id}`}`}
                                                className="chart-card"
                                            >
                                                {/* Cover Art */}
                                                <div className="chart-cover">
                                                    <img src={getChartThumbnail(chart)} alt={chart.title} />

                                                    {musicUrl && (
                                                        <button
                                                            className={`play-btn ${isPlaying ? 'playing' : ''}`}
                                                            onClick={(e) => handlePlayPause(e, chart)}
                                                        >
                                                            {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Chart Info */}
                                                <div className="chart-info">
                                                    <h3 className="chart-title">{chart.title}</h3>
                                                    <p className="chart-artist"><FormattedText text={chart.artists} /></p>

                                                    <div className="chart-meta">
                                                        <span className="meta-stat">
                                                            <Heart size={14} />
                                                            {formatNumber(chart.likes || chart.like_count || 0)}
                                                        </span>
                                                        <span className="meta-stat">
                                                            <MessageSquare size={14} />
                                                            {commentCounts[chartKey] || 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Level Badge */}
                                                <div className="chart-level">
                                                    <span className="level-badge">Lv. {chart.rating || "?"}</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls" style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '16px',
                                    marginTop: '20px'
                                }}>
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: currentPage === 1 ? 'rgba(255, 255, 255, 0.3)' : 'white',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    <span style={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '0.9rem',
                                        fontWeight: 600
                                    }}>
                                        {currentPage} / {totalPages}
                                    </span>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: currentPage === totalPages ? 'rgba(255, 255, 255, 0.3)' : 'white',
                                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Stats - Only show if user has charts */}
                    {hasCharts && (
                        <aside className="profile-sidebar">
                            <div className="sidebar-section">
                                <h3>
                                    <BarChart3 size={18} />
                                    {t('userProfile.stats', 'Popular Charts Statistics')}
                                </h3>

                                <div className="stats-list">
                                    <div className="stat-item">
                                        <div className="stat-icon blue">
                                            <Music size={18} />
                                        </div>
                                        <div className="stat-data">
                                            <span className="stat-value" style={{ fontSize: '1rem' }}>
                                                {stats.totalCharts === 1
                                                    ? t('userProfile.charts_singular', { 1: stats.totalCharts })
                                                    : t('userProfile.charts_plural', { 1: stats.totalCharts })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-icon pink">
                                            <Heart size={18} />
                                        </div>
                                        <div className="stat-data">
                                            <span className="stat-value" style={{ fontSize: '1rem' }}>
                                                {stats.totalLikes === 1
                                                    ? t('userProfile.likes_singular', { 1: formatNumber(stats.totalLikes) })
                                                    : t('userProfile.likes_plural', { 1: formatNumber(stats.totalLikes) })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-icon purple">
                                            <MessageSquare size={18} />
                                        </div>
                                        <div className="stat-data">
                                            <span className="stat-value" style={{ fontSize: '1rem' }}>
                                                {stats.totalComments === 1
                                                    ? t('userProfile.comments_singular', { 1: formatNumber(stats.totalComments) })
                                                    : t('userProfile.comments_plural', { 1: formatNumber(stats.totalComments) })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </main>
    );
}
