"use client";

import { useState, useEffect, use, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    Music,
    Crown,
    Shield,
    AlertCircle,
    ArrowLeft,
    Star,
    Pencil
} from "lucide-react";
import "./page.css";
import { useUser } from "../../../contexts/UserContext";
import MarqueeText from "@/components/marquee-text/MarqueeText";
const EditProfileModal = dynamic(() => import("../../../components/profile/EditProfileModal"), { ssr: false });
import FormattedText from "../../../components/formatted-text/FormattedText";
import HomepageChartCard from "../../../components/homepage-chart-card/HomepageChartCard";

export default function UserProfile({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { t } = useLanguage();
    const [account, setAccount] = useState(null);
    const [charts, setCharts] = useState([]);
    const DEFAULT_PFP = "/defpfp.webp";
    const [assetBaseUrl, setAssetBaseUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentCounts, setCommentCounts] = useState({});

    const [userStats, setUserStats] = useState({});
    const stats = userStats || {};
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { sonolusUser, session } = useUser();
    const [visibleCount, setVisibleCount] = useState(5);

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

    const hasCharts = charts.length > 0;

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

    const bannerUrl = (account.banner_hash && assetBaseUrl)
        ? `${assetBaseUrl}/${account.sonolus_id}/banner/${account.banner_hash}_webp`
        : "/def.webp";
    const avatarUrl = (account.profile_hash && assetBaseUrl)
        ? `${assetBaseUrl}/${account.sonolus_id}/profile/${account.profile_hash}_webp`
        : DEFAULT_PFP;

    return (
        <main className="profile-page">
            <div className="profile-side-ambience" style={{ backgroundImage:`url(${bannerUrl})` }} />
            <div className="profile-side-ambience profile-side-ambience-pfp" style={{ backgroundImage:`url(${avatarUrl})` }} />
            <div style={{ position:"fixed", inset:0, backgroundImage:`url(${bannerUrl})`, backgroundSize:"cover", backgroundPosition:"center", filter:"blur(60px) brightness(0.3)", opacity:0.6, zIndex:0, pointerEvents:"none" }} />

            <button className="back-btn" onClick={handleBack}><ArrowLeft size={16} /><span>{t('userProfile.back','Back')}</span></button>

            <div className="profile-banner-wrap">
                <img src={bannerUrl} alt="" className="profile-banner-img" onError={(e) => { e.target.src = '/def.webp'; }} />
                <div className="profile-banner-fade" />
            </div>

            <div className="profile-hero">
                <div className="profile-avatar-col" style={{ position:"relative" }}>
                    <img src={avatarUrl} alt={account.sonolus_username} className="profile-avatar" />
                    {account.owner && <div className="avatar-badge owner"><Star size={11} /></div>}
                    {account.admin && !account.owner && <div className="avatar-badge admin"><Crown size={11} /></div>}
                    {account.mod && !account.admin && !account.owner && <div className="avatar-badge mod"><Shield size={11} /></div>}
                </div>
                <div className="profile-info-col">
                    <div className="name-line">
                        <h1><FormattedText text={account.sonolus_username || account.id} /></h1>
                        {account.owner && <span className="role owner">{t('userProfile.owner','Owner')}</span>}
                        {account.admin && <span className="role admin">{t('userProfile.admin','Admin')}</span>}
                        {account.mod && <span className="role mod">{t('userProfile.mod','Mod')}</span>}
                    </div>
                    <p className="handle">@{account.sonolus_handle}</p>
                    <div className="profile-stats-row">
                        <div className="profile-stat">
                            <span className="profile-stat-value">{formatNumber(stats.charts_published ?? charts.length)}</span>
                            <span className="profile-stat-label">
                                {(() => {
                                    const count = stats.charts_published ?? charts.length;
                                    return count === 1
                                        ? t('userProfile.charts_singular', '{1} Chart').replace('{1}', '')
                                        : t('userProfile.charts_plural', '{1} Charts').replace('{1}', '');
                                })()}
                            </span>
                        </div>
                        <div className="profile-stat">
                            <span className="profile-stat-value">{formatNumber(stats.likes_received ?? 0)}</span>
                            <span className="profile-stat-label">
                                {(() => {
                                    const n = stats.likes_received ?? 0;
                                    return n === 1
                                        ? t('userProfile.likes_singular', '{1} Like').replace('{1}', '')
                                        : t('userProfile.totalLikes', 'Likes');
                                })()}
                            </span>
                        </div>
                        <div className="profile-stat">
                            <span className="profile-stat-value">{formatNumber(stats.comments_received ?? 0)}</span>
                            <span className="profile-stat-label">
                                {(() => {
                                    const n = stats.comments_received ?? 0;
                                    return n === 1
                                        ? t('userProfile.comments_singular', '{1} Comment').replace('{1}', '')
                                        : t('userProfile.totalComments', 'Comments');
                                })()}
                            </span>
                        </div>
                    </div>
                    <div className="profile-stats-row profile-stats-row-secondary">
                        <div className="profile-stat-small">
                            <span>{formatNumber(stats.liked_charts_count ?? 0)}</span>
                            {' '}{t('userProfile.chartsLiked','Charts Liked')}
                        </div>
                        <div className="profile-stat-small">
                            <span>{formatNumber(stats.comments_count ?? 0)}</span>
                            {' '}{t('userProfile.commentsMade','Comments Made')}
                        </div>
                    </div>
                    {account.description && (
                        <div className="profile-description-section">
                            <FormattedText text={account.description} />
                        </div>
                    )}
                    <div className="profile-actions">
                        {sonolusUser && sonolusUser.sonolus_id === account.sonolus_id && (
                            <button onClick={() => setIsEditModalOpen(true)} className="btn-edit-profile"><Pencil size={14} />{t('userProfile.editProfile','Edit Profile')}</button>
                        )}
                    </div>
                </div>
            </div>

            <div className="profile-tabs-bar">
                <button className="profile-tab active">
                    {t('userProfile.charts', 'Popular Charts')}
                    {hasCharts && <span className="profile-tab-count">{stats.charts_published ?? charts.length}</span>}
                </button>
            </div>
            <div className="profile-content">
                {!hasCharts ? (
                    <div className="empty-state"><Music size={48} /><p>{t('userProfile.noCharts',"This user hasn't made any charts yet :<")}</p></div>
                ) : (
                    <>
                        <div className="charts-grid">
                            {charts.slice(0, visibleCount).map((chart, index) => {
                                const chartKey = chart.id || chart.name;
                                const thumbUrl = getChartThumbnail(chart);
                                const musicUrl = getChartMusicUrl(chart);
                                const chartData = {
                                    id: chart.id || chart.name?.replace('UnCh-',''),
                                    title: chart.title,
                                    artists: chart.artists,
                                    author: chart.author_full || chart.author || account.sonolus_username,
                                    authorId: chart.author || account.sonolus_id,
                                    authorHandle: chart.author_handle || account.sonolus_handle,
                                    assetBaseUrl: assetBaseUrl,
                                    rating: chart.rating,
                                    coverUrl: thumbUrl,
                                    bgmUrl: musicUrl,
                                    likeCount: chart.likes || chart.like_count || 0,
                                    commentsCount: commentCounts[chartKey] || 0,
                                    createdAt: chart.created_at || chart.createdAt,
                                };
                                return (
                                    <HomepageChartCard
                                        key={chartKey || index}
                                        chart={chartData}
                                        index={index}
                                    />
                                );
                            })}
                        </div>
                        {account.sonolus_handle && (
                            <Link
                                href={`/?view=search&sonolus_handle_is=${account.sonolus_handle}`}
                                className="load-more-btn-flat"
                            >
                                {t('userProfile.viewAllCharts', 'View All Charts')}
                                {(stats.charts_published ?? charts.length) > 0 && (
                                    <span className="load-more-btn-count">{stats.charts_published ?? charts.length} {t('common.total', 'total')}</span>
                                )}
                            </Link>
                        )}
                    </>
                )}
            </div>
            {isEditModalOpen && <EditProfileModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); fetchAccount(); }} onUpdate={fetchAccount} user={account} assetBaseUrl={assetBaseUrl} />}
        </main>
    );
}
