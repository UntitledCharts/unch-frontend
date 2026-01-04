"use client";
import Link from "next/link";
import { Pencil, Trash2, Globe, Lock, Link as LinkIcon, Heart, Calendar, RefreshCw, Loader2, MessageSquare } from "lucide-react";
import AudioControls from "../audio-control/AudioControls";
import AudioVisualizer from "../audio-visualizer/AudioVisualizer";
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
      {posts.map((post) => {
        const canSeeVisibilityChange =
          (sonolusUser && sonolusUser.sonolus_id === post.authorId && post.status && onVisibilityChange) ||
          (sonolusUser && sonolusUser.mod === true);
        return <li
          key={post.id}
          className="dashboard-li"
        >
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
              <img
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
                  {sonolusUser && sonolusUser.sonolus_id === post.authorId && (
                    <>
                      <button
                        className="edit-btn"
                        type="button"
                        onClick={() => onEdit(post)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button className="delete-btn" type="button" title="Delete" onClick={() => onDelete(post)}>
                        <Trash2 size={14} />
                      </button>
                    </>
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
                        <span className="lv-part">{t('card.level', { 1: post.rating })}</span>
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
      })}
    </ul>
  );
}

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
