'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Heart, MessageSquare, Share2, Copy, ExternalLink, ArrowLeft, User, Music, Play, Pause, Volume2, Star, Download, Eye, EyeOff, ChevronLeft, ChevronRight, Calendar, MoreVertical, Lock, Trash2, Ban, ShieldCheck, UserX, X, Trophy, Info, ChevronDown } from 'lucide-react';
import WaveformPlayer from '../../../components/waveform-player/WaveformPlayer';
import FormattedText from '../../../components/formatted-text/FormattedText';
import AdminPanel from '../../../components/admin-actions/AdminPanel';
import LiquidSelect from '../../../components/liquid-select/LiquidSelect';
import MarqueeText from '../../../components/marquee-text/MarqueeText';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useUser } from '../../../contexts/UserContext';
import { useAudioPlayer } from '../../../contexts/AudioPlayerContext';
import NotFound from '../../not-found';
import "./LevelCard.css";

const DEFAULT_PFP = "/defpfp.webp";

function AuthorPopout({ authorId, anchorRect }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!authorId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${authorId}`)
      .then(r => r.ok ? r.json() : null)
      .then(res => { if (res?.account) setData({ ...res.account, _base: res.asset_base_url || '' }); })
      .catch(() => {});
  }, [authorId]);

  const base = data?._base || '';
  const uid = data?.sonolus_id || authorId;
  const profileUrl = (data?.profile_hash && base && uid) ? `${base}/${uid}/profile/${data.profile_hash}_webp` : DEFAULT_PFP;
  const bannerUrl = (data?.banner_hash && base && uid) ? `${base}/${uid}/banner/${data.banner_hash}_webp` : '/def.webp';

  if (!anchorRect) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: `${window.innerHeight - anchorRect.top + 8}px`,
      left: `${anchorRect.left}px`,
      width: '200px',
      background: 'rgba(8,12,24,0.96)',
      border: '1px solid rgba(56,189,248,0.25)',
      borderRadius: '14px',
      overflow: 'hidden',
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      pointerEvents: 'none',
      animation: 'popout-in 0.2s cubic-bezier(0.4,0,0.2,1) forwards',
    }}>
      <style>{`@keyframes popout-in { from { opacity:0; transform:scale(0.94) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      <div style={{
        width: '100%', height: '70px',
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundColor: 'rgba(56,189,248,0.08)', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px',
          background: 'linear-gradient(to right, rgba(8,12,24,0.7) 0%, rgba(8,12,24,0.3) 100%)',
        }}>
          <img src={profileUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.5)', objectFit: 'cover', flexShrink: 0 }}
            onError={(e) => { e.target.src = DEFAULT_PFP; }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {data?.sonolus_username || data?.sonolus_id || authorId}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}


const StatWithGraph = ({ icon: Icon, label, value, color, data }) => {
  const { t, tReact } = useLanguage();

  const safeData = Array.isArray(data) && data.length > 0
    ? data.map(d => (typeof d === 'number' && !isNaN(d) ? d : 0))
    : [0, 0];

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

  const [isOpen, setIsOpen] = useState(true);

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
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('is_preview') === 'true';
  const { t, tReact } = useLanguage();
  const { sonolusUser, session } = useUser();
  const sonolusServerUrl = SONOLUS_SERVER_URL;

  const [levelData, setLevel] = useState(initialLevel);
  const [loading, setLoading] = useState(!initialLevel);
  const [error, setError] = useState(null);

  const {
    audioRef,
    trackId,
    trackMeta,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    setVolume,
    loadTrack,
    play: ctxPlay,
    togglePlay: ctxTogglePlay,
    seek,
  } = useAudioPlayer();  const [showMenu, setShowMenu] = useState(false);
  const [showAuthorPopout, setShowAuthorPopout] = useState(false);
  const [authorAnchorRect, setAuthorAnchorRect] = useState(null);
  const authorLinkRef = useRef(null);
  const authorTimerRef = useRef(null);

  const handleAuthorEnter = () => {
    authorTimerRef.current = setTimeout(() => {
      if (authorLinkRef.current) setAuthorAnchorRect(authorLinkRef.current.getBoundingClientRect());
      setShowAuthorPopout(true);
    }, 250);
  };
  const handleAuthorLeave = () => {
    clearTimeout(authorTimerRef.current);
    setShowAuthorPopout(false);
  };


  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardTotalPages, setLeaderboardTotalPages] = useState(1);
  const [leaderboardType, setLeaderboardType] = useState('arcade_score_speed');

  const updateVisibility = async (newStatus) => {
    try {
      const cleanId = id.replace(/^UnCh-/, '');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': session,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setLevel({ ...levelData, status: newStatus });
        setShowMenu(false);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update visibility');
    }
  };

  const toggleStaffPick = async () => {
    try {
      const cleanId = id.replace(/^UnCh-/, '');
      const newVal = !levelData.staffPick;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanId}/stpick/`, {
        method: 'PATCH',
        headers: {
          'Authorization': session,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: newVal })
      });
      if (res.ok) {
        setLevel({ ...levelData, staffPick: newVal });
        setShowMenu(false);
      } else {
        alert('Failed to toggle staff pick');
      }
    } catch {
      alert('Error toggling staff pick');
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('levelDetail.confirmDelete', 'Are you sure you want to delete this chart?'))) return;
    try {
      const cleanId = id.replace(/^UnCh-/, '');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanId}/delete/`, {
        method: 'DELETE',
        headers: { 'Authorization': session }
      });
      if (res.ok) {
        router.push('/');
      } else {
        alert('Failed to delete');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting chart');
    }
  };

  const handleBanUser = async () => {
    alert("User banning is temporarily disabled.");
    /*
    if (!confirm(`Are you sure you want to BAN ${level.authorHandle || level.author}?`)) return;
    try {
      const res = await fetch('/api/staff-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ban', targetId: level.author || level.authorId, params: { delete: false } })
      });
      if (res.ok) alert('User banned');
      else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to ban user: ${data.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error banning user');
    }
    */
  };

  const handleDeleteAccount = async () => {
    alert("Account deletion is temporarily disabled.");
    /*
    if (!confirm(`Are you sure you want to DELETE ${level.authorHandle || level.author}? ALL DATA WILL BE LOST.`)) return;
    try {
      const res = await fetch('/api/staff-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteAccount', targetId: level.authorId })
      });
      if (res.ok) {
        alert('User deleted');
        router.push('/');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to delete user: ${data.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting user');
    }
    */
  };

  const updateConstant = async (newConstant) => {
    try {
      const cleanId = id.replace(/^UnCh-/, '');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanId}/constant_rate`, {
        method: 'PATCH',
        headers: { 'Authorization': session, 'Content-Type': 'application/json' },
        body: JSON.stringify({ constant: newConstant })
      });
      if (res.ok) {
        alert('Difficulty constant updated successfully!');
        setLevel(prev => ({ ...prev, rating: newConstant }));
      } else {
        const err = await res.json();
        alert(`Failed to update constant: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error updating constant');
    }
  };


  useEffect(() => {
    if (!levelData && id) {
      const fetchLevelClient = async () => {
        try {
          const headers = {};
          if (session) {
            headers['Authorization'] = session;
          }

          const cleanId = id.replace(/^UnCh-/, '');
          const previewParam = isPreview ? '?is_preview=true' : '';
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanId}/${previewParam}`, { headers });

          if (response.ok) {
            const json = await response.json();
            const data = json.data;

            if (data.status === 'PRIVATE') {
              const isOwner = sonolusUser?.sonolus_id === data.author;
              const isStaff = sonolusUser?.isAdmin || sonolusUser?.isMod;
              if (!isOwner && !isStaff) {
                setError('not_found');
                setLoading(false);
                return;
              }
            }

            const base = json.asset_base_url;
            const buildAssetUrl = (hash) => hash && base && data.author ? `${base}/${data.author}/${data.id}/${hash}` : null;

            setLevel({
              id: data.id,
              sonolusId: id,
              title: data.title || 'Untitled Level',
              description: data.description || 'No description provided.',
              thumbnail: buildAssetUrl(data.jacket_file_hash),
              authorId: data.author,
              authorHandle: data.author_handle || data.author,
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
              asset_base_url: base,
              downloads: data.downloads || data.download_count || 0,
              plays: data.plays || data.play_count || data.views || 0,
              staffPick: data.staffPick || data.staff_pick || false,
            });
          } else {
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
  }, [id, levelData, session]);

  const handleDeleteComment = async (commentId) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiBase}/api/charts/${id.replace('UnCh-', '')}/comment/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': session }
      });
      if (res.ok) {
        setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
        setCommentCount(prevCount => Math.max(0, prevCount - 1));
      } else {
        alert("Failed to delete comment");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting comment");
    }
  };



  // use the cached meta so the player doesn't disappear on navigation back.
  const effectiveLevel = levelData || (trackId === id && trackMeta ? {
    title: trackMeta.title,
    thumbnail: trackMeta.thumbnail,
    description: null,
    artists: null,
    author: null,
    authorHandle: null,
    authorId: null,
    rating: null,
    createdAt: null,
    likes: 0,
    comments: 0,
    status: null,
    staffPick: false,
    asset_base_url: null,
    music_hash: null,
    backgroundUrl: null,
    backgroundV3Url: null,
    sonolusId: id,
    id: null,
  } : null);

  if (loading && !effectiveLevel) return (<div className="level-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 300px)' }}><div className="loading-spinner"></div></div>);
  if (error || !effectiveLevel) return <NotFound message={t('error.chartNotFound')} />;

  const level = effectiveLevel;

  const getSonolusLink = () => {
    if (!SONOLUS_SERVER_URL) return '';
    const serverWithoutSchema = SONOLUS_SERVER_URL.replace(/^https?:\/\//, '');
    const sonolusId = levelData.sonolusId || `UnCh-${levelData.id}`;
    return `https://open.sonolus.com/${serverWithoutSchema}/levels/${sonolusId}`;
  };

  const handleCopyEmbed = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const embedUrl = `${origin}/embed/${levelData.sonolusId || 'UnCh-' + levelData.id}`;
    const embedCode = `<iframe src="${embedUrl}" width="450" height="240" style="border:none;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.4);" title="${levelData.title} - UntitledCharts" loading="lazy"></iframe>`;
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
        title: levelData.title,
        text: `Check out ${levelData.title} on UntitledCharts!`,
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

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const bgmUrl = level.asset_base_url && level.music_hash
    ? `${level.asset_base_url}/${level.authorId || level.author}/${level.id}/${level.music_hash}`
    : null;

  const proxiedBgmUrl = bgmUrl
    ? (bgmUrl.startsWith('http') ? `/api/audio-proxy?url=${encodeURIComponent(bgmUrl)}` : bgmUrl)
    : null;

  const isThisTrackLoaded = trackId === id;
  const hasAudio = !!(proxiedBgmUrl || isThisTrackLoaded);

  useEffect(() => {
    if (isThisTrackLoaded && level.title && trackMeta && trackMeta.title !== level.title) {
      loadTrack(id, proxiedBgmUrl || '', {
        title: level.title,
        thumbnail: level.thumbnail,
        href: `/levels/${id}`,
      });
    }
  }, [isThisTrackLoaded, level.title]);

  const togglePlay = () => {
    if (isThisTrackLoaded) {
      ctxTogglePlay();
    } else if (proxiedBgmUrl) {
      ctxPlay(id, proxiedBgmUrl, {
        title: level.title,
        thumbnail: level.thumbnail,
        href: `/levels/${id}`,
      });
    }
  };

  const DESC_LIMIT = 300;
  const descText = levelData.description || '';
  const descNeedsExpand = descText.length > DESC_LIMIT;

  const [showFullDesc, setShowFullDesc] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [trends, setTrends] = useState({ likes: [], comments: [] });
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    const fetchSupplementalInfo = async () => {
      const rawSonolusId = levelData.sonolusId || '';
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
  }, [levelData.sonolusId]);

  const totalComments = (commentCount > 0 ? commentCount : (levelData.commentsCount || commentCount || 0));

  useEffect(() => {
    const fetchCommentsWithCount = async () => {
      const rawSonolusId = levelData.sonolusId || '';
      const cleanChartId = rawSonolusId.replace(/^UnCh-/, '');
      if (!cleanChartId) return;

      setLoadingComments(true);
      try {
        const countRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanChartId}/`);
        if (countRes.ok) {
          const countData = await countRes.json();
          const d = countData.data || countData;
          const count = d.comments_count ?? d.comment_count ?? 0;
          if (count > 0) {
            setCommentCount(count);
            setTotalPages(Math.ceil(count / 5) || 1);
          }
        }

        const apiPage = Math.floor((page - 1) / 2);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanChartId}/comment/?page=${apiPage}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          const fullList = Array.isArray(data) ? data : (data.data || []);
          const isFirstHalf = (page % 2 !== 0);
          setComments(isFirstHalf ? fullList.slice(0, 5) : fullList.slice(5, 10));
        } else if (res.status === 404) {
          setComments([]);
        }
      } catch (e) {
        console.error("Failed to fetch comments", e);
      } finally {
        setLoadingComments(false);
      }
    };
    fetchCommentsWithCount();
  }, [levelData.id, page]);


  useEffect(() => {
    const fetchLeaderboard = async () => {
      const rawSonolusId = levelData.sonolusId || '';
      const cleanChartId = rawSonolusId.replace(/^UnCh-/, '');
      if (!cleanChartId) return;

      setLeaderboardLoading(true);
      try {
        const apiPage = Math.floor((leaderboardPage - 1) / 2);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/charts/${cleanChartId}/leaderboards/?page=${apiPage}&leaderboard_type=${leaderboardType}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          let pagedItems = Array.isArray(data) ? data : (data.data || data.records || []);

          const isFirstHalf = (leaderboardPage % 2 !== 0);
          pagedItems = isFirstHalf ? pagedItems.slice(0, 5) : pagedItems.slice(5, 10);

          setLeaderboard(pagedItems);
          const apiTotalPages = data.pageCount || data.total_pages || 1;
          setLeaderboardTotalPages(apiTotalPages * 2);
        } else {
          setLeaderboard([]);
          setLeaderboardTotalPages(1);
        }
      } catch (e) {
        console.error("Failed to fetch leaderboard", e);
        setLeaderboard([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    if (levelData.sonolusId) {
      fetchLeaderboard();
    }
  }, [levelData.sonolusId, leaderboardPage, leaderboardType]);



  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);


  const likesHistory = (trends.likes && trends.likes.length > 0)
    ? trends.likes
    : [0, 0, 0, 0, 0, 0, levelData.likes || 0];


  const commentsVal = loadingComments ? totalComments : (commentCount || 0);
  const commentsHistory = (trends.comments && trends.comments.length > 0)
    ? trends.comments
    : [0, 0, 0, 0, 0, 0, commentsVal];



  return (
    <main className="level-detail-wrapper animate-fade-in">
      <div
        className="level-bg-blur"
        style={{
          backgroundImage: levelData.backgroundV3Url ? `url(${levelData.backgroundV3Url})` :
            levelData.backgroundUrl ? `url(${levelData.backgroundUrl})` :
              levelData.thumbnail ? `url(${levelData.thumbnail})` : 'none'
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
        >
          <ArrowLeft size={20} />
          {t('levelDetail.back')}
        </button>
      </div>

      <div className="level-detail-container">
        <div className="level-top-section">
          <div className="level-image-container" style={{ position: 'relative' }}>
            {levelData.thumbnail ? (
              <>
                <img
                  src={levelData.thumbnail}
                  className="level-cover-aura"
                  alt=""
                  aria-hidden="true"
                />
                <img
                  src={levelData.thumbnail}
                  className="level-cover"
                  alt={levelData.title}
                  fetchPriority="high"
                  loading="eager"
                />
              </>
            ) : (
              <div className="level-cover placeholder">
                <span>{t('common.noImage')}</span>
              </div>
            )}
            {(levelData.rating !== undefined && levelData.rating !== null) && (
              <div className="lv-badge" style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#38bdf8',
                zIndex: 2,
                letterSpacing: '0.5px'
              }}>
                Lv. {parseFloat(Number(levelData.rating || 0).toFixed(2))}
              </div>
            )}
          </div>

          <div className="level-info">
            <div className="level-title-wrapper" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MarqueeText textComponent="h1" className="level-title" maxLength={20}>
                {levelData.title}
              </MarqueeText>
              {levelData.staffPick && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  color: '#fbbf24',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  boxShadow: '0 0 10px rgba(251,191,36,0.1)',
                  whiteSpace: 'nowrap'
                }} title={t('levelDetail.staffPick')}>
                  <Star fill="currentColor" size={14} style={{ marginRight: '4px' }} />
                  {t('levelDetail.staffPick').toUpperCase()}
                </div>
              )}
            </div>

            <div className="level-credits">
              <div className="level-credit-item">
                {tReact('levelDetail.by', {
                  1: <span><FormattedText text={levelData.artists || t('common.unknownArtist')} /></span>
                })}
              </div>
              <div className="level-credit-item">
                {tReact('levelDetail.chartedBy', {
                  1: <span
                    ref={authorLinkRef}
                    style={{ position: 'relative', display: 'inline-block' }}
                    onMouseEnter={handleAuthorEnter}
                    onMouseLeave={handleAuthorLeave}
                  >
                    <Link href={`/user/${levelData.authorHandle || levelData.authorId}`} className="charter-link">
                      <FormattedText text={levelData.author} />
                    </Link>
                    {showAuthorPopout && (
                      <AuthorPopout authorId={levelData.authorId} anchorRect={authorAnchorRect} />
                    )}
                  </span>
                })}
              </div>
              <div className="level-credit-item">
                <span className="credit-label"><Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /></span>
                <span
                  title={levelData.createdAt ? (() => {
                    const d = new Date(levelData.createdAt);
                    const offset = -d.getTimezoneOffset();
                    const sign = offset >= 0 ? '+' : '-';
                    const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
                    const m = String(Math.abs(offset) % 60).padStart(2, '0');
                    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${d.toLocaleTimeString('en-US')} UTC${sign}${h}:${m}`;
                  })() : ''}
                  style={{ cursor: 'default' }}
                >
                  {levelData.createdAt ? (() => { const d = new Date(levelData.createdAt); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : 'Unknown Date'}
                </span>
              </div>
            </div>

            {levelData.description && (
              <div className="level-description" style={{ width: '100%', textAlign: 'left', boxSizing: 'border-box' }}>
                <FormattedText text={descNeedsExpand && !showFullDesc ? descText.slice(0, DESC_LIMIT) + '…' : descText} />
                {descNeedsExpand && (
                  <button
                    onClick={() => setShowFullDesc(v => !v)}
                    className="desc-read-more-btn"
                  >
                    {showFullDesc ? t('common.readLess', 'Read Less') : t('common.readMore', 'Read More')}
                  </button>
                )}
              </div>
            )}

            <div className="music-player">
              <div className="features-background">
                {isThisTrackLoaded && (
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
                  <span className="player-duration">
                    {isThisTrackLoaded ? formatTime(currentTime) : '0:00'} / {isThisTrackLoaded && duration ? formatTime(duration) : '--:--'}
                  </span>
                </div>

                <div className="player-controls">
                  <button
                    className={`play-btn ${isBuffering && isThisTrackLoaded ? 'buffering' : ''}`}
                    onClick={togglePlay}
                    disabled={!hasAudio}
                    aria-label={isPlaying && isThisTrackLoaded ? t('levelDetail.pause', 'Pause') : t('levelDetail.play', 'Play')}
                  >
                    {isBuffering && isThisTrackLoaded ? (
                      <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (isPlaying && isThisTrackLoaded) ? <Pause size={24} /> : <Play size={24} />}
                  </button>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="range"
                      min="0"
                      max={isThisTrackLoaded ? (duration || 100) : 100}
                      value={isThisTrackLoaded ? currentTime : 0}
                      onChange={(e) => seek(parseFloat(e.target.value))}
                      className="player-progress-slider"
                      aria-label={t('levelDetail.seekBar', 'Seek')}
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
                    <Volume2 size={18} aria-hidden="true" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="volume-slider"
                      aria-label={t('levelDetail.volume', 'Volume')}
                      style={{ width: '60px' }}
                    />
                  </div>
                </div>
              </div>
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
                {tReact('levelDetail.openViaSonolus', { 1: <img src="https://sonolus.com/logo.png" alt="Sonolus" style={{ height: '1.2em', verticalAlign: 'middle', marginLeft: '6px' }} /> })}
              </button>
              <button
                onClick={handleShare}
                className="action-btn"
              >
                <Share2 size={18} />
                {t('levelDetail.share')}
              </button>
              {levelData.status !== 'PUBLIC' && !isPreview && levelData.scheduled_publish && (() => {
                const isOwner = sonolusUser?.sonolus_id === levelData.authorId;
                const isMod = sonolusUser?.isAdmin || sonolusUser?.isMod;
                const canPreview = levelData.status === 'UNLISTED' || isOwner || isMod;
                if (!canPreview) return null;
                return (
                  <button
                    onClick={() => router.push(`/levels/${id}?is_preview=true`)}
                    className="action-btn"
                  >
                    <Eye size={18} />
                    {t('levelDetail.previewChartPage', 'Preview Chart Page')}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="level-bottom-section">
        <div className="level-bottom-left">
          <AdminPanel
            targetType="chart"
            targetData={{ status: levelData.status, staffPick: levelData.staffPick || levelData.staff_pick, staff_pick: levelData.staff_pick || levelData.staffPick, authorId: levelData.authorId, constant: levelData.rating }}
            currentUser={sonolusUser}
            onAction={(action) => {
              if (action === 'toggleVisibility') {
                updateVisibility(levelData.status === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC');
              } else if (action === 'setVisibilityPublic') {
                updateVisibility('PUBLIC');
              } else if (action === 'setVisibilityPrivate') {
                updateVisibility('PRIVATE');
              } else if (action === 'setVisibilityUnlisted') {
                updateVisibility('UNLISTED');
              } else if (action === 'toggleStaffPick') {
                toggleStaffPick();
              } else if (action === 'deleteChart') {
                handleDelete();
              } else if (action === 'editConstant') {
                const promptVal = prompt(`Enter new difficulty constant (currently ${parseFloat(Number(levelData.rating).toFixed(2))}):`, parseFloat(Number(levelData.rating).toFixed(2)));
                if (promptVal !== null) {
                  const newRating = parseFloat(promptVal);
                  if (!isNaN(newRating)) {
                    updateConstant(newRating);
                  } else {
                    alert("Invalid number entered.");
                  }
                }
              }
            }}
          />
          <div className="stats-card">
            <h2 className="stats-title">
              <Star size={18} fill="currentColor" />
              {t('levelDetail.statistics')}
            </h2>
            <div className="stats-list">
              <StatWithGraph
                icon={Heart}
                label={levelData.likes === 1 ? t('levelDetail.like') : t('levelDetail.likes')}
                value={levelData.likes || 0}
                color="#f87171"
                data={likesHistory}
              />
              <StatWithGraph
                icon={MessageSquare}
                label={levelData.comments === 1 ? t('levelDetail.comment') : t('levelDetail.comments')}
                value={levelData.comments || 0}
                color="#38bdf8"
                data={commentsHistory}
              />
            </div>
          </div>
        </div>

        <div className="level-bottom-right">
          <div className="comments-card">
            <h2 className="stats-title" style={{ marginBottom: '20px' }}>
              <MessageSquare size={18} />
              {t('levelDetail.comments') || 'Comments'} ({totalComments})
            </h2>

            {loadingComments ? (
              <div className="skeleton-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', minHeight: '400px' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton-item" style={{ height: '80px', width: '100%', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                ))}
              </div>
            ) : comments.length > 0 ? (
              <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {comments.map((comment, i) => {
                  const commenterId = comment.commenter || comment.account?.sonolus_id;
                  const handle = comment.account?.sonolus_handle;
                  const displayName = comment.account?.sonolus_username || comment.commenter;

                  const pfpHash = comment.account?.profile_hash;
                  const commentUserAvatar = (pfpHash && levelData.asset_base_url && commenterId)
                    ? `${levelData.asset_base_url}/${commenterId}/profile/${pfpHash}_webp`
                    : DEFAULT_PFP;

                  const bannerHash = comment.account?.banner_hash;
                  const commentUserBanner = (bannerHash && levelData.asset_base_url && commenterId)
                    ? `${levelData.asset_base_url}/${commenterId}/banner/${bannerHash}_webp`
                    : null;

                  const bannerUrl = commentUserBanner || "/def.webp";
                  const commentUserLink = handle || commenterId;

                  return (
                    <div key={i} className="comment-item" style={{
                      position: 'relative',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '12px',
                      paddingLeft: '52px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '--banner-url': `url(${bannerUrl})`
                    }}>
                      <div className="comment-banner-bg" style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${bannerUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.15,
                        transition: 'opacity 0.3s ease',
                        zIndex: 0,
                        pointerEvents: 'none'
                      }} />

                      <Link
                        href={commentUserLink ? `/user/${commentUserLink}` : '#'}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={displayName ? `View ${displayName}'s profile` : 'View profile'}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '12px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid rgba(255,255,255,0.2)',
                          flexShrink: 0,
                          zIndex: 2,
                          background: '#333',
                          cursor: commentUserLink ? 'pointer' : 'default'
                        }}
                      >
                        <img
                          src={commentUserAvatar}
                          alt={displayName || 'User avatar'}
                          width="32"
                          height="32"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = DEFAULT_PFP; }}
                        />
                      </Link>

                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flexShrink: 1, flexWrap: 'wrap' }}>
                          {commentUserLink ? (
                            <Link
                              href={`/user/${commentUserLink}`}
                              className="comment-username-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FormattedText text={displayName || "User"} />
                            </Link>
                          ) : (
                            <span className="comment-username-link">
                              <FormattedText text={displayName || "User"} />
                            </span>
                          )}
                            {handle && <span className="comment-handle">@{handle}</span>}
                            {comment.account?.owner && <span className="comment-role-badge comment-role-owner">OWNER</span>}
                            {comment.account?.admin && <span className="comment-role-badge comment-role-admin">ADMIN</span>}
                            {comment.account?.mod && <span className="comment-role-badge comment-role-mod">MOD</span>}
                          </div>
                          <span className="comment-date">
                            {comment.created_at ? (() => { const d = new Date(comment.created_at); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; })() : ""}
                          </span>
                        </div>
                        <div className="comment-text">
                          <FormattedText text={comment.content} />
                        </div>
                        {(sonolusUser && (sonolusUser.isMod || sonolusUser.isAdmin || sonolusUser.sonolus_id === comment.user_id)) && (
                          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(t('levelDetail.deleteCommentConfirm', 'Delete this comment?'))) {
                                  handleDeleteComment(comment.id);
                                }
                              }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)'; }}
                            >
                              <Trash2 size={12} />
                              {t('common.delete', 'Delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="comments-placeholder">{t('levelDetail.noComments') || 'No comments yet.'}</p>
            )}

            {totalPages > 1 && comments.length > 0 && (
              <div className="comments-pagination" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
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
                    gap: '4px',
                    padding: '8px 12px',
                    background: page === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: page === 1 ? '#64748b' : '#38bdf8',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <ChevronLeft size={18} />
                  {t('common.prev') || 'Prev'}
                </button>
                <span className="pagination-counter" style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap'
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
                    gap: '4px',
                    padding: '8px 12px',
                    background: page >= totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: page >= totalPages ? '#64748b' : '#38bdf8',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t('common.next') || 'Next'}
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
          <div className="leaderboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 10 }}>
              <h3 className="stats-title" style={{ margin: 0 }}>
                <Trophy size={18} fill="currentColor" />
                {t('levelDetail.leaderboard') || 'Leaderboard'}
              </h3>

              <div style={{ position: 'relative', zIndex: 999, width: 'auto', flexShrink: 0 }}>
                <LiquidSelect
                  value={leaderboardType}
                  onChange={(e) => {
                    setLeaderboardType(e.target.value);
                    setLeaderboardPage(1);
                  }}
                  icon={Trophy}
                  className="leaderboard-filter"
                  options={[
                    { value: 'arcade_score_speed', label: t('leaderboards.scoreTopSpeed', 'Top Score') },
                    { value: 'accuracy_score', label: t('leaderboards.accuracyScore', 'Best Accuracy') },
                    { value: 'least_misses', label: t('leaderboards.leastMisses', 'Least Misses') },
                    { value: 'perfect', label: t('leaderboards.mostPerfects', 'Most Perfects') },
                    { value: 'CLEAR', label: t('levelDetail.clearOnly', 'Cleared Only') },
                  ]}
                />
              </div>
            </div>

            {leaderboardLoading ? (
              <div className="skeleton-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', minHeight: '400px' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-item" style={{ height: '65px', width: '100%', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <>
                {leaderboardPage === 1 && leaderboard.length > 0 && (
                  <div className="leaderboard-podium desktop-podium">
                    { }
                    {leaderboard.length > 1 && (() => {
                      const record = leaderboard[1];
                      const userId = record.user_id || record.user?.id || record.submitter || record.account?.sonolus_id;
                      const pfpHash = record.profile_image_hash || record.user?.profile_image_hash || record.account?.profile_hash;
                      const bannerHash = record.banner_image_hash || record.user?.banner_image_hash || record.account?.banner_hash;
                      const pfpUrl = (pfpHash && levelData.asset_base_url && userId) ? `${levelData.asset_base_url}/${userId}/profile/${pfpHash}_webp` : DEFAULT_PFP;
                      const bannerUrl = (bannerHash && levelData.asset_base_url && userId) ? `${levelData.asset_base_url}/${userId}/banner/${bannerHash}_webp` : '/def.webp';
                      const displayName = record.display_name || record.account?.sonolus_username || record.submitter;
                      const handle = record.user?.handle || record.account?.sonolus_handle;
                      const userLink = handle || userId;

                      return (
                        <div className="podium-spot rank-2" style={{ '--banner-url': `url(${bannerUrl})` }}>
                          <div className="podium-banner-bg" />
                          <div className="podium-avatar-wrapper">
                            <img src={pfpUrl} alt="" onError={(e) => { e.target.src = DEFAULT_PFP; }} />
                            <div className="podium-rank-badge">2</div>
                          </div>
                          <div className="leaderboard-info-icon" style={{ position: 'absolute', top: '8px', right: '8px', cursor: 'help' }} title={`Perfect: ${record.nperfect || 0}\nGreat: ${record.ngreat || 0}\nGood: ${record.ngood || 0}\nMiss: ${record.nmiss || 0}`}>
                            <Info size={14} />
                          </div>
                          <Link href={`/user/${userLink}`} className="podium-name" style={{ display: 'block', textDecoration: 'none', width: '100%', overflow: 'hidden' }}>
                            <MarqueeText maxLength={10} style={{ display: 'block', textAlign: 'center' }}>
                              {displayName}
                            </MarqueeText>
                            {handle && <MarqueeText maxLength={15} className="podium-handle" style={{ fontSize: '0.75rem', fontWeight: 'normal', textAlign: 'center' }}>@{handle}</MarqueeText>}
                          </Link>
                          <div className="podium-score">{record.arcade_score.toLocaleString()}</div>
                          <div className="podium-details">
                            <span className={`game-grade ${record.grade}`}>{record.grade}</span>
                            <span>{formatAccuracy(record.accuracy_score)}{record.speed && ` x${parseFloat(Number(record.speed).toFixed(2))}`}</span>
                          </div>
                        </div>
                      );
                    })()}

                    { }
                    {leaderboard.length > 0 && (() => {
                      const record = leaderboard[0];
                      const userId = record.user_id || record.user?.id || record.submitter || record.account?.sonolus_id;
                      const pfpHash = record.profile_image_hash || record.user?.profile_image_hash || record.account?.profile_hash;
                      const bannerHash = record.banner_image_hash || record.user?.banner_image_hash || record.account?.banner_hash;
                      const pfpUrl = (pfpHash && levelData.asset_base_url && userId) ? `${levelData.asset_base_url}/${userId}/profile/${pfpHash}_webp` : DEFAULT_PFP;
                      const bannerUrl = (bannerHash && levelData.asset_base_url && userId) ? `${levelData.asset_base_url}/${userId}/banner/${bannerHash}_webp` : '/def.webp';
                      const displayName = record.display_name || record.account?.sonolus_username || record.submitter;
                      const handle = record.user?.handle || record.account?.sonolus_handle;
                      const userLink = handle || userId;

                      return (
                        <div className="podium-spot rank-1" style={{ '--banner-url': `url(${bannerUrl})` }}>
                          <div className="podium-banner-bg" />
                          <div className="podium-avatar-wrapper">
                            <img src={pfpUrl} alt="" onError={(e) => { e.target.src = DEFAULT_PFP; }} />
                            <div className="podium-rank-badge">1</div>
                          </div>
                          <div className="leaderboard-info-icon" style={{ position: 'absolute', top: '8px', right: '8px', cursor: 'help' }} title={`Perfect: ${record.nperfect || 0}\nGreat: ${record.ngreat || 0}\nGood: ${record.ngood || 0}\nMiss: ${record.nmiss || 0}`}>
                            <Info size={14} />
                          </div>
                          <Link href={`/user/${userLink}`} className="podium-name" style={{ display: 'block', textDecoration: 'none', width: '100%', overflow: 'hidden' }}>
                            <MarqueeText maxLength={10} style={{ display: 'block', textAlign: 'center' }}>
                              {displayName}
                            </MarqueeText>
                            {handle && <MarqueeText maxLength={15} className="podium-handle" style={{ fontSize: '0.75rem', fontWeight: 'normal', textAlign: 'center' }}>@{handle}</MarqueeText>}
                          </Link>
                          <div className="podium-score">{record.arcade_score.toLocaleString()}</div>
                          <div className="podium-details">
                            <span className={`game-grade ${record.grade}`}>{record.grade}</span>
                            <span>{formatAccuracy(record.accuracy_score)}{record.speed && ` x${parseFloat(Number(record.speed).toFixed(2))}`}</span>
                          </div>
                        </div>
                      );
                    })()}

                    { }
                    {leaderboard.length > 2 && (() => {
                      const record = leaderboard[2];
                      const userId = record.user_id || record.user?.id || record.submitter || record.account?.sonolus_id;
                      const pfpHash = record.profile_image_hash || record.user?.profile_image_hash || record.account?.profile_hash;
                      const bannerHash = record.banner_image_hash || record.user?.banner_image_hash || record.account?.banner_hash;
                      const pfpUrl = (pfpHash && levelData.asset_base_url && userId) ? `${levelData.asset_base_url}/${userId}/profile/${pfpHash}_webp` : DEFAULT_PFP;
                      const bannerUrl = (bannerHash && levelData.asset_base_url && userId) ? `${levelData.asset_base_url}/${userId}/banner/${bannerHash}_webp` : '/def.webp';
                      const displayName = record.display_name || record.account?.sonolus_username || record.submitter;
                      const handle = record.user?.handle || record.account?.sonolus_handle;
                      const userLink = handle || userId;

                      return (
                        <div className="podium-spot rank-3" style={{ '--banner-url': `url(${bannerUrl})` }}>
                          <div className="podium-banner-bg" />
                          <div className="podium-avatar-wrapper">
                            <img src={pfpUrl} alt="" onError={(e) => { e.target.src = DEFAULT_PFP; }} />
                            <div className="podium-rank-badge">3</div>
                          </div>
                          <div className="leaderboard-info-icon" style={{ position: 'absolute', top: '8px', right: '8px', cursor: 'help' }} title={`Perfect: ${record.nperfect || 0}\nGreat: ${record.ngreat || 0}\nGood: ${record.ngood || 0}\nMiss: ${record.nmiss || 0}`}>
                            <Info size={14} />
                          </div>
                          <Link href={`/user/${userLink}`} className="podium-name" style={{ display: 'block', textDecoration: 'none', width: '100%', overflow: 'hidden' }}>
                            <MarqueeText maxLength={10} style={{ display: 'block', textAlign: 'center' }}>
                              {displayName}
                            </MarqueeText>
                            {handle && <MarqueeText maxLength={15} className="podium-handle" style={{ fontSize: '0.75rem', fontWeight: 'normal', textAlign: 'center' }}>@{handle}</MarqueeText>}
                          </Link>
                          <div className="podium-score">{record.arcade_score.toLocaleString()}</div>
                          <div className="podium-details">
                            <span className={`game-grade ${record.grade}`}>{record.grade}</span>
                            <span>{formatAccuracy(record.accuracy_score)}{record.speed && ` x${parseFloat(Number(record.speed).toFixed(2))}`}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="leaderboard-list">
                  {leaderboard.map((record, rawIndex) => {
                    const absIndex = (leaderboardPage - 1) * 5 + rawIndex;
                    const rank = absIndex + 1;
                    const isTop3 = leaderboardPage === 1 && rawIndex < 3;

                    const userId = record.user_id || record.user?.id || record.submitter || record.account?.sonolus_id;
                    const displayName = record.display_name || record.account?.sonolus_username || record.submitter;
                    const handle = record.user?.handle || record.account?.sonolus_handle;
                    const userLink = handle || userId;

                    const pfpHash = record.profile_image_hash || record.user?.profile_image_hash || record.account?.profile_hash;
                    const bannerHash = record.banner_image_hash || record.user?.banner_image_hash || record.account?.banner_hash;
                    const pfpUrl = (pfpHash && levelData.asset_base_url && userId) ? `${levelData.asset_base_url}/${userId}/profile/${pfpHash}_webp` : DEFAULT_PFP;
                    const bannerUrl = (bannerHash && levelData.asset_base_url && userId) ? `${levelData.asset_base_url}/${userId}/banner/${bannerHash}_webp` : '/def.webp';

                    return (
                      <div key={record.id || rawIndex} className={`leaderboard-item ${isTop3 ? 'mobile-only-item' : ''}`} style={{ '--banner-url': `url(${bannerUrl})` }}>
                        <div className="leaderboard-item-bg" />

                        <div className="leaderboard-content" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
                          <div className="leaderboard-row-top" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={`leaderboard-rank rank-${rank > 3 ? 'other' : rank}`} style={{ width: '24px', flexShrink: 0, textAlign: 'center' }}>{rank}</div>
                            <Link href={`/user/${userLink}`} className="leaderboard-item-avatar" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                              <img src={pfpUrl} alt="" onError={(e) => { e.target.src = DEFAULT_PFP; }} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            </Link>
                            <Link href={`/user/${userLink}`} className="leaderboard-name" style={{ display: 'block', textDecoration: 'none', fontWeight: 'bold', overflow: 'hidden' }}>
                              <MarqueeText maxLength={15} style={{ display: 'block' }}>{displayName}</MarqueeText>
                            </Link>
                            {handle && <MarqueeText maxLength={20} className="leaderboard-handle" style={{ fontSize: '0.8rem', display: 'block' }}>@{handle}</MarqueeText>}
                          </div>

                          <div className="leaderboard-row-bottom" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingLeft: '40px', fontSize: '0.9rem' }}>
                            <div className="leaderboard-score" style={{ fontWeight: 'bold', fontSize: '1rem', flexShrink: 0 }}>{record.arcade_score.toLocaleString()}</div>
                            <span className="leaderboard-divider">|</span>
                            <span className={`game-grade ${record.grade}`}>
                              {record.grade === 'allPerfect' ? 'All Perfect' :
                                record.grade === 'fullCombo' ? 'Full Combo' :
                                  record.grade === 'pass' ? 'Pass' :
                                    record.grade === 'fail' ? 'Fail' : record.grade}
                            </span>
                            <span className="leaderboard-divider">|</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="leaderboard-accuracy" style={{ fontWeight: '700' }}>
                                {formatAccuracy(record.accuracy_score)} {record.speed && `x${parseFloat(Number(record.speed).toFixed(2))}`}
                              </span>
                              <div className="leaderboard-info-icon" style={{ cursor: 'help', display: 'flex', alignItems: 'center' }} title={`Perfect: ${record.nperfect || 0}\nGreat: ${record.ngreat || 0}\nGood: ${record.ngood || 0}\nMiss: ${record.nmiss || 0}`}>
                                <Info size={14} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="comments-placeholder">{t('levelDetail.noRecords') || 'No records yet. Be the first to play!'}</p>
            )}

            {leaderboardTotalPages > 1 && leaderboard.length > 0 && (
              <div className="comments-pagination" style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                marginTop: '24px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px'
              }}>
                <button disabled={leaderboardPage === 1} onClick={() => setLeaderboardPage(p => Math.max(1, p - 1))} className="pagination-btn" style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px',
                  background: leaderboardPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                  color: leaderboardPage === 1 ? '#64748b' : '#38bdf8', cursor: leaderboardPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}>
                  <ChevronLeft size={18} /> {t('common.prev') || 'Prev'}
                </button>
                <span className="pagination-counter" style={{ display: 'flex', alignItems: 'center', fontWeight: '600', fontSize: '0.85rem', padding: '6px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                  {leaderboardPage} / {leaderboardTotalPages}
                </span>
                <button disabled={leaderboardPage >= leaderboardTotalPages} onClick={() => setLeaderboardPage(p => Math.min(leaderboardTotalPages, p + 1))} className="pagination-btn" style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px',
                  background: leaderboardPage >= leaderboardTotalPages ? 'rgba(255,255,255,0.05)' : 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                  color: leaderboardPage >= leaderboardTotalPages ? '#64748b' : '#38bdf8', cursor: leaderboardPage >= leaderboardTotalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}>
                  {t('common.next') || 'Next'} <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main >
  );
}
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatAccuracy(score) {
  if (score === undefined || score === null) return '0%';
  let val = Number(score);
  if (val > 1000) val = val / 10000;
  else if (val <= 1 && val > 0) val = val * 100;
  return parseFloat(val.toFixed(4)) + '%';
}
