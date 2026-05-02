"use client";
import { memo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Pencil, Trash2, Globe, Lock, Link as LinkIcon, Heart, Calendar, RefreshCw, Loader2, MessageSquare, MoreVertical, Ban, UserX } from "lucide-react";
import AudioControls from "../audio-control/AudioControls";
import AudioVisualizer from "../audio-visualizer/AudioVisualizer";
import LoadingImage from "../loading-image/LoadingImage";
import { useLanguage } from "@/contexts/LanguageContext";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import "./ChartsList.css";
import { formatRelativeTime } from "@/utils/dateUtils";

function AuthorPopout({ authorId, anchorRect }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!authorId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${authorId}`)
      .then(r => r.ok ? r.json() : null)
      .then(res => { if (res?.account) setData({ ...res.account, _base: res.asset_base_url || '' }); })
      .catch(() => {});
  }, [authorId]);

  if (!anchorRect) return null;

  const base = data?._base || '';
  const uid = data?.sonolus_id || authorId;
  const profileUrl = (data?.profile_hash && base && uid) ? `${base}/${uid}/profile/${data.profile_hash}_webp` : '/defpfp.webp';
  const bannerUrl = (data?.banner_hash && base && uid) ? `${base}/${uid}/banner/${data.banner_hash}_webp` : '/def.webp';

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
      <style>{`@keyframes popout-in{from{opacity:0;transform:scale(0.94) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div style={{
        width: '100%', height: '70px',
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundColor: 'rgba(56,189,248,0.08)', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px',
          background: 'linear-gradient(to right,rgba(8,12,24,0.7) 0%,rgba(8,12,24,0.3) 100%)',
        }}>
          <img src={profileUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.5)', objectFit: 'cover', flexShrink: 0 }}
            onError={(e) => { e.target.src = '/defpfp.webp'; }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {data?.sonolus_username || data?.sonolus_id || authorId}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ChartsList({
  posts,
  loading,
  sonolusUser,
  onVisibilityChange,
  onEdit,
  onDelete
}) {
  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#38bdf8' }} />
      </div>
    );
  }

  return (
    <ul className="songlist">
      {posts.map((post) => (
        <MemoizedChartItem
          key={post.id}
          post={post}
          sonolusUser={sonolusUser}
          onVisibilityChange={onVisibilityChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

const MemoizedChartItem = memo(function ChartItem({
  post,
  sonolusUser,
  onVisibilityChange,
  onEdit,
  onDelete,
}) {
  const { t, tReact } = useLanguage();
  const { audioRef, trackId, isPlaying, isBuffering, currentTime, duration, play, pause } = useAudioPlayer();
  const isThisPlaying = trackId === post.id && isPlaying;
  const isThisBuffering = trackId === post.id && isBuffering;
  const isThisActive = trackId === post.id && (isPlaying || isBuffering);

  const handlePlay = () => {
    if (!post.bgmUrl) return;
    play(post.id, post.bgmUrl, {
      title: post.title,
      thumbnail: post.coverUrl,
      href: `/levels/UnCh-${encodeURIComponent(post.id)}`,
    });
  };

  const handleStop = () => {
    if (trackId === post.id) pause();
  };
  const canSeeVisibilityChange = onVisibilityChange &&
    ((sonolusUser && sonolusUser.sonolus_id === post.authorId && post.status) ||
      (sonolusUser && (sonolusUser.mod === true || sonolusUser.isMod === true)));

  const isOwner = sonolusUser && sonolusUser.sonolus_id === post.authorId;
  const isAdmin = sonolusUser && sonolusUser.isAdmin === true;
  const isMod = sonolusUser && (sonolusUser.mod === true || sonolusUser.isMod === true);
  const canDeleteChart = onDelete && (isOwner || isAdmin || (isMod && post.authorId !== sonolusUser.sonolus_id));
  const canEditChart = onEdit && isOwner;

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [showAuthorPopout, setShowAuthorPopout] = useState(false);
  const [authorAnchorRect, setAuthorAnchorRect] = useState(null);
  const authorAnchorRef = useRef(null);
  const authorTimerRef = useRef(null);

  const handleAuthorEnter = () => {
    clearTimeout(authorTimerRef.current);
    authorTimerRef.current = setTimeout(() => {
      if (authorAnchorRef.current) setAuthorAnchorRect(authorAnchorRef.current.getBoundingClientRect());
      setShowAuthorPopout(true);
    }, 100);
  };
  const handleAuthorLeave = () => {
    clearTimeout(authorTimerRef.current);
    setShowAuthorPopout(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBanUser = async () => {
    if (!confirm(`Are you sure you want to BAN ${post.author}?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${post.authorId}/ban`, {
        method: 'POST',
        headers: { 'Authorization': localStorage.getItem('session') }
      });
      if (res.ok) alert('User banned');
      else alert('Failed to ban user');
    } catch (e) {
      console.error(e);
      alert('Error banning user');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(`Are you sure you want to DELETE ${post.author}? ALL DATA WILL BE LOST.`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${post.authorId}`, {
        method: 'DELETE',
        headers: { 'Authorization': localStorage.getItem('session') }
      });
      if (res.ok) {
        alert('User deleted');
        if (onDelete) onDelete(post);
      } else alert('Failed to delete user');
    } catch (e) {
      console.error(e);
      alert('Error deleting user');
    }
  };


  return (
    <li className="dashboard-li">
      {(post.coverUrl || post.backgroundUrl) && (
        <div
          className="chartlist-ambience"
          style={{ backgroundImage: `url(${post.coverUrl || post.backgroundUrl})` }}
        />
      )}
      <div
        className="dashboard-bg-layer"
        style={{
          backgroundImage: (post.backgroundUrl || post.backgroundV3Url)
            ? `url(${post.backgroundUrl || post.backgroundV3Url})`
            : "none",
        }}
      />

      <div className="dashboard-content-layer">
        <Link
          href={`/levels/UnCh-${encodeURIComponent(post.id)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <LoadingImage
            className="dashboard-img"
            src={post.coverUrl}
            alt={post.title}
          />
        </Link>
        <div className="song-info">
          <div className="chart-content">
            <div className="chart-data">
              <Link
                href={`/levels/UnCh-${encodeURIComponent(post.id)}`}
                className="song-link-wrapper"
                style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}
              >
                <span className="song-title-dashboard">
                  {post.title.length > 25
                    ? post.title.substring(0, 25) + "..."
                    : post.title}
                </span>
                <span className="author-dashboard" style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  {tReact('hero.chartedBy', {
                    1: <span
                      ref={authorAnchorRef}
                      onMouseEnter={handleAuthorEnter}
                      onMouseLeave={handleAuthorLeave}
                      style={{ display: 'inline-block', position: 'relative' }}
                    >
                      <span
                        style={{ color: '#38bdf8', textDecoration: 'none', cursor: 'pointer' }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/user/${post.authorHandle || post.authorId}`; }}
                      >
                        {post.author}
                      </span>
                    </span>
                  })}
                </span>
              </Link>
              <div className="meta-stack-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '120px' }}>
                <span className="song-artist-dashboard" style={{ fontSize: '12px', whiteSpace: 'nowrap', fontWeight: '600' }}>
                  {t('search.songBy', { 1: post.artists.length > 30
                    ? post.artists.substring(0, 30) + "..."
                    : post.artists })}
                </span>
              </div>
            </div>

            <div className="audio-section">
              <AudioControls
                bgmUrl={post.bgmUrl || null}
                onPlay={handlePlay}
                onStop={handleStop}
                isPlaying={isThisPlaying}
                isActive={isThisActive}
                audioRef={() => {}}
                currentTime={isThisActive ? currentTime : undefined}
                duration={isThisActive ? duration : undefined}
              />
              {isThisActive && (
                <AudioVisualizer
                  audioRef={audioRef}
                  isPlaying={isThisPlaying}
                />
              )}
            </div>
          </div>

          <div className="metadata-section">
            <div className="chart-actions">
              {(canEditChart || canDeleteChart) && (
                <div className="menu-container" style={{ position: 'relative' }} ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="action-btn icon-only"
                    style={{
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showMenu && (
                    <div className="glass-dropdown-menu">
                      {canEditChart && (
                        <button
                          className="glass-dropdown-item"
                          onClick={() => { setShowMenu(false); onEdit(post); }}
                        >
                          <Pencil size={14} /> {t('common.edit', 'Edit')}
                        </button>
                      )}

                      {canDeleteChart && (
                        <button
                          className="glass-dropdown-item danger"
                          onClick={() => { setShowMenu(false); onDelete(post); }}
                        >
                          <Trash2 size={14} /> {t('common.delete', 'Delete Chart')}
                        </button>
                      )}


                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="chart-metadata">
              {post.status && post.status !== "PUBLIC" && (
                <span
                  className={`metadata-item status status-${post.status.toLowerCase()}`}
                >
                  {post.status === "PRIVATE" ? <Lock size={12} /> : <LinkIcon size={12} />}
                  {post.status}
                </span>
              )}
              <div className="metadata-stats-group">
                <span className="metadata-item stats-combined">
                  {post.rating !== undefined && (
                    <span className="lv-part">{t('card.level', { 1: parseFloat(Number(post.rating).toFixed(2)) })}</span>
                  )}
                  {post.likeCount !== undefined && (
                    <span className="likes-part">
                      <Heart size={12} fill="currentColor" /> {post.likeCount}
                    </span>
                  )}
                  <span className="comments-part">
                    <MessageSquare size={12} className="text-blue-400" /> {post.commentsCount || 0}
                  </span>
                </span>
              </div>
              {post.createdAt && (
                <span
                  className="metadata-item created"
                  title={(() => {
                    const d = new Date(post.createdAt);
                    const offset = -d.getTimezoneOffset();
                    const sign = offset >= 0 ? '+' : '-';
                    const h = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
                    const m = String(Math.abs(offset) % 60).padStart(2, '0');
                    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()} UTC${sign}${h}:${m}`;
                  })()}
                >
                  <Calendar size={12} /> {formatRelativeTime(post.createdAt, t)}
                </span>
              )}
              {post.updatedAt && (
                <span className="metadata-item updated">
                  <RefreshCw size={12} /> {new Date(post.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="visibility-toggles">
              {canSeeVisibilityChange && post.status != "PUBLIC" && (
                <ChartAction post={post} onVisibilityChange={onVisibilityChange} intent={"PUBLIC"}></ChartAction>
              )}
              {canSeeVisibilityChange && post.status != "PRIVATE" && (
                <ChartAction post={post} onVisibilityChange={onVisibilityChange} intent={"PRIVATE"}></ChartAction>
              )}
              {canSeeVisibilityChange && post.status != "UNLISTED" && (
                <ChartAction post={post} onVisibilityChange={onVisibilityChange} intent={"UNLISTED"}></ChartAction>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
});

function ChartAction({ post, onVisibilityChange, intent }) {
  const { t } = useLanguage();
  return (
    <button
      className={`visibility-toggle-btn status-${intent.toLowerCase()}`}
      onClick={() => onVisibilityChange(post.id, post.status, intent)}
      title={`Change visibility (currently ${post.status})`}
    >
      <span className="visibility-icon">
        {intent === "PUBLIC" && <Globe size={16} />}
        {intent === "PRIVATE" && <Lock size={16} />}
        {intent === "UNLISTED" && <LinkIcon size={16} />}
      </span>
      <span className="visibility-text">
        {intent === "PUBLIC" && t('dashboard.public')}
        {intent === "PRIVATE" && t('dashboard.private')}
        {intent === "UNLISTED" && t('dashboard.unlisted')}
      </span>
    </button>
  );
}
