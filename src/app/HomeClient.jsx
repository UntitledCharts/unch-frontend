"use client";
import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Zap, Shuffle, PlayCircle, Settings, Clock, Star, Heart, Type, ArrowUp, ArrowDown, User } from "lucide-react";
import ChartsList from "../components/charts-list/ChartsList";
import PaginationControls from "../components/pagination-controls/PaginationControls";
import HeroSection from "../components/hero-section/HeroSection";
import TrendingCarousel from "../components/trending-carousel/TrendingCarousel";
import "../components/trending-carousel/TrendingCarousel.css";
import HomepageChartCard from "../components/homepage-chart-card/HomepageChartCard";
import "./page.css";
import { useLanguage } from "../contexts/LanguageContext";
import { useUser } from "../contexts/UserContext";
import { useSearchParams } from "next/navigation";
import LiquidSelect from "../components/liquid-select/LiquidSelect";
import { cachedFetch } from "../utils/fetchCache";

const ViewAllDrawer = dynamic(() => import("../components/view-all-drawer/ViewAllDrawer"), { ssr: false });

const APILink = process.env.NEXT_PUBLIC_API_URL;

let _homeCache = null;
let _homeCacheTime = 0;
const HOME_CACHE_TTL = 60_000;

function HomeContent() {
  const { t } = useLanguage();
  const { sonolusUser } = useUser();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState("home");

  const hasCached = _homeCache && (Date.now() - _homeCacheTime < HOME_CACHE_TTL);
  const [homeData, setHomeData] = useState(hasCached ? _homeCache : {
    staffPicks: [],
    trending: [],
    newCharts: []
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(!hasCached);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("newest");
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
      artists: item.artists || t('common.unknownArtist'),
      author: authorName,
      authorId: item.author || "",
      authorHandle: item.author_handle || item.author || "",
      assetBaseUrl: baseUrl,
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
      const [staffPicksJson, trendingJson, newJson] = await Promise.all([
        cachedFetch(`${APILink}/api/charts?type=advanced&staff_pick=1&limit=10`),
        cachedFetch(`${APILink}/api/charts?type=advanced&sort_by=decaying_likes&limit=10`),
        cachedFetch(`${APILink}/api/charts?page=0&type=quick&limit=10`)
      ]);

      const base = staffPicksJson.asset_base_url || trendingJson.asset_base_url || "";

      const data = {
        staffPicks: (staffPicksJson.data || []).map(item => mapChartData(item, base)),
        trending: (trendingJson.data || []).map(item => mapChartData(item, base)),
        newCharts: (newJson.data || []).map(item => mapChartData(item, base))
      };
      _homeCache = data;
      _homeCacheTime = Date.now();
      setHomeData(data);
    } catch (err) {
      console.error("Home fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [mapChartData]);

  const fetchSearchData = useCallback(async () => {
    setLoading(true);
    try {
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

      const res = await fetch(`${APILink}/api/charts?${queryParams.toString()}`);
      const json = await res.json();
      const base = json.asset_base_url || "";
      const rawData = (json.data || []).map(item => mapChartData(item, base));
      const uniquePosts = Array.from(new Map(rawData.map(item => [item.id, item])).values());

      setPosts(uniquePosts);
      const infiniteScrollTypes = ['newest'];
      setPageCount(json.pages || json.pageCount || (infiniteScrollTypes.includes(searchType) ? (page + 2) : 1));
      setTotalResults(json.total || (json.items?.length || json.data?.length || 0));
    } catch (err) {
      console.error(err);
      setError("Failed to load charts.");
    } finally {
      setLoading(false);
    }
  }, [searchType, page, staffPick, searchQuery, sortBy, sortOrder, minRating, maxRating, tags, minLikes, maxLikes, likedBy, titleIncludes, descriptionIncludes, artistsIncludes, mapChartData, sonolusHandleIs]);

  useEffect(() => {
    if (viewMode === 'home') {
      if (_homeCache && Date.now() - _homeCacheTime < HOME_CACHE_TTL) {
        setHomeData(_homeCache);
        setLoading(false);
      } else {
        fetchHomeData();
      }
    } else {
      fetchSearchData();
    }
  }, [viewMode, fetchHomeData, fetchSearchData]);

  const handleSearch = (e) => {
    e?.preventDefault();
    setPage(0);
    fetchSearchData();
  };

  const handlePlay = (id, bgmUrl = null) => {
    if (!bgmUrl) return;
    const proxied = bgmUrl.startsWith("http") && !bgmUrl.startsWith(window.location.origin)
      ? `/api/audio-proxy?url=${encodeURIComponent(bgmUrl)}`
      : bgmUrl;
    play(id, proxied, { title: "", thumbnail: "", href: "" });
  };

  const handleStop = (id) => {
    if (trackId === id) pause();
  };

  const handleAudioRef = () => {};

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

  const handleViewAll = useCallback((title, charts, fetchType = null) => {
    setDrawerTitle(title);
    setDrawerCharts(charts);
    setDrawerFetchType(fetchType);
    setDrawerOpen(true);
  }, []);

  const newChartsIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M6 10H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  );

  const trendingIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 20H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 16V10C10 8.89543 9.10457 8 8 8C6.89543 8 6 8.89543 6 10V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18 16V6C18 4.89543 17.1046 4 16 4C14.8954 4 14 4.89543 14 6V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  );

  const handleViewAllNew = useCallback(() => {
    handleViewAll(t('home.newCharts'), homeData.newCharts, "new");
  }, [handleViewAll, t, homeData.newCharts]);

  const handleViewAllTrending = useCallback(() => {
    handleViewAll(t('home.trendingCharts'), homeData.trending, "trending");
  }, [handleViewAll, t, homeData.trending]);

  return (
    <div className="home-container">

      {viewMode === 'home' ? (
        <div className="home-content animate-fade-in">
          <HeroSection posts={homeData.staffPicks} />

          <div className="carousel-section-wrapper">
            <TrendingCarousel
              title={t('home.newCharts')}
              icon={newChartsIcon}
              charts={homeData.newCharts}
              CardComponent={HomepageChartCard}
              onViewAll={handleViewAllNew}
            />
          </div>

          <div className="carousel-section-wrapper">
            <TrendingCarousel
              title={t('home.trendingCharts')}
              icon={trendingIcon}
              charts={homeData.trending}
              CardComponent={HomepageChartCard}
              onViewAll={handleViewAllTrending}
            />
          </div>

          <ViewAllDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title={drawerTitle}
            initialCharts={drawerCharts}
            fetchType={drawerFetchType}
            apiBase={APILink}
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
            <div className="search-filter-header">
              <span>{t('nav.search', 'search')}</span>
            </div>
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
                    <div className="search-control-group checkbox-group">
                      <input
                        type="checkbox"
                        id="staffPick"
                        checked={staffPick}
                        onChange={(e) => setStaffPick(e.target.checked)}
                        className="styled-checkbox"
                      />
                      <label htmlFor="staffPick" className="checkbox-label">{t('search.staffPickOnly')}</label>
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
                      <input type="number" placeholder={t('search.minRatingPlaceholder')} min="1" max="99" value={minRating} onChange={(e) => setMinRating(e.target.value)} className="liquid-input" />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.maxRating')}</label>
                      <input type="number" placeholder={t('search.maxRatingPlaceholder')} min="1" max="99" value={maxRating} onChange={(e) => setMaxRating(e.target.value)} className="liquid-input" />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.descriptionIncludes', 'Description Includes')}</label>
                      <input type="text" placeholder={t('search.descriptionPlaceholder', 'Search in descriptions...')} value={descriptionIncludes} onChange={(e) => setDescriptionIncludes(e.target.value)} className="liquid-input" />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.titleIncludes')}</label>
                      <input type="text" placeholder={t('search.titlePlaceholder', 'Search in titles...')} value={titleIncludes} onChange={(e) => setTitleIncludes(e.target.value)} className="liquid-input" />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.artistsIncludes')}</label>
                      <input type="text" placeholder={t('search.artistsPlaceholder', 'Search in artists...')} value={artistsIncludes} onChange={(e) => setArtistsIncludes(e.target.value)} className="liquid-input" />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.tags')}</label>
                      <input type="text" placeholder={t('search.tagsPlaceholder', 'Comma-separated tags')} value={tags} onChange={(e) => setTags(e.target.value)} className="liquid-input" />
                    </div>
                    <div className="search-control-group">
                      <label>{t('search.authorHandle', 'Author Handle')}</label>
                      <input type="text" placeholder={t('search.authorHandlePlaceholder', 'e.g. 78302')} value={sonolusHandleIs} onChange={(e) => setSonolusHandleIs(e.target.value)} className="liquid-input" />
                    </div>
                    {sonolusUser && (
                    <div className="search-control-group checkbox-group">
                      <input type="checkbox" id="likedByMe" checked={likedBy} onChange={(e) => setLikedBy(e.target.checked)} className="styled-checkbox" />
                      <label htmlFor="likedByMe" className="checkbox-label">{t('search.likedByMe', 'Liked by me')}</label>
                    </div>
                    )}
                  </>
                )}

                <button type="submit" className="search-btn">{t('search.search')}</button>
              </div>
            </form>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <ChartsList
              posts={posts}
              loading={loading}
              sonolusUser={sonolusUser}
            />
          </div>

          {searchType === "random" ? (
            <button
              className="search-btn"
              style={{ marginTop: '24px', width: '100%' }}
              onClick={(e) => { e.preventDefault(); fetchSearchData(); }}
            >
              {t('search.reroll', 'Reroll')}
            </button>
          ) : pageCount > 1 && (
            <PaginationControls
              currentPage={page}
              pageCount={pageCount}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function HomeClient() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
