"use client";
import { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Pencil, Trash2, Globe, Lock, Link as LinkIcon, Heart, Calendar, RefreshCw, Loader2, MessageSquare, MoreVertical, Ban, UserX } from "lucide-react";
import AudioControls from "../audio-control/AudioControls";
import AudioVisualizer from "../audio-visualizer/AudioVisualizer";
import LoadingImage from "../loading-image/LoadingImage";
import { useLanguage } from "@/contexts/LanguageContext";
import "./ChartsList.css";
import { formatRelativeTime } from "@/utils/dateUtils";

export default function ChartsList({
  posts,
  loading,
  currentlyPlaying,
  audioRefs,
  onPlay,
  onStop,
  onAudioRef,
  onEdit,
  sonolusUser,
  onVisibilityChange,
  onDelete
}) {
  const { t } = useLanguage();

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
          onPlay={onPlay}
          onStop={onStop}
          onAudioRef={onAudioRef}
          onEdit={onEdit}
          onDelete={onDelete}
          currentlyPlaying={currentlyPlaying}
          audioRefs={audioRefs}
          t={t}
        />
      ))}
    </ul>
  );
}

const MemoizedChartItem = memo(function ChartItem({
  post,
  sonolusUser,
  onVisibilityChange,
  onPlay,
  onStop,
  onAudioRef,
  onEdit,
  onDelete,
  currentlyPlaying,
  audioRefs,
  t
}) {
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
                  {t('hero.chartedBy')} {post.author}
                </span>
              </Link>
              <div className="meta-stack-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '120px' }}>
                <span className="song-artist-dashboard" style={{ fontSize: '12px', whiteSpace: 'nowrap', fontWeight: '600' }}>
                  {t('search.songBy', 'Song by')}: {post.artists.length > 30
                    ? post.artists.substring(0, 30) + "..."
                    : post.artists}
                </span>
              </div>
            </div>

            <div className="audio-section">
              <AudioControls
                bgmUrl={post.bgmUrl}
                onPlay={() => onPlay(post.id)}
                onStop={() => onStop(post.id)}
                isPlaying={currentlyPlaying === post.id}
                isActive={currentlyPlaying === post.id}
                audioRef={(ref) => onAudioRef(post.id, ref)}
              />
              {currentlyPlaying === post.id && (
                <AudioVisualizer
                  audioRef={audioRefs.current ? audioRefs.current[post.id] : null}
                  isPlaying={currentlyPlaying === post.id}
                />
              )}
            </div>
          </div>

          <div className="metadata-section">
            <div className="chart-actions">
              {(canEditChart || canDeleteChart || isAdmin || isMod) && (
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
                <span className="metadata-item created">
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
        {intent === "PUBLIC" && "Public"}
        {intent === "PRIVATE" && "Private"}
        {intent === "UNLISTED" && "Unlisted"}
      </span>
    </button>
  );
}
