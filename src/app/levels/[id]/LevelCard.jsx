'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Heart, MessageSquare, Share2, Copy, ExternalLink, ArrowLeft, User, Music, Play, Pause, Volume2, Star, Download, Eye, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import WaveformPlayer from '../../../components/waveform-player/WaveformPlayer';
import FormattedText from '../../../components/formatted-text/FormattedText';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useUser } from '../../../contexts/UserContext';
import "./LevelCard.css";


const StatWithGraph = ({ icon: Icon, label, value, color, data }) => {
  const { t } = useLanguage();

  // Validate and sanitize data
  const safeData = Array.isArray(data) && data.length > 0
    ? data.map(d => (typeof d === 'number' && !isNaN(d) ? d : 0))
    : [0, 0];

  // Need at least 2 points for a line graph
  const chartData = safeData.length < 2 ? [safeData[0] || 0, safeData[0] || 0] : safeData;

  const width = 156;
  const height = 76;
  const max = Math.max(...chartData, 1);
  const min = Math.min(...chartData);
  const range = max - min || 1;

  const points = chartData.map((d, i) => {
    const x = chartData.length > 1 ? (i / (chartData.length - 1)) * width : width / 2;
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
        <div className="stat-icon" style={{ background: `${color}26`, color: color }}>
          <Icon size={18} />
        </div>
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
};

export default function LevelCard({ initialLevel, id, SONOLUS_SERVER_URL }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { sonolusUser, session } = useUser();
  const sonolusServerUrl = SONOLUS_SERVER_URL;

  const [level, setLevel] = useState(initialLevel);
  const [loading, setLoading] = useState(!initialLevel);
  const [error, setError] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformBars, setWaveformBars] = useState([]);
  const audioRef = useRef(null);



  useEffect(() => {
    if (!level && id) {
      const fetchLevelClient = async () => {
        try {
          const headers = {};
          if (session) {
            headers['Authorization'] = session;
          }

          // Try fetching from internal API (which might proxy or handle auth better)
          const cleanId = id.replace(/^UnCh-/, '');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanId}/`, { headers });

          if (response.ok) {
            const json = await response.json();
            // Shim the data structure to match server-side fetchLevel
            const data = json.data;
            const base = json.asset_base_url;
            const buildAssetUrl = (hash) => hash && base && data.author ? `${base}/${data.author}/${data.id}/${hash}` : null;

            setLevel({
              id: data.id,
              sonolusId: id,
              title: data.title || 'Untitled Level',
              description: data.description || 'No description provided.',
              thumbnail: buildAssetUrl(data.jacket_file_hash),
              authorId: data.author,
              author: data.author_full || data.author || 'Unknown',
              artists: data.artists || 'Unknown Artist',
              rating: data.rating || 0,
              likes: data.likes || data.like_count || 0,
              comments: Number.isInteger(data.comments_count) ? data.comments_count : (Number.isInteger(data.comment_count) ? data.comment_count : (Array.isArray(data.comments) ? data.comments.length : 0)),
              createdAt: data.created_at || data.createdAt,
              music_hash: data.music_file_hash || (data.music && data.music.hash),
              backgroundUrl: buildAssetUrl(data.background_file_hash || (data.background && data.background.hash)),
              backgroundV3Url: buildAssetUrl(data.background_v3_file_hash || (data.backgroundV3 && data.backgroundV3.hash)),
              scheduled_publish: data.scheduled_publish || null,
              status: data.status || 'PUBLIC',
            });
          } else {
            // Fallback to /api/levels/ endpoint if charts fails?
            // But existing countdown page used /api/levels/
            setError('not_found');
          }
        } catch (err) {
          console.error("Client fetch error", err);
          setError('error');
        } finally {
          setLoading(false);
        }
      };

      fetchLevelClient();
    }
  }, [id, level, session]); // Retry if session becomes available

  if (loading) return <div className="level-loading"><div className="loading-spinner"></div></div>;
  if (error || !level) return (
    <div className="level-error-container" style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
      <h1>{t('common.error', 'Error')}</h1>
      <p>{t('errors.levelNotFound', 'Level not found or you do not have permission to view it.')}</p>
      <Link href="/" className="back-btn" style={{ display: 'inline-block', marginTop: '20px' }}>
        {t('levelDetail.back', 'Back')}
      </Link>
    </div>
  );

  const getSonolusLink = () => {
    if (!SONOLUS_SERVER_URL) return '';
    const serverWithoutSchema = SONOLUS_SERVER_URL.replace(/^https?:\/\//, '');
    const sonolusId = level.sonolusId || `UnCh-${level.id}`;
    return `https://open.sonolus.com/${serverWithoutSchema}/levels/${sonolusId}`;
  };

  const handleCopyEmbed = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || '');
    const embedUrl = `${origin}/embed/${level.sonolusId || 'UnCh-' + level.id}`;
    const embedCode = `<iframe src="${embedUrl}" width="450" height="240" style="border:none;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.4);" title="${level.title} - UntitledCharts" loading="lazy"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      alert(t('levelDetail.embedCopied'));
    } catch (e) {
      alert(`${t('levelDetail.failedToCopy')}: ${e.message}`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: level.title,
        text: `Check out ${level.title} on UntitledCharts!`,
        url: window.location.href
      }).catch(console.error);
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href)
          .then(() => alert('Link copied!'))
          .catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(window.location.href);
          });
      } else {
        fallbackCopyTextToClipboard(window.location.href);
      }
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    var textArea = document.createElement("textarea");
    textArea.value = text;


    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      if (successful) alert('Link copied!');
      else alert('Failed to copy link');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      alert('Failed to copy link manually');
    }

    document.body.removeChild(textArea);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    setWaveformBars(Array.from({ length: 50 }).map(() => ({
      height: 20 + Math.random() * 30,
      delay: Math.random() * 0.5
    })));

    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('durationchange', updateDuration);
      audio.addEventListener('ended', () => setIsPlaying(false));


      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }


      audio.volume = volume;

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('durationchange', updateDuration);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);



  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const bgmUrl = level.asset_base_url && level.music_hash
    ? `${level.asset_base_url}/${level.authorId || level.author}/${level.id}/${level.music_hash}`
    : null;

  const [showFullDesc, setShowFullDesc] = useState(false);
  const [commentCount, setCommentCount] = useState(level.commentsCount || 0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [trends, setTrends] = useState({ likes: [], comments: [] });
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    const fetchSupplementalInfo = async () => {
      const rawSonolusId = level.sonolusId || '';
      const cleanChartId = rawSonolusId.replace(/^UnCh-/, '');

      if (!cleanChartId) {
        console.warn("No valid chartId found for supplemental fetch");
        return;
      }

      try {

        const infoRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanChartId}/`);
        if (infoRes.ok) {
          const data = await infoRes.json();
          const count = data.comment_count !== undefined
            ? data.comment_count
            : (data.data && data.data.comment_count !== undefined ? data.data.comment_count : undefined);

          if (count !== undefined) {
            setCommentCount(count);
          }
        }


        const trendsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanChartId}/trends/`);
        if (trendsRes.ok) {
          const trendsData = await trendsRes.json();
          setTrends({
            likes: Array.isArray(trendsData.likes) ? trendsData.likes : [],
            comments: Array.isArray(trendsData.comments) ? trendsData.comments : []
          });
        }
      } catch (e) {
        console.error("Failed to fetch supplemental or trends info", e);
      }
    };
    fetchSupplementalInfo();
  }, [level.sonolusId]);

  const totalComments = (commentCount > 0 ? commentCount : (level.commentsCount || commentCount || 0));

  useEffect(() => {
    const fetchComments = async () => {
      const rawSonolusId = level.sonolusId || '';
      const cleanChartId = rawSonolusId.replace(/^UnCh-/, '');

      if (!cleanChartId) return;

      setLoadingComments(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanChartId}/comment/?page=${page - 1}`);

        if (res.ok) {
          const data = await res.json();
          const commentsList = Array.isArray(data) ? data : (data.data || []);
          setComments(commentsList);

          setTotalPages(Math.ceil(totalComments / 10) || 1);
        } else if (res.status === 404) {
          setComments([]);
          setTotalPages(1);
        }
      } catch (e) {
        console.error("Failed to fetch comments", e);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [level.id, page, totalComments]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);


  const likesHistory = (trends.likes && trends.likes.length > 0)
    ? trends.likes
    : [0, 0, 0, 0, 0, 0, level.likes || 0];


  const commentsVal = loadingComments ? totalComments : (commentCount || 0);
  const commentsHistory = (trends.comments && trends.comments.length > 0)
    ? trends.comments
    : [0, 0, 0, 0, 0, 0, commentsVal];



  return (
    <main className="level-detail-wrapper animate-fade-in">
      <div
        className="level-bg-blur"
        style={{
          backgroundImage: level.backgroundV3Url ? `url(${level.backgroundV3Url})` :
            level.backgroundUrl ? `url(${level.backgroundUrl})` :
              level.thumbnail ? `url(${level.thumbnail})` : 'none'
        }}
      />

      <div className="back-btn-container">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (window.history.length > 2) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          className="back-btn"
          style={{ position: 'relative', zIndex: 51 }}
        >
          <ArrowLeft size={20} />
          {t('levelDetail.back')}
        </button>
      </div>

      <div className="level-detail-container">
        <div className="level-top-section">
          <div className="level-image-container">
            {level.thumbnail ? (
              <img
                src={level.thumbnail}
                className="level-cover"
                alt={level.title}
              />
            ) : (
              <div className="level-cover placeholder">
                <span>{t('common.noImage')}</span>
              </div>
            )}
          </div>

          <div className="level-info">
            {/* Title with Marquee support if text is long */}
            <div className="level-title-wrapper" style={{ overflow: 'hidden', marginBottom: '16px' }}>
              {(level.title && level.title.length > 25) ? (
                <div className="marquee-container" style={{ width: '100%' }}>
                  <div className="marquee-track always-scroll" style={{ animationDuration: `${Math.max(10, level.title.length * 0.2)}s` }}>
                    <h1 className="level-title" style={{ margin: 0, padding: 0, whiteSpace: 'nowrap' }}>{level.title}</h1>
                    <h1 className="level-title" style={{ margin: 0, padding: 0, whiteSpace: 'nowrap' }} aria-hidden="true">{level.title}</h1>
                  </div>
                </div>
              ) : (
                <h1 className="level-title">{level.title}</h1>
              )}
            </div>

            <div className="level-credits">
              <div className="level-credit-item">
                <span className="credit-label">{t('levelDetail.by')}</span>
                <span><FormattedText text={level.artists || 'Unknown Artist'} /></span>
              </div>
              <div className="level-credit-item">
                <span className="credit-label">{t('levelDetail.chartedBy')}</span>
                <Link href={`/user/${level.authorId || level.author}`} className="charter-link"><FormattedText text={level.author} /></Link>
              </div>
              <div className="level-credit-item">
                <span className="credit-label"><Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /></span>
                <span>{level.createdAt ? new Date(level.createdAt).toLocaleDateString() : 'Unknown Date'}</span>
              </div>
            </div>

            {level.description && (
              <div className="level-description" style={{ width: '100%', textAlign: 'left', boxSizing: 'border-box' }}>
                <FormattedText text={level.description} />
              </div>
            )}

            <div className="music-player">
              <div className="features-background">
                {bgmUrl && (
                  <WaveformPlayer
                    audioRef={audioRef}
                    isPlaying={isPlaying}
                  />
                )}
              </div>

              <div className="player-content-wrapper">
                <div className="player-info">
                  <div className="player-text">
                    <span className="player-title">{level.title}</span>
                  </div>
                  <span className="player-duration">{formatTime(currentTime)} / {duration ? formatTime(duration) : '--:--'}</span>
                </div>

                <div className="player-controls">
                  <button className="play-btn" onClick={togglePlay}>
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  { }
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        setCurrentTime(time);
                        if (audioRef.current) audioRef.current.currentTime = time;
                      }}
                      className="player-progress-slider"
                      style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '2px',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  <div className="volume-control">
                    <Volume2 size={18} />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="volume-slider"
                      style={{ width: '60px' }}
                    />
                  </div>
                </div>
              </div>

              {bgmUrl && (
                <audio
                  ref={audioRef}
                  src={bgmUrl.startsWith('http') ? `/api/audio-proxy?url=${encodeURIComponent(bgmUrl)}` : bgmUrl}
                  preload="metadata"
                  style={{ display: 'none' }}
                  crossOrigin="anonymous"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => console.warn("Audio error", e)}
                />
              )}
            </div>

            <div className="level-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const url = getSonolusLink();
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="action-btn btn-sonolus"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              >
                {t('levelDetail.openViaSonolus')} <img src="https://sonolus.com/logo.png" alt="Sonolus" style={{ height: '1.2em', verticalAlign: 'middle', marginLeft: '6px' }} />
              </button>
              <button
                onClick={handleShare}
                className="action-btn"
              >
                <Share2 size={18} />
                {t('levelDetail.share')}
              </button>
            </div>

          </div>


        </div>
      </div>

      <div className="level-bottom-section">
        <div className="stats-card">
          <h3 className="stats-title">
            <Star size={18} fill="currentColor" />
            {t('levelDetail.statistics')}
          </h3>
          <div className="stats-list">
            <StatWithGraph
              icon={Heart}
              label={t('levelDetail.likes')}
              value={level.likes || 0}
              color="#f87171"
              data={likesHistory}
            />
            <StatWithGraph
              icon={MessageSquare}
              label={t('levelDetail.comments')}
              value={commentsVal}
              color="#38bdf8"
              data={commentsHistory}
            />
          </div>
        </div>

        <div className="comments-card">
          <h3 className="stats-title" style={{ marginBottom: '20px' }}>
            <MessageSquare size={18} />
            {t('levelDetail.comments')} ({totalComments})
          </h3>

          {loadingComments ? (
            <p className="comments-placeholder">Loading comments...</p>
          ) : comments.length > 0 ? (
            <>
              <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {comments.map((comment, i) => (
                  <div key={i} className="comment-item" style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'baseline', gap: '8px' }}>
                      <span className="comment-username-wrapper" style={{
                        fontWeight: '600',
                        color: '#38bdf8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '70%',
                        flexShrink: 1,
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}>
                        {(comment.user_id || comment.userId || comment.author_id || (comment.user && comment.user.id)) ? (
                          <Link
                            href={`/user/${comment.user_id || comment.userId || comment.author_id || (comment.user && comment.user.id)}`}
                            style={{
                              color: 'inherit',
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FormattedText text={comment.username || "User"} />
                          </Link>
                        ) : (
                          <FormattedText text={comment.username || "User"} />
                        )}
                      </span>
                      <span style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <div style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.95em' }}>
                      <FormattedText text={comment.content} />
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="comments-pagination" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '24px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px'
                }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="pagination-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 18px',
                      background: page === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: page === 1 ? '#64748b' : '#38bdf8',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ChevronLeft size={18} />
                    Prev
                  </button>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#f8fafc',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '8px 16px',
                    borderRadius: '8px'
                  }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="pagination-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 18px',
                      background: page >= totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: page >= totalPages ? '#64748b' : '#38bdf8',
                      cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="comments-placeholder">No comments yet.</p>
          )}
        </div>
      </div>

      {/* Countdown overlay removed in favor of inline display */}
      {/* 
         Actually, I'll put it INLINE inside level-info. 
         I will NOT use the overlay code at the end of the file.
         I will insert it in the replacement chunk for level-info or similar.
      */}
    </main>
  );
}
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
