"use client";
import "./page.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Globe, EyeOff, Eye, Lock, Unlock, Link as LinkIcon, MoreVertical, GitCommit, MessageSquare, BarChart2, Heart, Play, Plus, Search, X, Check, RefreshCw } from "lucide-react";
import PaginationControls from "../../components/pagination-controls/PaginationControls";
import { useUser } from "../../contexts/UserContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import LiquidSelect from "../../components/liquid-select/LiquidSelect";
import DashboardSkeleton from "../../components/dashboard-skeleton/DashboardSkeleton";
import { formatBytes } from "../../utils/byteUtils";
import dynamic from "next/dynamic";
import { memo } from "react";

const ChartModal = dynamic(() => import("../../components/chart-modal/ChartModal"), {
  ssr: false,
  loading: () => null
});

const APILink = process.env.NEXT_PUBLIC_API_URL;


const StatWithGraph = memo(({ icon: Icon, label, value, color, data }) => {
  const { t } = useLanguage();
  const width = 156;
  const height = 76;
  const safeData = Array.isArray(data) && data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData);
  const range = max - min || 1;

  const points = safeData.map((d, i) => {
    const x = (i / (safeData.length - 1)) * width;
    const y = height - ((d - min) / range) * (height * 0.6) - (height * 0.2);
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `${points} L ${width},${height} L 0,${height} Z`;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`stat-with-graph-container ${isOpen ? 'open' : ''}`}
      onClick={() => setIsOpen(!isOpen)}
      style={{ cursor: 'pointer' }}
    >
      <div className="stat-header">
        <Icon size={16} />
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-graph-drawer">
        <div style={{ fontSize: '10px', color: color, marginBottom: '4px', textAlign: 'left', fontWeight: 'bold' }}>{t('levelDetail.last7Days', 'Last 7 Days')}</div>
        <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="graph-area" d={`M ${areaPath}`} fill={`url(#grad-${label})`} />
          <path className="graph-path" d={`M ${points}`} stroke={color} />
        </svg>
      </div>
    </div>
  );
});

StatWithGraph.displayName = 'StatWithGraph';

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    sonolusUser,
    session,
    isSessionValid,
    clearExpiredSession,
    isClient,
    sessionReady,
  } = useUser();

  const [windowWidth, setWindowWidth] = useState(0);
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (sessionReady && (!sonolusUser || !isSessionValid() || !localStorage.getItem("session"))) {
      router.push("/login");
    }
  }, [sessionReady, sonolusUser, isSessionValid, router]);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deletablePost, setDeletablePost] = useState(null);
  const [limits, setLimits] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [recentComments, setRecentComments] = useState([]);
  const [recentCommentsPage, setRecentCommentsPage] = useState(0);

  // Fetch recent comments by aggregating from user's charts
  const fetchRecentComments = async (posts) => {
    if (!posts || posts.length === 0) return;
    try {
      const topCharts = posts.slice(0, 5); // Check top 5 charts
      const token = localStorage.getItem("session");
      const headers = token ? { Authorization: `${token}` } : {};

      const promises = topCharts.map(post =>
        fetch(`${APILink}/api/charts/${post.id}/comment/?page=0`, { headers })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            const comments = Array.isArray(data) ? data : (data?.data || []);
            return comments.map(c => ({ ...c, chartTitle: post.title, chartId: post.id }));
          })
          .catch(() => [])
      );

      const results = await Promise.all(promises);
      const allComments = results.flat().filter(Boolean);
      // Sort by id or date if available, assuming valid date string or ID sort
      allComments.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setRecentComments(allComments.slice(0, 50));
    } catch (e) {
      console.error("Failed to fetch recent comments", e);
    }
  };


  useEffect(() => {
    setMounted(true);
  }, []);

  const [form, setForm] = useState({
    title: "",
    artists: "",
    author: "",
    rating: "",
    description: "",
    tags: "",
    jacket: null,
    bgm: null,
    chart: null,
    preview: null,
    background: null,
    visibility: "public"
  });

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.author && post.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalLikes = posts.reduce((acc, curr) => acc + (curr.likeCount || 0), 0);
  const totalComments = posts.reduce((acc, curr) => acc + (curr.commentsCount || 0), 0);

  const likesHistory = [0, 0, 0, 0, 0, totalLikes * 0.5, totalLikes];
  const commentsHistory = [0, 0, 0, 0, 0, totalComments * 0.5, totalComments];

  const handleMyCharts = async (page = 0) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("session");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${APILink}/api/charts?page=${page}&type=advanced&status=ALL&limit=10`, {
        headers: { Authorization: `${session}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearExpiredSession();
          setLoading(false);
          return;
        }
        throw new Error(`Network error: ${res.status}`);
      }
      const data = await res.json();
      const BASE = data.asset_base_url || `${APILink}`;
      const items = Array.isArray(data?.data) ? data.data : [];
      const normalized = items.map((item) => ({
        id: item.id,
        title: item.title,
        artists: item.artists,
        author: item.author_full,
        author_field: item.chart_design,
        authorId: item.author,
        rating: item.rating,
        description: item.description,
        tags: item.tags,
        coverUrl: item.jacket_file_hash ? `${BASE}/${item.author}/${item.id}/${item.jacket_file_hash}` : "",
        likeCount: item.like_count ?? item.likes ?? 0,
        commentsCount: item.comment_count ?? item.comments_count ?? (Array.isArray(item.comments) ? item.comments.length : item.comments) ?? 0,
        createdAt: item.created_at,
        status: item.status,
        hasJacket: !!item.jacket_file_hash,
        hasAudio: !!item.music_hash,
        hasChart: !!item.chart_hash,
        hasPreview: !!item.preview_hash,
        hasBackground: !!item.background_hash
      }));
      setPosts(normalized);
      setPageCount(data.pageCount || 0);
      setTotalCount(data.data?.[0]?.total_count || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLimits = async () => {
    try {
      const res = await fetch(`${APILink}/api/limits`);
      if (res.ok) setLimits(await res.json());
    } catch (e) {
      console.error("Failed to load limits", e);
    }
  };

  useEffect(() => {
    if (isClient && sessionReady) {
      handleMyCharts();
      fetchLimits();
    }
  }, [isClient, sessionReady]);

  const openUpload = () => {
    setMode("upload");
    setForm({
      title: "", artists: "", author: "", rating: "", description: "", tags: "",
      jacket: null, bgm: null, chart: null, preview: null, background: null, visibility: "private"
    });
    setError(null);
    setIsOpen(true);
  };

  const openEdit = (post) => {
    setMode("edit");
    const vis = post.status && typeof post.status === 'string' ? post.status.toLowerCase() : "public";
    setForm({
      title: post.title, artists: post.artists, author: post.author_field, rating: String(post.rating ?? ""),
      description: post.description || "", tags: post.tags || "",
      jacket: null, bgm: null, chart: null, preview: null, background: null,
      visibility: vis
    });
    setEditData({
      id: post.id,
      hasJacket: post.hasJacket,
      hasAudio: post.hasAudio,
      hasChart: post.hasChart,
      hasPreview: post.hasPreview,
      hasPreview: post.hasPreview,
      hasBackground: post.hasBackground,
      status: post.status
    });
    setError(null);
    setIsOpen(true);
    setActiveMenu(null);
  };

  const closePanel = () => {
    setIsOpen(false);
    setMode(null);
    setEditData(null);
    setError(null);
  };

  const update = (key) => (e) => {
    const value = e?.target?.type === "file" ? e.target.files?.[0] ?? null : (e?.target ? e.target.value : e);
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const validateLimits = (data, method = 'upload') => {
    if (!limits) return true;

    if (data.title.length > limits.title) throw new Error(`Title max ${limits.title} chars.`);
    if (data.artists.length > limits.artist) throw new Error(`Artist max ${limits.artist} chars.`);
    if (data.author.length > limits.author) throw new Error(`Author max ${limits.author} chars.`);
    if (data.description && data.description.length > limits.description) throw new Error(`Desc max ${limits.description} chars.`);

    const rating = parseInt(data.rating);
    if (isNaN(rating) || rating < -999 || rating > 999) throw new Error("Rating must be between -999 and 999.");

    if (data.tags) {
      if (data.tags.length > limits.maximum_tags) throw new Error(`Max ${limits.maximum_tags} tags.`);
      for (let t of data.tags) {
        if (t.length > limits.per_tag) throw new Error(`Tag '${t}' exceeds ${limits.per_tag} chars.`);
      }
    }

    if (form.jacket && form.jacket.size > limits.jacket) throw new Error(`Jacket too large (Max ${formatBytes(limits.jacket)})`);
    if (form.chart && form.chart.size > limits.chart) throw new Error(`Chart too large (Max ${formatBytes(limits.chart)})`);
    if (form.bgm && form.bgm.size > limits.audio) throw new Error(`Audio too large (Max ${formatBytes(limits.audio)})`);
    if (form.preview && form.preview.size > limits.preview) throw new Error(`Preview too large (Max ${formatBytes(limits.preview)})`);
    if (form.background && form.background.size > limits.background) throw new Error(`Background too large (Max ${formatBytes(limits.background)})`);

    return true;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "upload") await handleUpload();
      else if (mode === "edit") await handleEdit();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      const vis = form.visibility && typeof form.visibility === 'string' ? form.visibility.toUpperCase() : "PUBLIC";
      const chartData = {
        title: form.title, artists: form.artists, author: form.author, rating: parseInt(form.rating),
        description: form.description, status: vis,
        includes_jacket: !!form.jacket, includes_audio: !!form.bgm, includes_chart: !!form.chart,
        includes_preview: !!form.preview, includes_background: !!form.background,
        delete_background: false, delete_preview: false
      };

      let parsedTags = [];
      if (form.tags) {
        parsedTags = Array.isArray(form.tags) ? form.tags : form.tags.split(',').map(t => t.trim()).filter(t => t);
        chartData.tags = parsedTags;
      }

      validateLimits({ ...chartData, tags: parsedTags }, 'edit');

      const formData = new FormData();
      formData.append("data", JSON.stringify(chartData));
      if (form.jacket) formData.append("jacket_image", form.jacket);
      if (form.bgm) formData.append("audio_file", form.bgm);
      if (form.chart) formData.append("chart_file", form.chart);
      if (form.preview) formData.append("preview_file", form.preview);
      if (form.background) formData.append("background_image", form.background);

      const res = await fetch(`${APILink}/api/charts/${editData.id}/edit/`, {
        method: "PATCH",
        headers: { Authorization: session },
        body: formData
      });
      if (!res.ok) {
        if (res.status === 401) { clearExpiredSession(); return; }
        throw new Error(await res.text());
      }

      if (editData.status?.toLowerCase() !== vis.toLowerCase()) {
        try {
          const visRes = await fetch(`${APILink}/api/charts/${editData.id}/visibility/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: session },
            body: JSON.stringify({ status: vis })
          });
          if (!visRes.ok) {
            console.error("Visibility separate update failed", await visRes.text());
          }
        } catch (e) {
          console.error("Failed to update visibility separately", e);
        }
      }

      setIsOpen(false);
      handleMyCharts(currentPage);
    } catch (e) { throw e; } finally { setLoading(false); }
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      const vis = form.visibility && typeof form.visibility === 'string' ? form.visibility.toUpperCase() : "PUBLIC";
      const chartData = {
        rating: parseInt(form.rating), title: form.title, artists: form.artists, author: form.author,
        includes_background: !!form.background, includes_preview: !!form.preview,

        status: vis
      };
      let parsedTags = [];
      if (form.tags) {
        parsedTags = form.tags.split(',').map(t => t.trim()).filter(t => t);
        chartData.tags = parsedTags;
      }

      validateLimits({ ...chartData, tags: parsedTags }, 'upload');

      const formData = new FormData();
      formData.append("data", JSON.stringify(chartData));

      if (form.jacket) formData.append("jacket_image", form.jacket);
      if (form.bgm) formData.append("audio_file", form.bgm);
      if (form.chart) formData.append("chart_file", form.chart);
      if (form.preview) formData.append("preview_file", form.preview);
      if (form.background) formData.append("background_image", form.background);

      const res = await fetch(`${APILink}/api/charts/upload/`, {
        method: "POST",
        headers: { Authorization: session },
        body: formData
      });
      if (!res.ok) {
        if (res.status === 401) { clearExpiredSession(); return; }
        throw new Error(await res.text());
      }

      const result = await res.json();


      if (result && (result.id || result.data?.id)) {
        const newId = result.id || result.data?.id;
        try {
          const visRes = await fetch(`${APILink}/api/charts/${newId}/visibility/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: session },
            body: JSON.stringify({ status: vis })
          });
          if (!visRes.ok) console.error("Initial visibility setting failed", await visRes.text());
        } catch (e) { console.error("Failed to set initial visibility", e); }
      }

      setIsOpen(false);
      handleMyCharts(currentPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (post) => {
    setDeletablePost(post);
    setActiveMenu(null);
  };

  const actuallyDelete = async () => {
    if (!deletablePost) return;
    setLoading(true);
    try {
      const res = await fetch(`${APILink}/api/charts/${deletablePost.id}/delete/`, {
        method: "DELETE", headers: { Authorization: session }
      });
      if (!res.ok) throw new Error(await res.text());
      handleMyCharts(currentPage);
    } catch (e) { setError(e.message); } finally { setDeletablePost(null); setLoading(false); }
  };




  const shouldShowPagination = () => {
    if (posts.length === 0) return false;
    const isMobileOrTablet = windowWidth < 1024;
    const total = totalCount || posts.length;
    return isMobileOrTablet ? total > 10 : total > 30;
  };

  const updateVisibility = async (post, newStatus) => {

    const oldStatus = post.status;
    setPosts(currentPosts => currentPosts.map(p =>
      p.id === post.id ? { ...p, status: newStatus.toUpperCase() } : p
    ));

    try {
      const cleanId = post.id.toString().replace('UnCh-', '');
      const res = await fetch(`${APILink}/api/charts/${cleanId}/visibility/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: session },
        body: JSON.stringify({ status: newStatus.toUpperCase() })
      });
      if (!res.ok) throw new Error("Failed to update visibility");
    } catch (e) {
      console.error(e);

      setPosts(currentPosts => currentPosts.map(p =>
        p.id === post.id ? { ...p, status: oldStatus } : p
      ));
      alert(t('dashboard.updateFailed', 'Failed to update visibility'));
    }
  };


  const renderVisibilityButtons = (post) => {
    const status = post.status?.toLowerCase() || 'public';

    const PublicBtn = (
      <button
        key="pub"
        className="vis-btn public"
        onClick={() => updateVisibility(post, 'public')}
        title={t('dashboard.makePublic', 'Make Public')}
      >
        <Eye size={18} />
      </button>
    );

    const UnlistedBtn = (
      <button
        key="unl"
        className="vis-btn unlisted"
        onClick={() => updateVisibility(post, 'unlisted')}
        title={t('dashboard.makeUnlisted', 'Make Unlisted')}
      >
        <LinkIcon size={18} />
      </button>
    );

    const PrivateBtn = (
      <button
        key="priv"
        className="vis-btn private"
        onClick={() => updateVisibility(post, 'private')}
        title={t('dashboard.makePrivate', 'Make Private')}
      >
        <Lock size={18} />
      </button>
    );

    if (status === 'public') return [UnlistedBtn, PrivateBtn];
    if (status === 'unlisted') return [PublicBtn, PrivateBtn];
    if (status === 'private') return [PublicBtn, UnlistedBtn];
    return [];
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header-row">
          <div className="header-left">
            <h1 className="welcome-text">
              <span>{t('dashboard.welcome', 'Welcome')},</span>
              <span className="text-primary truncate max-w-full block">
                {mounted && sessionReady && sonolusUser ? sonolusUser.sonolus_username : '...'}
              </span>
            </h1>
          </div>

          <div className="header-actions">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder={t('dashboard.searchPlaceholder', 'Search Chart')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button onClick={openUpload} className="upload-btn">
              <Plus size={20} className="plus-icon" />
              <span>{t('dashboard.newChart', 'New Chart')}</span>
            </button>
          </div>
        </div>

        {loading && posts.length === 0 ? (
          <DashboardSkeleton />
        ) : (
          <div className="dashboard-structure">
            <aside className="dashboard-sidebar">
              <div className="sidebar-section">
                <div className="section-header">
                  <h3>Stats</h3>
                </div>
                <div className="stats-list">
                  <StatWithGraph
                    icon={Heart}
                    label={t('dashboard.totalLikes', 'Total Likes')}
                    value={totalLikes}
                    color="#f87171"
                    data={likesHistory}
                  />
                  <StatWithGraph
                    icon={MessageSquare}
                    label={t('dashboard.totalComments', 'Total Comments')}
                    value={totalComments}
                    color="#38bdf8"
                    data={commentsHistory}
                  />
                </div>
              </div>

              <div className="sidebar-section">
                <div className="section-header">
                  <h3>Recent Comments</h3>
                </div>
                <div className="comments-card">
                  {recentComments.length === 0 ? (
                    <p className="text-gray-500 text-sm p-4">No recent comments</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {recentComments.slice(recentCommentsPage * 10, (recentCommentsPage + 1) * 10).map((comment, i) => (
                        <div key={i} className="bg-white/5 p-3 rounded-lg text-sm cursor-pointer hover:bg-white/10 transition-colors" onClick={() => router.push(`/levels/${comment.chartId}`)}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-blue-400 truncate max-w-[100px]">{comment.user?.name || 'User'}</span>
                            <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-300 line-clamp-2">{comment.content || comment.comment}</p>
                          <div className="mt-1 text-xs text-gray-600 truncate">on {comment.chartTitle}</div>
                        </div>
                      ))}
                    </div>

                  )}
                  {recentComments.length > 10 && (
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
                      <button
                        className={`text-xs px-2 py-1 rounded ${recentCommentsPage === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-blue-400 hover:bg-white/5'}`}
                        disabled={recentCommentsPage === 0}
                        onClick={() => setRecentCommentsPage(p => p - 1)}
                      >
                        Prev
                      </button>
                      <span className="text-xs text-gray-500">
                        {recentCommentsPage + 1} / {Math.ceil(recentComments.length / 10)}
                      </span>
                      <button
                        className={`text-xs px-2 py-1 rounded ${((recentCommentsPage + 1) * 10) >= recentComments.length ? 'text-gray-600 cursor-not-allowed' : 'text-blue-400 hover:bg-white/5'}`}
                        disabled={((recentCommentsPage + 1) * 10) >= recentComments.length}
                        onClick={() => setRecentCommentsPage(p => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <main className="dashboard-main">
              {filteredPosts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎵</div>
                  {posts.length > 0 ? (
                    <h3>{t('dashboard.chartNotFound', 'Chart Not Found')}</h3>
                  ) : (
                    <>
                      <h3>{t('dashboard.noCharts', 'No Charts Yet')}</h3>
                      <p>{t('dashboard.startUpload', 'Upload your first chart to get started!')}</p>
                      <button onClick={openUpload} className="upload-btn mt-4">
                        <Plus size={18} className="plus-icon" /> {t('dashboard.uploadFirst', 'Upload Now')}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="dashboard-grid">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="chart-card-redesigned">
                      {/* Background Layer */}
                      <div
                        className="card-bg"
                        style={{ backgroundImage: `url(${post.coverUrl || '/placeholder.png'})` }}
                      />

                      {/* Left: Thumbnail */}
                      <div
                        className="card-thumb cursor-pointer"
                        onClick={() => router.push(`/levels/${post.id}`)}
                      >
                        {post.coverUrl ? (
                          <img src={post.coverUrl} alt={post.title} loading="lazy" />
                        ) : (
                          <div className="placeholder-thumb">
                            <span className="no-img-text">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Middle: Info */}
                      <div className="card-info">
                        <div className="info-header">
                          <h3 title={post.title}>{post.title}</h3>
                          <div className="action-menu-wrapper">
                            <button
                              className="icon-btn-ghost"
                              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === post.id ? null : post.id); }}
                            >
                              <MoreVertical size={16} />
                            </button>
                            <div className={`action-dropdown ${activeMenu === post.id ? 'active' : ''}`} style={{ display: activeMenu === post.id ? 'flex' : 'none' }}>
                              <button onClick={() => openEdit(post)}>{t('dashboard.edit', 'Edit')}</button>
                              <button onClick={() => handleDelete(post)} className="text-red">{t('dashboard.delete', 'Delete')}</button>
                            </div>
                          </div>
                        </div>

                        <span className="author-name">{post.author_field || post.author || 'Unknown'}</span>

                        <div className="card-meta-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.8rem', color: '#64748b', gap: '12px' }}>
                          <span className="commit-date">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown Date'}
                          </span>
                          <div className="footer-stats" style={{ display: 'flex', gap: '12px' }}>
                            <span title="Likes" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={12} /> {post.likeCount || 0}</span>
                            <span title="Comments" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={12} /> {post.commentsCount || 0}</span>
                            <span title="Rating" className="rating-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Lv. {post.rating}</span>
                          </div>
                          {/* Current Status Indicator */}
                          <span className={`status-text ${post.status?.toLowerCase()}`} style={{ marginLeft: '12px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                            {post.status}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="card-actions-right">
                        {renderVisibilityButtons(post)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {shouldShowPagination() && (
                <div className="pagination-wrapper">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={pageCount}
                    onPageChange={handleMyCharts}
                  />
                </div>
              )}
            </main>
          </div>
        )
        }

        {
          deletablePost && (
            <div className="modal-overlay">
              <div className="modal-content delete-modal">
                <h3>{t('dashboard.confirmDelete', 'Are you sure you want to delete this chart?')}</h3>
                <p className="text-slate-400 text-sm mt-2">{deletablePost.title}</p>
                <div className="modal-actions">
                  <button onClick={() => setDeletablePost(null)} className="btn-cancel">{t('dashboard.cancel', 'Cancel')}</button>
                  <button onClick={actuallyDelete} className="btn-delete">{t('dashboard.delete', 'Delete')}</button>
                </div>
              </div>
            </div>
          )
        }

        {/* Upload/Edit Modal - Restored Original Component */}
        <ChartModal
          isOpen={isOpen}
          mode={mode}
          form={form}
          onClose={closePanel}
          onSubmit={onSubmit}
          onUpdate={update}
          loading={loading}
          editData={editData}
          limits={limits}
          isDark={true}
        />
      </div >
    </div >
  );
}
