"use client";
import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { Loader2, TrendingUp, Sparkles, Zap, Shuffle, PlayCircle, Settings, Clock, Star, Heart, Type, ArrowUp, ArrowDown, User } from "lucide-react";
import ChartsList from "../components/charts-list/ChartsList";
import PaginationControls from "../components/pagination-controls/PaginationControls";
import HeroSection from "../components/hero-section/HeroSection";
import TrendingCarousel from "../components/trending-carousel/TrendingCarousel";
import "../components/trending-carousel/TrendingCarousel.css";
import HomepageChartCard from "../components/homepage-chart-card/HomepageChartCard";
import "./page.css";
import { useLanguage } from "../contexts/LanguageContext";
import { useUser } from "../contexts/UserContext";
import { useRouter, useSearchParams } from "next/navigation";
import ViewAllDrawer from "../components/view-all-drawer/ViewAllDrawer";

const APILink = process.env.NEXT_PUBLIC_API_URL;

import LiquidSelect from "../components/liquid-select/LiquidSelect";

function HomeContent() {
  const { t } = useLanguage();
  const { sonolusUser } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = useState("home");

  const [homeData, setHomeData] = useState({
    staffPicks: [],
    trending: [],
    newCharts: []
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("newest");
  const [metaIncludes, setMetaIncludes] = useState("title");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [minLikes, setMinLikes] = useState("");
  const [maxLikes, setMaxLikes] = useState("");
  const [titleIncludes, setTitleIncludes] = useState("");
  const [descriptionIncludes, setDescriptionIncludes] = useState("");
  const [artistsIncludes, setArtistsIncludes] = useState("");
  const [tags, setTags] = useState("");
  const [likedBy, setLikedBy] = useState(false);
  const [staffPick, setStaffPick] = useState(false);
  const [sonolusHandleIs, setSonolusHandleIs] = useState("");

  useEffect(() => {
    const handle = searchParams.get('sonolus_handle_is');
    if (handle) {
      setSonolusHandleIs(handle);
      setSearchType('advanced');
      setViewMode('search');
    }
  }, [searchParams]);

  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRefs = useRef({});
  const globalAudioRef = useRef(null);
  const [globalBgmUrl, setGlobalBgmUrl] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerCharts, setDrawerCharts] = useState([]);
  const [drawerFetchType, setDrawerFetchType] = useState(null);

  const mapChartData = useCallback((item, baseUrl = "") => {
    const authorHash = item.author;
    const authorName = item.author_full || item.author || "Unknown";

    const coverHash = item.jacket_file_hash || (item.cover ? item.cover.hash : null);
    const bgmHash = item.music_file_hash || (item.bgm ? item.bgm.hash : null);
    const backgroundHash = item.background_file_hash || (item.background ? item.background.hash : null);
    const backgroundV3Hash = item.background_v3_file_hash || (item.backgroundV3 ? item.backgroundV3.hash : null);

    const coverUrl = (baseUrl && coverHash && authorHash)
      ? `${baseUrl}/${authorHash}/${item.id}/${coverHash}`
      : (item.coverUrl || (item.cover ? item.cover.url : null) || (item.thumbnail ? item.thumbnail.url : null));

    const bgmUrl = (baseUrl && bgmHash && authorHash)
      ? `${baseUrl}/${authorHash}/${item.id}/${bgmHash}`
      : (item.bgmUrl || (item.bgm ? item.bgm.url : null));

    const backgroundUrl = (baseUrl && backgroundHash && authorHash)
      ? `${baseUrl}/${authorHash}/${item.id}/${backgroundHash}`
      : (item.backgroundUrl || null);

    const backgroundV3Url = (baseUrl && backgroundV3Hash && authorHash)
      ? `${baseUrl}/${authorHash}/${item.id}/${backgroundV3Hash}`
      : (item.backgroundV3Url || null);

    const mapped = {
      ...item,
      id: item.id || item.name || "",
      title: item.title,
      artists: item.artists || "Unknown Artist",
      author: authorName,
      coverUrl: coverUrl,
      bgmUrl: bgmUrl,
      backgroundUrl: backgroundUrl,
      backgroundV3Url: backgroundV3Url,
      likeCount: item.likeCount ?? item.likes ?? item.like_count ?? 0,
      commentsCount: item.comment_count ?? item.commentsCount ?? (Array.isArray(item.comments) ? item.comments.length : item.comments) ?? item.comments_count ?? 0,
      rating: item.rating ?? 0,
      createdAt: item.createdAt || item.created_at,
    };
    return mapped;
  }, []);

  const fetchHomeData = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = APILink;

      const [staffPicksRes, trendingRes, newRes] = await Promise.all([
        fetch(`${apiBase}/api/charts?type=advanced&staff_pick=1&limit=10`),
        fetch(`${apiBase}/api/charts?type=advanced&sort_by=decaying_likes&limit=10`),
        fetch(`${apiBase}/api/charts?page=0&type=quick&limit=10`)
      ]);

      const staffPicksJson = await staffPicksRes.json();
      const trendingJson = await trendingRes.json();
      const newJson = await newRes.json();

      const base = staffPicksJson.asset_base_url || trendingJson.asset_base_url || "";

      setHomeData({
        staffPicks: (staffPicksJson.data || []).map(item => mapChartData(item, base)),
        trending: (trendingJson.data || []).map(item => mapChartData(item, base)),
        newCharts: (newJson.data || []).map(item => mapChartData(item, base))
      });
      setLoading(false);
    } catch (err) {
      console.error("Home fetch error:", err);
      setLoading(false);
    }
  }, [APILink, mapChartData, setHomeData, setLoading]);

  const fetchSearchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = APILink;

      const queryParams = new URLSearchParams();
      const actualType = searchType === 'newest' ? 'quick' : searchType;
      queryParams.append('type', actualType);
      queryParams.append('page', page.toString());
      queryParams.append('limit', '10');

      if (staffPick && actualType !== 'random') queryParams.append('staff_pick', '1');

      if (sonolusHandleIs) queryParams.append('sonolus_handle_is', sonolusHandleIs);

      if (actualType === 'quick') {
        if (searchQuery) queryParams.append('meta_includes', searchQuery);
        queryParams.append('sort_by', searchType === 'newest' ? 'created_at' : sortBy);
        queryParams.append('sort_order', sortOrder);
      } else if (searchType === 'advanced') {
        if (titleIncludes) queryParams.append('title_includes', titleIncludes);
        else if (searchQuery) queryParams.append('title_includes', searchQuery);
        if (descriptionIncludes) queryParams.append('description_includes', descriptionIncludes);
        if (artistsIncludes) queryParams.append('artists_includes', artistsIncludes);
        if (minRating) queryParams.append('minR', minRating);
        if (maxRating) queryParams.append('maxR', maxRating);
        if (typeof tags === 'string' && tags.trim()) queryParams.append('tags', tags.trim());
        else if (Array.isArray(tags) && tags.length > 0) queryParams.append('tags', tags.join(','));
        if (minLikes) queryParams.append('minL', minLikes);
        if (maxLikes) queryParams.append('maxL', maxLikes);
        if (likedBy) queryParams.append('liked_by', '1');
        queryParams.append('sort_by', sortBy);
        queryParams.append('sort_order', sortOrder);
      }

      const res = await fetch(`${apiBase}/api/charts?${queryParams.toString()}`);
      const json = await res.json();
      const base = json.asset_base_url || "";

      const rawData = (json.data || []).map(item => mapChartData(item, base));
      
      const uniquePosts = Array.from(new Map(rawData.map(item => [item.id, item])).values());

      setPosts(uniquePosts);
      const infiniteScrollTypes = ['newest'];
      setPageCount(json.pages || json.pageCount || (infiniteScrollTypes.includes(searchType) ? (page + 2) : 1));
      setTotalResults(json.total || (json.items?.length || json.data?.length || 0));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load charts.");
      setLoading(false);
    }
  }, [APILink, searchType, page, staffPick, searchQuery, sortBy, sortOrder, minRating, maxRating, tags, minLikes, maxLikes, likedBy, titleIncludes, descriptionIncludes, artistsIncludes, mapChartData, setPosts, setPageCount, setTotalResults,
    setLoading,
    setError,
    sonolusHandleIs
  ]);

  const FullLoading = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <Loader2 className="animate-spin" size={48} style={{ color: '#38bdf8' }} />
    </div>
  );

  useEffect(() => {
    if (viewMode === 'home') {
      fetchHomeData();
    } else {
      fetchSearchData();
    }
  }, [viewMode, fetchHomeData, fetchSearchData, refreshKey]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim().toLowerCase() === "jadixexposed") {
      router.push("/?view=jadixexposed-egg-2026");
      return;
    }
    setPage(0);
    fetchSearchData();
  };

  const handlePlay = (id, bgmUrl = null) => {
    if (currentlyPlaying && currentlyPlaying !== id) {
      const prevAudio = audioRefs.current[currentlyPlaying];
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    if (bgmUrl) {
      if (currentlyPlaying === id) {
        if (globalAudioRef.current) {
          globalAudioRef.current.pause();
          setCurrentlyPlaying(null);
        }
      } else {
        setGlobalBgmUrl(bgmUrl);
        setCurrentlyPlaying(id);
      }
    } else {
      setCurrentlyPlaying(id);
    }
  };

  useEffect(() => {
    if (globalAudioRef.current && globalBgmUrl && currentlyPlaying) {
      globalAudioRef.current.load();
      globalAudioRef.current.play().catch(e => console.log("Global play error:", e));
    }
  }, [globalBgmUrl, currentlyPlaying]);

  const handleStop = (id) => {
    if (currentlyPlaying === id) {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
      }
      setCurrentlyPlaying(null);
    }
  };

  const handleAudioRef = (id, ref) => {
    audioRefs.current[id] = ref;
  };

  const viewParam = searchParams.get('view');

  useEffect(() => {
    if (viewParam === 'jadixexposed-egg-2026') {
      setViewMode('jadixexposed-egg-2026');
      setLoading(false);
    } else if (viewParam === 'search') {
      setViewMode('search');
      if (viewMode !== 'search') {
        setLoading(true);
      }
    } else {
      setViewMode('home');
    }
  }, [viewParam]);

  const handleViewAll = (title, charts, fetchType = null) => {
    setDrawerTitle(title);
    setDrawerCharts(charts);
    setDrawerFetchType(fetchType);
    setDrawerOpen(true);
  };

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (e.target.closest('.homepage-chart-card')) return;

      if (currentlyPlaying) {
        if (globalAudioRef.current) globalAudioRef.current.pause();
        setCurrentlyPlaying(null);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [currentlyPlaying]);

  return (
    <div className="home-container">
      <audio ref={globalAudioRef} src={globalBgmUrl} loop style={{ display: 'none' }} />

      {viewMode === 'home' ? (
        <div className="home-content animate-fade-in">
          <HeroSection posts={homeData.staffPicks} />

          <div className="carousel-section-wrapper">
            <TrendingCarousel
              title={t('home.newCharts')}
              icon={<Sparkles size={28} className="text-blue-400" />}
              charts={homeData.newCharts}
              onPlay={handlePlay}
              currentlyPlaying={currentlyPlaying}
              audioRefs={audioRefs}
              onStop={handleStop}
              CardComponent={HomepageChartCard}
              onViewAll={() => handleViewAll(t('home.newCharts'), homeData.newCharts, "new")}
            />
          </div>

          <div className="carousel-section-wrapper">
            <TrendingCarousel
              title={t('home.trendingCharts')}
              icon={<TrendingUp size={28} className="text-pink-400" />}
              charts={homeData.trending}
              onPlay={handlePlay}
              currentlyPlaying={currentlyPlaying}
              audioRefs={audioRefs}
              onStop={handleStop}
              CardComponent={HomepageChartCard}
              onViewAll={() => handleViewAll(t('home.trendingCharts'), homeData.trending, "trending")}
            />
          </div>

          <ViewAllDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title={drawerTitle}
            initialCharts={drawerCharts}
            fetchType={drawerFetchType}
            apiBase={APILink}
            audioRefs={audioRefs}
            currentlyPlaying={currentlyPlaying}
            onPlay={handlePlay}
            onStop={handleStop}
          />

          <div className="home-footer-action" style={{ textAlign: 'center', marginTop: 60, marginBottom: 40 }}>
            <Link href="/?view=search">
              <button className="btn-primary-large">
                {t('home.exploreAll')}
              </button>
            </Link>
          </div>
        </div>
      ) : viewMode === 'jadixexposed-egg-2026' ? (
        <div className="easter-egg-content animate-fade-in" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: '100vh',
          padding: '120px 20px 60px',
          gap: '30px',
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            color: '#fff',
            textAlign: 'center',
            textShadow: '0 0 20px rgba(255, 100, 200, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            margin: 0
          }}>
            <img src="/Untitled1472_20260120224400.jpg" alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
            You found the secret!
            <img src="/Untitled1472_20260120224400.jpg" alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: '600px', margin: 0 }}>
            Congratulations on discovering the Jadixexposed Easter Egg! Here are some exclusive images:
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px',
            justifyContent: 'center',
            alignItems: 'flex-start',
            maxWidth: '900px',
            width: '100%'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              flex: '1 1 300px',
              maxWidth: '400px'
            }}>
              <img
                src="/Untitled1472_20260120224400.jpg"
                alt="Jadixexposed"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  display: 'block'
                }}
              />
              <p style={{ color: '#fff', textAlign: 'center', marginTop: '12px', marginBottom: 0, fontSize: '0.9rem' }}>
                Jadixexposed Original, a.k.a Jadix in a maid costume exposed by his muscular man
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              flex: '1 1 300px',
              maxWidth: '400px'
            }}>
              <img
                src="/reiyunlover.png"
                alt="Reiyunlover"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  display: 'block'
                }}
              />
              <p style={{ color: '#fff', textAlign: 'center', marginTop: '12px', marginBottom: 0, fontSize: '0.9rem' }}>
                Reiyunlover
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              flex: '1 1 300px',
              maxWidth: '400px'
            }}>
              <img
                src="/Untitled1498_20260206013808.webp"
                alt="New Jadix Image"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  display: 'block'
                }}
              />
              <p style={{ color: '#fff', textAlign: 'center', marginTop: '12px', marginBottom: 0, fontSize: '0.9rem' }}>
                Jadix saying "Welcome Home, Master"
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '900px',
            marginTop: '10px'
          }}>
            {}
            <div style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '16px',
              padding: '20px 24px',
              flex: '1 1 300px',
              maxWidth: '600px'
            }}>
              <p style={{
                color: '#fff',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                margin: 0,
                fontStyle: 'italic',
                textAlign: 'center'
              }}>
                "Hai hai! ReiyuN here~ Congratulations for finding this silly page about Jadix! I do lots of abominations so expect more things to pile up here whenever Jadix gets punished by me since I occasionally draw something for him whenever he does something stupid. That's all bai bai!!"
                <br /><br />
                <span style={{ fontWeight: 'bold', color: '#a855f7' }}>-ReiyuN</span>
              </p>
            </div>

            {}
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '20px 24px',
              flex: '1 1 300px',
              maxWidth: '600px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <p style={{
                color: '#fff',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                margin: 0,
                fontStyle: 'italic',
                textAlign: 'center'
              }}>
                “if you see this, theres a missile coming to your house right now”
                <br /><br />
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>-Jadix</span>
              </p>
            </div>
          </div>

          <Link href="/" style={{
            marginTop: '10px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)',
            borderRadius: '8px',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 'bold',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
          }}>
            ← Back to Home
          </Link>
        </div>
      ) : (
        <div className="search-content animate-fade-in" style={{ width: '100%', maxWidth: '1000px', margin: '120px auto 0' }}>
          <div className="searchContainer">
            <form onSubmit={handleSearch} className="search-form" style={{ width: '100%' }}>
              <div className="search-controls-grid">
                <div className="search-control-group">
                  <label>{t('search.searchType')}</label>
                  <LiquidSelect
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    options={[
                      { value: "newest", label: t('search.newest', 'Newest'), icon: Zap },
                      { value: "random", label: t('search.random'), icon: Shuffle },
                      { value: "quick", label: t('search.quick', 'Quick'), icon: PlayCircle },
                      { value: "advanced", label: t('search.advanced'), icon: Settings }
                    ]}
                  />
                </div>

                {searchType !== "random" && searchType !== "newest" && (
                  <>
                    <div className="search-control-group" style={{ flexDirection: 'row', alignItems: 'center', minWidth: 'auto', flex: 'none', paddingBottom: '12px', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="staffPick"
                        checked={staffPick}
                        onChange={(e) => setStaffPick(e.target.checked)}
                        className="accent-sky-500"
                        style={{ width: '18px', height: '18px', margin: 0, cursor: 'pointer' }}
                      />
                      <label htmlFor="staffPick" style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}>{t('search.staffPickOnly')}</label>
                    </div>



                    <div className="search-control-group">
                      <label>{t('search.sortBy')}</label>
                      <LiquidSelect
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        options={[
                          { value: "created_at", label: t('search.createdDate', 'Created Date'), icon: Clock },
                          { value: "rating", label: "Rating", icon: Star },
                          { value: "likes", label: "Likes", icon: Heart },
                          { value: "abc", label: "Alphabetical", icon: Type },
                          { value: "decaying_likes", label: "Decaying Likes", icon: User }
                        ]}
                      />
                    </div>

                    <div className="search-control-group">
                      <label>{t('search.order')}</label>
                      <LiquidSelect
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        options={[
                          { value: "asc", label: t('search.ascending'), icon: ArrowUp },
                          { value: "desc", label: t('search.descending'), icon: ArrowDown }
                        ]}
                      />
                    </div>
                  </>
                )}

                {searchType !== "random" && (
                  <div className="search-control-group">
                    <label>{t('search.keywords')}</label>
                    <input
                      type="text"
                      placeholder={t('search.keywordsPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="liquid-input"
                    />
                  </div>
                )}

                {searchType === "advanced" && (
                  <>
                    <div className="search-control-group">
                      <label>{t('search.minRating')}</label>
                      <input
                        type="number"
                        placeholder={t('search.minRatingPlaceholder')}
                        min="1"
                        max="99"
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                        className="liquid-input"
                      />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.maxRating')}</label>
                      <input
                        type="number"
                        placeholder={t('search.maxRatingPlaceholder')}
                        min="1"
                        max="99"
                        value={maxRating}
                        onChange={(e) => setMaxRating(e.target.value)}
                        className="liquid-input"
                      />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.descriptionIncludes', 'Description Includes')}</label>
                      <input
                        type="text"
                        placeholder={t('search.descriptionPlaceholder', 'Search in descriptions...')}
                        value={descriptionIncludes}
                        onChange={(e) => setDescriptionIncludes(e.target.value)}
                        className="liquid-input"
                      />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.titleIncludes')}</label>
                      <input
                        type="text"
                        placeholder={t('search.titlePlaceholder', 'Search in titles...')}
                        value={titleIncludes}
                        onChange={(e) => setTitleIncludes(e.target.value)}
                        className="liquid-input"
                      />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.artistsIncludes')}</label>
                      <input
                        type="text"
                        placeholder={t('search.artistsPlaceholder', 'Search in artists...')}
                        value={artistsIncludes}
                        onChange={(e) => setArtistsIncludes(e.target.value)}
                        className="liquid-input"
                      />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.tags')}</label>
                      <input
                        type="text"
                        placeholder={t('search.tagsPlaceholder', 'Comma-separated tags')}
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="liquid-input"
                      />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.authorHandle', 'Author Handle')}</label>
                      <input
                        type="text"
                        placeholder={t('search.authorHandlePlaceholder', 'e.g. 78302')}
                        value={sonolusHandleIs}
                        onChange={(e) => setSonolusHandleIs(e.target.value)}
                        className="liquid-input"
                      />
                    </div>
                    <div className="search-control-group" style={{ flexDirection: 'row', alignItems: 'center', minWidth: 'auto', flex: 'none', paddingBottom: '12px' }}>
                      <input
                        type="checkbox"
                        id="likedByMe"
                        checked={likedBy}
                        onChange={(e) => setLikedBy(e.target.checked)}
                        className="accent-sky-500"
                        style={{ width: '18px', height: '18px', margin: 0, cursor: 'pointer' }}
                      />
                      <label htmlFor="likedByMe" style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}>{t('search.likedByMe', 'Liked by me')}</label>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="search-btn"
                >
                  {t('search.search')}
                </button>
              </div>
            </form>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <ChartsList
              posts={posts}
              loading={loading}
              currentlyPlaying={currentlyPlaying}
              audioRefs={audioRefs}
              onPlay={handlePlay}
              onStop={handleStop}
              onAudioRef={handleAudioRef}
              sonolusUser={sonolusUser}
            />
          </div>

          <PaginationControls
            currentPage={page}
            pageCount={pageCount}
            onPageChange={setPage}
            posts={posts}
            totalCount={totalResults}
            isRandom={searchType === 'random'}
            onReroll={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
