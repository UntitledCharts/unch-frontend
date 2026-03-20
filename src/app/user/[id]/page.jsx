"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminPanel from "@/components/admin-actions/AdminPanel";
import {
    Heart,
    Play,
    Pause,
    Music,
    Award,
    BarChart2,
    Crown,
    Shield,
    AlertCircle,
    MessageSquare,
    ArrowLeft,
    Star,
    ChevronLeft,
    ChevronRight,
    Github,
    Twitter,
    Youtube,
    Twitch,
    Globe,
    Link as LinkIcon,
    MoreVertical,
    Trash2,
    Ban,
    ShieldCheck,
    UserX,
    Eye,
    EyeOff,
    Pencil,
    Clock
} from "lucide-react";
import "./page.css";
import { useUser } from "../../../contexts/UserContext";
import MarqueeText from "@/components/marquee-text/MarqueeText";
import EditProfileModal from "../../../components/profile/EditProfileModal";



import FormattedText from "../../../components/formatted-text/FormattedText";

export default function UserProfile({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { t } = useLanguage();
    const [account, setAccount] = useState(null);
    const [charts, setCharts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    const DEFAULT_PFP = "/defpfp.webp";
    const [assetBaseUrl, setAssetBaseUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentCounts, setCommentCounts] = useState({});
    const [playingId, setPlayingId] = useState(null);
    const audioRef = useRef(null);

    const [userStats, setUserStats] = useState({});
    const stats = userStats || {};
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [activeChartMenu, setActiveChartMenu] = useState(null);
    const adminMenuRef = useRef(null);
    const { sonolusUser, session } = useUser();

    
    const fetchAccount = useCallback(async () => {
        try {
            let data = null;
            const apiBase = process.env.NEXT_PUBLIC_API_URL;
            const headers = { 'Cache-Control': 'no-cache, no-store' };

            
            try {
                const handleRes = await fetch(`${apiBase}/api/accounts/handle/${id}/?t=${Date.now()}`, { headers, cache: 'no-store' });
                if (handleRes.ok) {
                    const handleData = await handleRes.json();
                    const sonolusId = handleData.sonolus_id;

                    
                    if (sonolusId) {
                        const profileRes = await fetch(`${apiBase}/api/accounts/${sonolusId}?t=${Date.now()}`, { headers, cache: 'no-store' });
                        if (profileRes.ok) {
                            data = await profileRes.json();
                        }
                    }
                }
            } catch (e) {
                console.log("Handle lookup failed or not a handle", e);
            }

            
            if (!data) {
                try {
                    const directRes = await fetch(`${apiBase}/api/accounts/${id}?t=${Date.now()}`, { headers, cache: 'no-store' });
                    if (directRes.ok) {
                        data = await directRes.json();
                    }
                } catch (e) {
                    console.log("Direct ID fetch failed", e);
                }
            }

            if (!data || !data.account) {
                throw new Error("Account not found");
            }

            setAccount(data.account);
            setCharts(data.charts || []);
            setAssetBaseUrl(data.asset_base_url || "");

            
            if (data.account.sonolus_handle && id !== data.account.sonolus_handle.toString()) {
                router.replace(`/user/${data.account.sonolus_handle}`);
            }

        } catch (err) {
            console.error("Error fetching account:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (id) {
            fetchAccount();
        }
    }, [id, fetchAccount]);


    useEffect(() => {
        if (!account?.sonolus_id) return;

        const fetchStats = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${account.sonolus_id}/stats`);
                if (res.ok) {
                    const data = await res.json();
                    setUserStats(data);
                }
            } catch (e) {
                console.error("Failed to fetch user stats", e);
            }
        };

        fetchStats();
    }, [account?.sonolus_id]);

    
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





    const handleStaffAction = async (actionName) => {
        alert("Staff actions are temporarily disabled via frontend pending API update.");
        /*
        if (!confirm(`Are you sure you want to ${actionName} this user?`)) return;
        try {
            const res = await fetch('/api/staff-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: actionName, targetId: account.sonolus_id })
            });
            if (res.ok) {
                alert(`User has been updated (${actionName})`);
                window.location.reload();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(`Failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error running staff action');
        }
        */
    };

    const handleDeleteChart = async (chartId) => {
        if (!confirm('Are you sure you want to DELETE this chart? This cannot be undone.')) return;
        try {
            const cleanId = chartId.replace('UnCh-', '');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanId}`, {
                method: 'DELETE',
                headers: { 'Authorization': session }
            });
            if (res.ok) {
                setCharts(prev => prev.filter(c => (c.id || c.name) !== chartId));
                setActiveChartMenu(null);
            } else {
                alert('Failed to delete chart');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting chart');
        }
    };

    const handleChangeVisibility = async (chartId, newStatus) => {
        try {
            const cleanId = chartId.replace('UnCh-', '');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanId}/visibility`, {
                method: 'PATCH',
                headers: { 'Authorization': session, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setCharts(prev => prev.map(c => (c.id || c.name) === chartId ? { ...c, status: newStatus } : c));
                setActiveChartMenu(null);
            } else {
                alert('Failed to change visibility');
            }
        } catch (e) {
            console.error(e);
            alert('Error changing visibility');
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    


    
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

    
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (adminMenuRef.current && !adminMenuRef.current.contains(e.target)) {
                setShowAdminMenu(false);
            }
        };
        if (showAdminMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showAdminMenu]);

    const hasCharts = charts.length > 0;

    

    
    const totalPages = Math.ceil(charts.length / ITEMS_PER_PAGE);
    const displayedCharts = charts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            
            
        }
    };

    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-container">
                    <div className="profile-loading">
                        <div className="loading-spinner"></div>
                        <p>{t('userProfile.loading', 'Loading profile...')}</p>
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
                        <h2>{t('userProfile.notFound', 'User Not Found')}</h2>
                        <p>{error || t('userProfile.doesNotExist', "This user profile doesn't exist.")}</p>
                        <Link href="/" className="back-home-btn">{t('userProfile.backHome', 'Back to Home')}</Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="profile-page">
            {}
            <div
                className="profile-bg-blur"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${(account.banner_hash && assetBaseUrl) ? `${assetBaseUrl}/${account.sonolus_id}/banner/${account.banner_hash}` : "/def.webp"})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(40px) brightness(0.6)',
                    opacity: 0.8,
                    zIndex: 0,
                    pointerEvents: 'none'
                }}
            />
            <div className="profile-container" style={{ position: 'relative', zIndex: 1 }}>
                {}
                <button className="back-btn" onClick={handleBack}>
                    <ArrowLeft size={18} />
                    <span>{t('userProfile.back', 'Back')}</span>
                </button>

                <div className="profile-layout">
                    {}
                    <div className="profile-main">
                        {}
                        <div className="profile-card">
                            {}
                            <div className="profile-cover">
                                <img
                                    src={
                                        (account.banner_hash && assetBaseUrl)
                                            ? `${assetBaseUrl}/${account.sonolus_id}/banner/${account.banner_hash}_webp`
                                            : "/def.webp"
                                    }
                                    alt=""
                                    className="cover-image"
                                />
                                <div className="cover-overlay"></div>
                            </div>

                            {}
                            <div className="profile-header">
                                <div className="avatar-wrapper">
                                    <img
                                        src={
                                            (account.profile_hash && assetBaseUrl)
                                                ? `${assetBaseUrl}/${account.sonolus_id}/profile/${account.profile_hash}_webp`
                                                : DEFAULT_PFP
                                        }
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
                                    <div className="name-line" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', maxWidth: '100%', overflow: 'hidden' }}>
                                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                            <MarqueeText textComponent="h1" text={account.sonolus_username || account.id} maxLength={20} style={{ margin: 0 }}>
                                                <FormattedText text={account.sonolus_username || account.id} />
                                            </MarqueeText>
                                        </div>
                                        {account.owner && <span className="role owner" style={{ flexShrink: 0 }}>{t('userProfile.owner', 'Owner')}</span>}
                                        {account.admin && <span className="role admin" style={{ flexShrink: 0 }}>{t('userProfile.admin', 'Admin')}</span>}
                                        {account.mod && <span className="role mod" style={{ flexShrink: 0 }}>{t('userProfile.mod', 'Mod')}</span>}
                                    </div>
                                    <p className="handle">#{account.sonolus_handle}</p>

                                    {account.description && (
                                        <div className="profile-bio" style={{ marginTop: '12px', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                            <FormattedText text={account.description} />
                                        </div>
                                    )}

                                    {}


                                    <div className="profile-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {(sonolusUser && sonolusUser.sonolus_id === account.sonolus_id) && (
                                            <button
                                                onClick={() => setIsEditModalOpen(true)}
                                                className="btn-edit-profile"
                                                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                {t('userProfile.editProfile', 'Edit Profile')}
                                            </button>
                                        )}

                                    </div>
                                </div>
                            </div>

                            {}
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

                        {}
                        <div className="section">
                            <div className="section-header">
                                <h2>
                                    <Music size={20} /> {t('userProfile.charts', 'Charts')}
                                </h2>
                                {hasCharts && <span className="count">{charts.length}</span>}
                                {hasCharts && (
                                    <Link
                                        href={`/?view=search&sonolus_handle_is=${account.sonolus_handle || account.id}`}
                                        className="show-all-btn"
                                        style={{
                                            marginLeft: 'auto',
                                            fontSize: '0.9rem',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                                        }}
                                    >
                                        {t('userProfile.showAll', 'Show All')}
                                        <ChevronRight size={16} />
                                    </Link>
                                )}
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
                                                style={{ position: 'relative' }}
                                            >
                                                {}
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

                                                {}
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

                                                {}
                                                <div className="chart-level">
                                                    <span className="level-badge">Lv. {chart.rating || "?"}</span>
                                                </div>

                                                {}
                                                {sonolusUser && (sonolusUser.sonolus_id === account.sonolus_id || sonolusUser.isMod || sonolusUser.isAdmin) && (
                                                    <div
                                                        className="chart-actions-overlay"
                                                        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 100 }}
                                                        onClick={(e) => e.preventDefault()}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setActiveChartMenu(activeChartMenu === chartKey ? null : chartKey);
                                                            }}
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                background: 'rgba(0,0,0,0.6)',
                                                                backdropFilter: 'blur(8px)',
                                                                border: '1px solid rgba(255,255,255,0.15)',
                                                                color: 'white',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                padding: 0,
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <MoreVertical size={14} />
                                                        </button>
                                                        {activeChartMenu === chartKey && (
                                                            <div
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 'calc(100% + 6px)',
                                                                    right: 0,
                                                                    background: '#1e293b',
                                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px',
                                                                    zIndex: 100,
                                                                    minWidth: '160px',
                                                                    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                                                                    animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                                                    backdropFilter: 'blur(12px)'
                                                                }}
                                                            >
                                                                {}
                                                                {sonolusUser.sonolus_id === account.sonolus_id && (
                                                                    <button
                                                                        onClick={() => { setActiveChartMenu(null); router.push(`/levels/${chart.name || `UnCh-${chart.id}`}/edit`); }}
                                                                        className="dropdown-item"
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem' }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        <Pencil size={14} /> Edit
                                                                    </button>
                                                                )}

                                                                {}
                                                                {(sonolusUser.sonolus_id === account.sonolus_id || sonolusUser.isAdmin || (sonolusUser.isMod && account.sonolus_id !== sonolusUser.sonolus_id)) && (
                                                                    <button
                                                                        onClick={() => { setActiveChartMenu(null); handleDeleteChart(chartKey); }}
                                                                        className="dropdown-item"
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem' }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        <Trash2 size={14} /> Delete
                                                                    </button>
                                                                )}


                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {}
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

                    {}
                    <aside className="profile-sidebar">
                        <div className="sidebar-section">
                            <h3>
                                <BarChart2 size={18} />
                                {t('userProfile.stats', 'Statistics')}
                            </h3>

                            <div className="stats-list">
                                <div className="stat-item">
                                    <div className="stat-icon blue">
                                        <BarChart2 size={18} />
                                    </div>
                                    <div className="stat-data">
                                        <span className="stat-value">
                                            {t(stats.charts_published === 1 ? 'userProfile.charts_singular' : 'userProfile.charts_plural', { 1: stats.charts_published || 0 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon pink">
                                        <Heart size={18} />
                                    </div>
                                    <div className="stat-data">
                                        <span className="stat-value">
                                            {t(stats.likes_received === 1 ? 'userProfile.likes_singular' : 'userProfile.likes_plural', { 1: stats.likes_received || 0 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon purple">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div className="stat-data">
                                        <span className="stat-value">
                                            {t(stats.comments_received === 1 ? 'userProfile.comments_singular' : 'userProfile.comments_plural', { 1: stats.comments_received || 0 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon green">
                                        <Heart size={18} />
                                    </div>
                                    <div className="stat-data">
                                        <span className="stat-value">
                                            {t('userProfile.chartsLiked', 'Charts Liked')}: {stats.liked_charts_count || 0}
                                        </span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon yellow">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div className="stat-data">
                                        <span className="stat-value">
                                            {t('userProfile.commentsMade', 'Comments Made')}: {stats.comments_count || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AdminPanel
                            className="sidebar-section"
                            targetType="user"
                            targetData={{
                                isBanned: account.banned,
                                isMod: account.mod,
                                isAdmin: account.admin
                            }}
                            currentUser={sonolusUser}
                            onAction={(action) => {
                                if (action === 'makeMod') {
                                    handleStaffAction('mod');
                                } else if (action === 'unmod') {
                                    handleStaffAction('unmod');
                                } else if (action === 'makeAdmin') {
                                    handleStaffAction('admin');
                                } else if (action === 'unadmin') {
                                    handleStaffAction('unadmin');
                                }
                            }}
                        />
                    </aside>
                </div>
            </div >
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={account}
                onUpdate={fetchAccount}
                assetBaseUrl={assetBaseUrl}
            />
        </main >
    );
}
