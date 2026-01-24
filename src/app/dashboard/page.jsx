"use client";
import "./page.css";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart,
  MessageSquare,
  MoreVertical,
  Plus,
  ChevronDown,
  Pencil,
  Trash2,
  Eye,
  Clock,
  Star,
  Type,
  User,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
  loading: () => null,
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

  const points = safeData
    .map((d, i) => {
      const x = (i / (safeData.length - 1)) * width;
      const y = height - ((d - min) / range) * (height * 0.6) - height * 0.2;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = `${points} L ${width},${height} L 0,${height} Z`;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`stat-with-graph-container ${isOpen ? "open" : ""}`}
      onClick={() => setIsOpen(!isOpen)}
      style={{ cursor: "pointer" }}
    >
      <div className="stat-header">
        <Icon size={16} />
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-graph-drawer">
        <div style={{ fontSize: "10px", color: color, marginBottom: "4px", textAlign: "left", fontWeight: "bold" }}>
          {t("levelDetail.last7Days", "Last 7 Days")}
        </div>
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
StatWithGraph.displayName = "StatWithGraph";

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const { sonolusUser, session, isSessionValid, clearExpiredSession, isClient, sessionReady } = useUser();

  const [windowWidth, setWindowWidth] = useState(0);
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const [staffPick, setStaffPick] = useState(false);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [minRating, setMinRating] = useState(1);
  const [maxRating, setMaxRating] = useState(99);
  const [descriptionIncludes, setDescriptionIncludes] = useState("");
  const [titleIncludes, setTitleIncludes] = useState("");
  const [artistsIncludes, setArtistsIncludes] = useState("");
  const [tags, setTags] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deletablePost, setDeletablePost] = useState(null);
  const [limits, setLimits] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [mounted, setMounted] = useState(false);

  // --- NEW: schedule popover state
  const [scheduleMenuPostId, setScheduleMenuPostId] = useState(null);
  const [scheduleDtLocal, setScheduleDtLocal] = useState(""); // "YYYY-MM-DDTHH:mm"
  const scheduleAnchorRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // ---- helpers for schedule
  const dtLocalToEpochSeconds = (value) => {
    const d = new Date(value); // local time
    const ms = d.getTime();
    if (Number.isNaN(ms)) return null;
    return Math.floor(ms / 1000);
  };

  const epochSecondsToDtLocal = (epochSeconds) => {
    const d = new Date(epochSeconds * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  };

  // scheduled_publish is an ISO string (from pydantic model_dump) or null
  const getScheduledEpochSeconds = (post) => {
    const v = post.scheduled_publish ?? null;
    if (!v) return null;
    const ms = Date.parse(v);
    if (Number.isNaN(ms)) return null;
    return Math.floor(ms / 1000);
  };

  const openScheduleMenu = (post) => {
    const epoch = getScheduledEpochSeconds(post);
    setScheduleDtLocal(epoch ? epochSecondsToDtLocal(epoch) : "");
    setScheduleMenuPostId(post.id);
  };

  const closeScheduleMenu = () => {
    setScheduleMenuPostId(null);
    setScheduleDtLocal("");
  };

  // close schedule popover on outside click
  useEffect(() => {
    if (!scheduleMenuPostId) return;

    const onDocMouseDown = (e) => {
      const anchor = scheduleAnchorRef.current;
      if (!anchor) return;
      if (!anchor.contains(e.target)) closeScheduleMenu();
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [scheduleMenuPostId]);

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
    removePreview: false,
    removeBackground: false,
    visibility: "public",
  });

  const filteredPosts = posts;

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("session");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const apiBase = APILink;
      const queryParams = new URLSearchParams();
      queryParams.append("type", "advanced");
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", "10");
      queryParams.append("status", "ALL");

      if (staffPick) queryParams.append("staff_pick", "1");
      if (minRating) queryParams.append("min_rating", minRating);
      if (maxRating) queryParams.append("max_rating", maxRating);
      if (tags) queryParams.append("tags", tags);
      if (titleIncludes) queryParams.append("title_includes", titleIncludes);
      if (descriptionIncludes) queryParams.append("description_includes", descriptionIncludes);
      if (artistsIncludes) queryParams.append("artists_includes", artistsIncludes);
      if (searchQuery) queryParams.append("meta_includes", searchQuery);

      queryParams.append("sort_by", sortBy);
      queryParams.append("sort_order", sortOrder);
      queryParams.append("limit", "10");

      const res = await fetch(`${apiBase}/api/charts?${queryParams.toString()}`, {
        headers: { Authorization: `${session}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearExpiredSession();
          setLoading(false);
          return;
        }
        const errText = await res.text();
        throw new Error(`Network error: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      const BASE = data.asset_base_url || `${APILink}`;
      const items = Array.isArray(data?.data) ? data.data : [];

      const normalized = items.map((item) => {
        const jacketHash = item.jacket_file_hash || item.jacket_hash || item.cover_hash || item.cover_file_hash;
        const bgmHash =
          item.music_hash ||
          item.bgm_hash ||
          item.audio_hash ||
          item.bgm_file_hash ||
          item.music_file_hash ||
          item.audio_file_hash ||
          item.sound_hash;
        const chartHash = item.chart_hash || item.chart_file_hash || item.data_hash || item.data_file_hash;
        const previewHash = item.preview_hash || item.preview_file_hash;
        const backgroundHash = item.background_hash || item.background_file_hash;

        const jacketUrl = jacketHash ? `${BASE}/${item.author}/${item.id}/${jacketHash}` : "";
        const bgmUrl = bgmHash ? `${BASE}/${item.author}/${item.id}/${bgmHash}` : "";
        const chartUrl = chartHash ? `${BASE}/${item.author}/${item.id}/${chartHash}` : "";
        const previewUrl = previewHash ? `${BASE}/${item.author}/${item.id}/${previewHash}` : "";
        const backgroundUrl = backgroundHash ? `${BASE}/${item.author}/${item.id}/${backgroundHash}` : "";

        return {
          id: item.id,
          title: item.title,
          artists: item.artists,
          author: item.author_full,
          author_field: item.chart_design,
          authorId: item.author,
          rating: item.rating,
          description: item.description,
          tags: item.tags,
          coverUrl: jacketUrl,
          jacketUrl,
          bgmUrl,
          chartUrl,
          previewUrl,
          backgroundUrl,
          likeCount: item.like_count ?? item.likes ?? 0,
          commentsCount:
            item.comment_count ??
            item.comments_count ??
            (Array.isArray(item.comments) ? item.comments.length : item.comments) ??
            0,
          createdAt: item.created_at,
          publishedAt: item.published_at,
          status: item.status,
          scheduled_publish: item.scheduled_publish ?? null, // <-- ISO string from pydantic model_dump
          hasJacket: !!jacketHash,
          hasAudio: !!bgmHash,
          hasChart: !!chartHash,
          hasPreview: !!previewHash,
          hasBackground: !!backgroundHash,
        };
      });

      setPosts(normalized);
      setPageCount(data.pageCount || 0);
      setTotalCount(data.data?.[0]?.total_count || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load charts");
    } finally {
      setLoading(false);
    }
  }, [
    APILink,
    currentPage,
    session,
    staffPick,
    searchQuery,
    sortBy,
    sortOrder,
    minRating,
    maxRating,
    tags,
    titleIncludes,
    descriptionIncludes,
    artistsIncludes,
    clearExpiredSession,
  ]);

  const fetchLimits = async () => {
    try {
      const res = await fetch(`${APILink}/api/limits`);
      if (res.ok) {
        const limits = await res.json();
        setLimits(limits);
      }
    } catch (e) {
      console.error("Failed to load limits", e);
    }
  };

  useEffect(() => {
    if (isClient && sessionReady) {
      fetchCharts();
      fetchLimits();
    }
  }, [isClient, sessionReady, currentPage, fetchCharts]);

  const openUpload = () => {
    setMode("upload");
    setForm({
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
      visibility: "private",
      removePreview: false,
      removeBackground: false,
    });
    setError(null);
    setIsOpen(true);
  };

  const openEdit = useCallback((post) => {
    setMode("edit");
    const vis = post.status && typeof post.status === "string" ? post.status.toLowerCase() : "public";
    setForm({
      title: post.title,
      artists: post.artists,
      author: post.author_field,
      rating: String(post.rating ?? ""),
      description: post.description || "",
      tags: post.tags || "",
      jacket: null,
      bgm: null,
      chart: null,
      preview: null,
      background: null,
      visibility: vis,
      removePreview: false,
      removeBackground: false,
      removeJacket: false,
      removeAudio: false,
      removeChart: false,
    });
    setEditData({
      id: post.id,
      hasJacket: post.hasJacket,
      hasAudio: post.hasAudio,
      hasChart: post.hasChart,
      hasPreview: post.hasPreview,
      hasBackground: post.hasBackground,
      status: post.status,
      jacketUrl: post.jacketUrl,
      bgmUrl: post.bgmUrl,
      chartUrl: post.chartUrl,
      previewUrl: post.previewUrl,
      backgroundUrl: post.backgroundUrl,
    });
    setError(null);
    setIsOpen(true);
    setActiveMenu(null);
  }, []);

  const closePanel = () => {
    setIsOpen(false);
    setMode(null);
    setEditData(null);
    setError(null);
  };

  const update = (key) => (e) => {
    const value = e?.target?.type === "file" ? e.target.files?.[0] ?? null : e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const validateLimits = (data) => {
    if (!limits) return true;

    if (data.title.length > limits.text.title) throw new Error(`Title max ${limits.text.title} chars.`);
    if (data.artists.length > limits.text.artist) throw new Error(`Artist max ${limits.text.artist} chars.`);
    if (data.author.length > limits.text.author) throw new Error(`Author max ${limits.text.author} chars.`);
    if (data.description && data.description.length > limits.text.description)
      throw new Error(`Desc max ${limits.text.description} chars.`);

    const rating = parseInt(data.rating);
    if (isNaN(rating) || rating < -999 || rating > 999) throw new Error("Rating must be between -999 and 999.");

    if (data.tags) {
      if (data.tags.length > limits.text.tags_count) throw new Error(`Max ${limits.text.tags_count} tags.`);
      for (let t of data.tags) {
        if (t.length > limits.text.per_tag) throw new Error(`Tag '${t}' exceeds ${limits.text.per_tag} chars.`);
      }
    }

    if (form.jacket && form.jacket.size > limits.files.jacket)
      throw new Error(`Jacket too large (Max ${formatBytes(limits.files.jacket)})`);
    if (form.chart && form.chart.size > limits.files.chart)
      throw new Error(`Chart too large (Max ${formatBytes(limits.files.chart)})`);
    if (form.bgm && form.bgm.size > limits.files.audio)
      throw new Error(`Audio too large (Max ${formatBytes(limits.files.audio)})`);
    if (form.preview && form.preview.size > limits.files.preview)
      throw new Error(`Preview too large (Max ${formatBytes(limits.files.preview)})`);
    if (form.background && form.background.size > limits.files.background)
      throw new Error(`Background too large (Max ${formatBytes(limits.files.background)})`);

    return true;
  };

  const parseApiError = async (res) => {
    try {
      const json = await res.json();
      return json.message || json.error || json.detail || JSON.stringify(json);
    } catch {
      return await res.text();
    }
  };

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
      const vis = form.visibility && typeof form.visibility === "string" ? form.visibility.toUpperCase() : "PUBLIC";
      const chartData = {
        title: form.title,
        artists: form.artists,
        author: form.author,
        rating: parseInt(form.rating),
        description: form.description,
        status: vis,
        includes_jacket: !!form.jacket,
        includes_audio: !!form.bgm,
        includes_chart: !!form.chart,
        includes_preview: !!form.preview,
        includes_background: !!form.background,
        delete_background: !!form.removeBackground,
        delete_preview: !!form.removePreview,
      };

      let parsedTags = [];
      if (form.tags) {
        parsedTags = Array.isArray(form.tags) ? form.tags : form.tags.split(",").map((t) => t.trim()).filter((t) => t);
        chartData.tags = parsedTags;
      }

      validateLimits({ ...chartData, tags: parsedTags }, "edit");

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
        body: formData,
      });

      if (!res.ok) {
        const errMsg = await parseApiError(res);
        if (res.status === 401) {
          clearExpiredSession(true, errMsg);
          return;
        }
        throw new Error(errMsg);
      }

      if (editData.status?.toLowerCase() !== vis.toLowerCase()) {
        try {
          const visRes = await fetch(`${APILink}/api/charts/${editData.id}/visibility/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: session },
            body: JSON.stringify({ status: vis }),
          });
          if (!visRes.ok) console.error("Visibility separate update failed", await visRes.text());
        } catch (e) {
          console.error("Failed to update visibility separately", e);
        }
      }

      setIsOpen(false);
      fetchCharts();
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      const vis = form.visibility && typeof form.visibility === "string" ? form.visibility.toUpperCase() : "PUBLIC";
      const chartData = {
        rating: parseInt(form.rating),
        title: form.title,
        artists: form.artists,
        author: form.author,
        includes_background: !!form.background,
        includes_preview: !!form.preview,
        status: vis,
      };

      let parsedTags = [];
      if (form.tags) {
        parsedTags = form.tags.split(",").map((t) => t.trim()).filter((t) => t);
        chartData.tags = parsedTags;
      }

      validateLimits({ ...chartData, tags: parsedTags }, "upload");

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
        body: formData,
      });

      if (!res.ok) {
        const errMsg = await parseApiError(res);
        if (res.status === 401) {
          clearExpiredSession(true, errMsg);
          return;
        }
        throw new Error(errMsg);
      }

      const result = await res.json();

      if (result && (result.id || result.data?.id)) {
        const newId = result.id || result.data?.id;
        try {
          const visRes = await fetch(`${APILink}/api/charts/${newId}/visibility/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: session },
            body: JSON.stringify({ status: vis }),
          });
          if (!visRes.ok) console.error("Initial visibility setting failed", await visRes.text());
        } catch (e) {
          console.error("Failed to set initial visibility", e);
        }
      }

      setIsOpen(false);
      fetchCharts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback((post) => {
    setDeletablePost(post);
    setActiveMenu(null);
  }, []);

  const actuallyDelete = async () => {
    if (!deletablePost) return;
    setLoading(true);
    try {
      const res = await fetch(`${APILink}/api/charts/${deletablePost.id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: session },
      });
      if (!res.ok) {
        const errMsg = await res.text();
        if (res.status === 401) {
          clearExpiredSession(true, errMsg);
          return;
        }
        throw new Error(errMsg);
      }
      fetchCharts();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletablePost(null);
      setLoading(false);
    }
  };

  const shouldShowPagination = () => {
    const total = totalCount || posts.length;
    return total > 10;
  };

  // ---- UPDATED: supports schedule-public when third arg is provided
  const updateVisibility = useCallback(
    async (post, newStatus, schedulePayload) => {
      const oldStatus = post.status;
      const oldScheduled = post.scheduled_publish ?? null;

      // optimistic only for normal visibility changes
      if (schedulePayload === undefined) {
        setPosts((currentPosts) =>
          currentPosts.map((p) => (p.id === post.id ? { ...p, status: newStatus.toUpperCase() } : p))
        );
      }

      try {
        const cleanId = post.id.toString().replace("UnCh-", "");

        const url =
          schedulePayload !== undefined
            ? `${APILink}/api/charts/${cleanId}/visibility/schedule-public/`
            : `${APILink}/api/charts/${cleanId}/visibility/`;

        const body = schedulePayload !== undefined ? schedulePayload : { status: newStatus.toUpperCase() };

        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: session },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(await res.text());

        // optimistic scheduled_publish update as ISO string (since backend uses pydantic model_dump)
        if (schedulePayload !== undefined) {
          const next =
            schedulePayload.publish_time === null
              ? null
              : new Date(schedulePayload.publish_time * 1000).toISOString();

          setPosts((currentPosts) =>
            currentPosts.map((p) => (p.id === post.id ? { ...p, scheduled_publish: next } : p))
          );
        }
      } catch (e) {
        console.error(e);

        // rollback
        setPosts((currentPosts) =>
          currentPosts.map((p) => {
            if (p.id !== post.id) return p;
            if (schedulePayload === undefined) return { ...p, status: oldStatus };
            return { ...p, scheduled_publish: oldScheduled };
          })
        );

        alert(t("dashboard.updateFailed", "Failed to update visibility"));
      }
    },
    [APILink, session, t]
  );

  const handleSearch = (e) => {
    e?.preventDefault();
    if (currentPage === 0) fetchCharts();
    else setCurrentPage(0);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header-row">
          <div className="header-left">
            <h1 className="welcome-text">
              <span>{t("dashboard.welcome", "Welcome")},</span>
              <span className="text-primary truncate max-w-full block">
                {mounted && sessionReady && sonolusUser ? sonolusUser.sonolus_username : "..."}
              </span>
            </h1>
          </div>

          <div className="header-actions">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder={t("dashboard.searchPlaceholder", "Search Chart")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button onClick={openUpload} className="upload-btn">
              <Plus size={20} className="plus-icon" />
              <span>{t("dashboard.newChart", "New Chart")}</span>
            </button>
          </div>
        </div>

        {loading && posts.length === 0 ? (
          <DashboardSkeleton />
        ) : (
          <div className="dashboard-structure">
            <aside className="dashboard-sidebar">
              <div className="sidebar-section">
                <div className="flex items-center justify-center gap-1 mb-3" onClick={() => setFiltersExpanded((p) => !p)}>
                  <div className="section-header">
                    <h3>Filter Search</h3>
                  </div>
                  <div className="flex-1 py-1 px-0">
                    <div className="h-0.5 bg-cyan-100/50 w-full" />
                  </div>
                  <div>
                    <ChevronDown className={"size-5 stroke-cyan-100/50 transition-all " + (!filtersExpanded && "rotate-180")} />
                  </div>
                </div>

                <form
                  onSubmit={handleSearch}
                  className="search-form overflow-hidden transition-all"
                  style={{ width: "100%", ...(filtersExpanded ? {} : { height: 0 }) }}
                >
                  <div className="search-controls-grid">
                    <div
                      className="search-control-group"
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        minWidth: "auto",
                        flex: "none",
                        paddingBottom: "12px",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="checkbox"
                        id="staffPick"
                        checked={staffPick}
                        onChange={(e) => setStaffPick(e.target.checked)}
                        className="accent-sky-500"
                        style={{ width: "18px", height: "18px", margin: 0, cursor: "pointer" }}
                      />
                      <label
                        htmlFor="staffPick"
                        style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255,255,255,0.9)", cursor: "pointer" }}
                      >
                        {t("search.staffPickOnly")}
                      </label>
                    </div>

                    <div className="search-control-group">
                      <label>{t("search.sortBy")}</label>
                      <LiquidSelect
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        options={[
                          { value: "created_at", label: t("search.createdDate", "Created Date"), icon: Clock },
                          { value: "rating", label: "Rating", icon: Star },
                          { value: "likes", label: "Likes", icon: Heart },
                          { value: "abc", label: "Alphabetical", icon: Type },
                          { value: "decaying_likes", label: "Decaying Likes", icon: User },
                        ]}
                      />
                    </div>

                    <div className="search-control-group">
                      <label>{t("search.order")}</label>
                      <LiquidSelect
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        options={[
                          { value: "asc", label: t("search.ascending"), icon: ArrowUp },
                          { value: "desc", label: t("search.descending"), icon: ArrowDown },
                        ]}
                      />
                    </div>

                    <div className="search-control-group">
                      <label>{t("search.minRating")}</label>
                      <input
                        type="number"
                        placeholder={t("search.minRatingPlaceholder")}
                        min="1"
                        max="99"
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                        className="liquid-input"
                      />
                    </div>

                    <div className="search-control-group">
                      <label>{t("search.maxRating")}</label>
                      <input
                        type="number"
                        placeholder={t("search.maxRatingPlaceholder")}
                        min="1"
                        max="99"
                        value={maxRating}
                        onChange={(e) => setMaxRating(e.target.value)}
                        className="liquid-input"
                      />
                    </div>

                    <div className="search-control-group">
                      <label>{t("search.descriptionIncludes", "Description Includes")}</label>
                      <input
                        type="text"
                        placeholder={t("search.descriptionPlaceholder", "Search in descriptions...")}
                        value={descriptionIncludes}
                        onChange={(e) => setDescriptionIncludes(e.target.value)}
                        className="liquid-input"
                      />
                    </div>

                    <div className="search-control-group">
                      <label>{t("search.titleIncludes")}</label>
                      <input
                        type="text"
                        placeholder="Search in titles..."
                        value={titleIncludes}
                        onChange={(e) => setTitleIncludes(e.target.value)}
                        className="liquid-input"
                      />
                    </div>

                    <div className="search-control-group">
                      <label>{t("search.artistsIncludes")}</label>
                      <input
                        type="text"
                        placeholder="Search in artists..."
                        value={artistsIncludes}
                        onChange={(e) => setArtistsIncludes(e.target.value)}
                        className="liquid-input"
                      />
                    </div>

                    <div className="search-control-group">
                      <label>{t("search.tags")}</label>
                      <input
                        type="text"
                        placeholder="Comma-separated tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="liquid-input"
                      />
                    </div>

                    <button type="submit" className="search-btn">
                      {t("search.search")}
                    </button>
                  </div>
                </form>
              </div>
            </aside>

            <main className="dashboard-main">
              {filteredPosts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎵</div>
                  {posts.length > 0 || searchQuery ? (
                    <h3>{t("dashboard.noResults", "No Results")}</h3>
                  ) : (
                    <>
                      <h3>{t("dashboard.noCharts", "No Charts Yet")}</h3>
                      <p>{t("dashboard.startUpload", "Upload your first chart to get started!")}</p>
                      <button onClick={openUpload} className="upload-btn mt-4">
                        <Plus size={18} className="plus-icon" /> {t("dashboard.uploadFirst", "Upload Now")}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="dashboard-grid">
                  {filteredPosts.map((post) => {
                    const isPublic = post.status === "PUBLIC";
                    const displayDate = isPublic ? post.publishedAt || post.createdAt : post.createdAt;
                    const dateLabel = isPublic ? t("dashboard.published", "Published") : t("dashboard.uploaded", "Uploaded");

                    const scheduledEpoch = getScheduledEpochSeconds(post);
                    const scheduledLabel = scheduledEpoch ? new Date(scheduledEpoch * 1000).toLocaleString() : null;

                    return (
                      <div key={post.id} className="chart-card-redesigned">
                        <div className="card-bg" style={{ backgroundImage: `url(${post.coverUrl || "/placeholder.png"})` }} />

                        <div className="card-thumb cursor-pointer" onClick={() => router.push(`/levels/UnCh-${post.id}`)}>
                          {post.coverUrl ? (
                            <img src={post.coverUrl} alt={post.title} loading="lazy" />
                          ) : (
                            <div className="placeholder-thumb">
                              <span className="no-img-text">No Image</span>
                            </div>
                          )}
                        </div>

                        <div className="card-info">
                          <div className="info-header">
                            <div className="flex items-center justify-start gap-2">
                              <h3 title={post.title}>{post.title}</h3>
                              <span title="Rating" className="rating-badge text-xs" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                Lv. {post.rating}
                              </span>
                            </div>

                            <div className="action-menu-wrapper">
                              <button
                                className="icon-btn-ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(activeMenu === post.id ? null : post.id);
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>

                              <div
                                className={`action-dropdown ${activeMenu === post.id ? "active" : ""}`}
                                style={{ display: activeMenu === post.id ? "flex" : "none" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(post.status === "PUBLIC" || post.status === "UNLISTED") && (
                                  <button onClick={() => router.push(`/levels/UnCh-${post.id}`)}>
                                    <Eye size={14} style={{ marginRight: "8px" }} /> {t("dashboard.view", "View")}
                                  </button>
                                )}
                                {sonolusUser && sonolusUser.sonolus_id === post.authorId && (
                                  <>
                                    <button onClick={() => openEdit(post)}>
                                      <Pencil size={14} style={{ marginRight: "8px" }} /> {t("dashboard.edit", "Edit")}
                                    </button>
                                    <button className="text-red" onClick={() => handleDelete(post)}>
                                      <Trash2 size={14} style={{ marginRight: "8px" }} /> {t("dashboard.delete", "Delete")}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="author-name">{post.author_field || post.author || "Unknown"}</span>
                          {post.scheduled_publish && (
                            <div
                              className="scheduled-badge"
                              title={post.scheduled_publish}
                              style={{
                                marginTop: "4px",
                                fontSize: "0.75rem",
                                opacity: 0.85,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Clock size={14} />
                              {t("dashboard.scheduledFor", "Scheduled for")}:{" "}
                              {new Date(post.scheduled_publish).toLocaleString()}
                            </div>
                          )}
                          <div
                            className="card-meta-row"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: "4px",
                              fontSize: "0.8rem",
                              color: "#64748b",
                              gap: "12px",
                            }}
                          >
                            <span className="commit-date" title={`${dateLabel}: ${displayDate}`}>
                              {displayDate ? new Date(displayDate).toLocaleDateString() : "Unknown Date"}
                            </span>

                            <div className="footer-stats" style={{ display: "flex", gap: "12px" }}>
                              <span title="Likes" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Heart size={12} /> {post.likeCount || 0}
                              </span>
                              <span title="Comments" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <MessageSquare size={12} /> {post.commentsCount || 0}
                              </span>
                            </div>

                            {/* Status + PUBLIC schedule popover */}
                            <div
                              style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
                              ref={scheduleMenuPostId === post.id ? scheduleAnchorRef : null}
                            >
                              <LiquidSelect
                                value={post.status}
                                type="ghost"
                                className={`status-text ${post.status?.toLowerCase()}`}
                                options={["UNLISTED", "PRIVATE", "PUBLIC"].map((x) => ({ value: x, label: x }))}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  if (next === "PUBLIC") {
                                    openScheduleMenu(post);
                                    return;
                                  }
                                  closeScheduleMenu();
                                  updateVisibility(post, next);
                                }}
                              />

                              {scheduleMenuPostId === post.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "calc(100% + 8px)",
                                    zIndex: 50,
                                    background: "rgba(20,20,20,0.95)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: "12px",
                                    padding: "10px",
                                    minWidth: "280px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                  }}
                                >
                                  <div className="text-xs opacity-75">{t("dashboard.publicOptions", "Public options")}</div>

                                  {/* Public now -> existing visibility route */}
                                  <button
                                    className="icon-btn-ghost"
                                    onClick={async () => {
                                      await updateVisibility(post, "PUBLIC");
                                      closeScheduleMenu();
                                    }}
                                  >
                                    {t("dashboard.publicNow", "Public Now")}
                                  </button>

                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <div className="text-xs opacity-75">{t("dashboard.schedulePublish", "Schedule publish")}</div>

                                    <input
                                      type="datetime-local"
                                      value={scheduleDtLocal}
                                      onChange={(e) => setScheduleDtLocal(e.target.value)}
                                      className="input"
                                    />

                                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                      <button className="icon-btn-ghost" onClick={closeScheduleMenu}>
                                        {t("dashboard.cancel", "Cancel")}
                                      </button>
                                      <button
                                        className="icon-btn-ghost"
                                        disabled={!scheduleDtLocal}
                                        onClick={async () => {
                                          const epoch = dtLocalToEpochSeconds(scheduleDtLocal);
                                          if (!epoch) return;
                                          await updateVisibility(post, post.status, { publish_time: epoch });
                                          closeScheduleMenu();
                                        }}
                                      >
                                        {t("dashboard.confirm", "Confirm")}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Remove schedule */}
                                  {scheduledEpoch && (
                                    <button
                                      className="icon-btn-ghost text-red"
                                      onClick={async () => {
                                        await updateVisibility(post, post.status, { publish_time: null });
                                        closeScheduleMenu();
                                      }}
                                    >
                                      {t("dashboard.removeSchedule", "Remove scheduled publish")}
                                    </button>
                                  )}

                                  {/* Display existing schedule */}
                                  {scheduledLabel && (
                                    <div className="text-xs opacity-75">
                                      {t("dashboard.scheduledFor", "Scheduled for")}: {scheduledLabel}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {shouldShowPagination() && (
                <div className="pagination-wrapper">
                  <PaginationControls currentPage={currentPage} pageCount={pageCount} onPageChange={setCurrentPage} />
                </div>
              )}
            </main>
          </div>
        )}

        {deletablePost && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <h3>{t("dashboard.confirmDelete", "Are you sure you want to delete this chart?")}</h3>
              <p className="text-slate-400 text-sm mt-2">{deletablePost.title}</p>
              <div className="modal-actions">
                <button onClick={() => setDeletablePost(null)} className="btn-cancel">
                  {t("dashboard.cancel", "Cancel")}
                </button>
                <button onClick={actuallyDelete} className="btn-delete">
                  {t("dashboard.delete", "Delete")}
                </button>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}