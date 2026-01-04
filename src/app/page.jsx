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

      if (actualType === 'quick') {
        if (searchQuery) queryParams.append('meta_includes', searchQuery);
        queryParams.append('sort_by', searchType === 'newest' ? 'created_at' : sortBy);
        queryParams.append('sort_order', sortOrder);
      } else if (searchType === 'advanced') {
        if (minRating) queryParams.append('min_rating', minRating);
        if (maxRating) queryParams.append('max_rating', maxRating);
        if (tags) queryParams.append('tags', tags);
        if (minLikes) queryParams.append('min_likes', minLikes);
        if (maxLikes) queryParams.append('max_likes', maxLikes);
        if (likedBy) queryParams.append('liked_by', 'true');
        if (titleIncludes) queryParams.append('title_includes', titleIncludes);
        if (descriptionIncludes) queryParams.append('description_includes', descriptionIncludes);
        if (artistsIncludes) queryParams.append('artists_includes', artistsIncludes);
        if (searchQuery) queryParams.append('meta_includes', searchQuery);

        queryParams.append('sort_by', sortBy);
        queryParams.append('sort_order', sortOrder);
      }

      const res = await fetch(`${apiBase}/api/charts?${queryParams.toString()}`);
      const json = await res.json();
      const base = json.asset_base_url || "";

      const rawData = (json.data || []).map(item => mapChartData(item, base));
      // Deduplicate posts by ID
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
  }, [APILink, searchType, page, staffPick, searchQuery, sortBy, sortOrder, minRating, maxRating, tags, minLikes, maxLikes, likedBy, titleIncludes, descriptionIncludes, artistsIncludes, mapChartData, setPosts, setPageCount, setTotalResults, setLoading, setError]);

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
    if (viewParam === 'search') {
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
                        placeholder="Search in titles..."
                        value={titleIncludes}
                        onChange={(e) => setTitleIncludes(e.target.value)}
                        className="liquid-input"
                      />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.artistsIncludes')}</label>
                      <input
                        type="text"
                        placeholder="Search in artists..."
                        value={artistsIncludes}
                        onChange={(e) => setArtistsIncludes(e.target.value)}
                        className="liquid-input"
                      />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.tags')}</label>
                      <input
                        type="text"
                        placeholder="Comma-separated tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
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
                      <label htmlFor="likedByMe" style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}>Liked by me</label>
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
