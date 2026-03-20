"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Heart,
  MessageSquare,
  Calendar,
  Pencil,
  Trash2,
  Eye,
  Clock,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatRelativeTime } from "../../utils/dateUtils";
import LiquidSelect from "../liquid-select/LiquidSelect";

const DashboardChartItem = memo(
  ({
    post,
    sonolusUser,
    openEdit,
    handleDelete,
    updateVisibility, 
    isActive,
    onToggleMenu,
  }) => {
    const { t } = useLanguage();
    const router = useRouter();

    const isPublic = post.status === "PUBLIC";
    const displayDate = isPublic ? post.publishedAt || post.createdAt : post.createdAt;
    const dateLabel = isPublic
      ? t("dashboard.published", "Published")
      : t("dashboard.uploaded", "Uploaded");

    
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [dtLocal, setDtLocal] = useState(""); 
    const anchorRef = useRef(null);

    
    
    const scheduledEpochSeconds = useMemo(() => {
      const v = post.scheduledPublish ?? post.scheduled_publish ?? post.scheduledPublishAt ?? null;

      if (typeof v === "number") return v;

      if (typeof v === "string" && v.trim() !== "") {
        const ms = Date.parse(v);
        if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
      }

      return null;
    }, [post.scheduledPublish, post.scheduled_publish, post.scheduledPublishAt]);

    const scheduledLabel = useMemo(() => {
      if (!scheduledEpochSeconds) return null;
      return new Date(scheduledEpochSeconds * 1000).toLocaleString();
    }, [scheduledEpochSeconds]);

    const closeSchedule = () => {
      setScheduleOpen(false);
      setDtLocal("");
    };

    
    useEffect(() => {
      if (!scheduleOpen) return;

      const onDocMouseDown = (e) => {
        const anchor = anchorRef.current;
        if (!anchor) return;
        if (!anchor.contains(e.target)) closeSchedule();
      };

      document.addEventListener("mousedown", onDocMouseDown);
      return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, [scheduleOpen]);

    
    const dtLocalToEpochSeconds = (value) => {
      const d = new Date(value); 
      const ms = d.getTime();
      if (Number.isNaN(ms)) return null;
      return Math.floor(ms / 1000);
    };

    
    const openScheduleMenu = () => {
      if (scheduledEpochSeconds) {
        const d = new Date(scheduledEpochSeconds * 1000);
        const pad = (n) => String(n).padStart(2, "0");
        const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDtLocal(localStr);
      } else {
        setDtLocal("");
      }
      setScheduleOpen(true);
    };

    
    
    const publishNow = async () => {
      await updateVisibility(post, "PUBLIC");
      closeSchedule();
    };

    
    const confirmSchedule = async () => {
      const epoch = dtLocalToEpochSeconds(dtLocal);
      if (!epoch) return;

      
      await updateVisibility(post, post.status, { publish_time: epoch });
      closeSchedule();
    };

    
    const removeSchedule = async () => {
      await updateVisibility(post, post.status, { publish_time: null });
      closeSchedule();
    };

    const onStatusChange = async (e) => {
      const next = e.target.value;

      if (next === "PUBLIC") {
        openScheduleMenu();
        return;
      }

      closeSchedule();
      await updateVisibility(post, next);
    };

    return (
      <div className="chart-card-redesigned">
        {}
        <div
          className="card-bg"
          style={{ backgroundImage: `url(${post.coverUrl || "/placeholder.png"})` }}
        />

        {}
        <div
          className="card-thumb cursor-pointer"
          onClick={() => router.push(`/levels/UnCh-${post.id}`)}
        >
          {post.coverUrl ? (
            <img src={post.coverUrl} alt={post.title} loading="lazy" />
          ) : (
            <div className="placeholder-thumb">
              <span className="no-img-text">No Image</span>
            </div>
          )}
        </div>

        {}
        <div className="card-info">
          <div className="info-header">
            <div className="flex items-center justify-start gap-2">
              <h3 title={post.title}>{post.title}</h3>
              <span
                title="Rating"
                className="rating-badge text-xs"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                Lv. {post.rating}
              </span>
            </div>

            <div className="action-menu-wrapper">
              <button
                className="icon-btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMenu(post.id);
                }}
              >
                <MoreVertical size={16} />
              </button>

              <div
                className={`action-dropdown ${isActive ? "active" : ""}`}
                style={{ display: isActive ? "flex" : "none" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => router.push(`/levels/UnCh-${post.id}`)}>
                  <Eye size={14} style={{ marginRight: "8px" }} />{" "}
                  {t("dashboard.view", "View")}
                </button>

                {sonolusUser && sonolusUser.sonolus_id === post.authorId && (
                  <>
                    <button onClick={() => openEdit(post)}>
                      <Pencil size={14} style={{ marginRight: "8px" }} />{" "}
                      {t("dashboard.edit", "Edit")}
                    </button>
                    <button className="text-red" onClick={() => handleDelete(post)}>
                      <Trash2 size={14} style={{ marginRight: "8px" }} />{" "}
                      {t("dashboard.delete", "Delete")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="author-name">
            {t("hero.chartedBy", "Charted by")} {post.author}
          </div>

          <div className="card-stats-row" style={{ marginTop: "auto" }}>
            <span>
              <Heart size={12} fill="currentColor" /> {post.likeCount}
            </span>
            <span>
              <MessageSquare size={12} /> {post.commentsCount}
            </span>
            <span title={`${dateLabel}: ${displayDate}`}>
              <Calendar size={12} /> {formatRelativeTime(displayDate, t)}
            </span>
          </div>

          {}
          {scheduledLabel && (
            <div className="text-xs opacity-75" style={{ marginTop: "6px" }}>
              <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
              {t("dashboard.scheduledFor", "Scheduled for")}: {scheduledLabel}
            </div>
          )}
        </div>

        {}
        {sonolusUser && sonolusUser.sonolus_id === post.authorId && (
          <div
            style={{ marginLeft: "auto", paddingLeft: "12px", position: "relative" }}
            ref={anchorRef}
          >
            <LiquidSelect
              value={post.status}
              type="ghost"
              className={`status-text ${post.status?.toLowerCase()}`}
              options={["UNLISTED", "PRIVATE", "PUBLIC"].map((x) => ({
                value: x,
                label: x,
              }))}
              onChange={onStatusChange}
            />

            {scheduleOpen && (
              <div
                className="schedule-popover"
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
                <div className="text-xs opacity-75">
                  {t("dashboard.publicOptions", "Public options")}
                </div>

                {}
                <button className="icon-btn-ghost" onClick={publishNow}>
                  {t("dashboard.publicNow", "Public Now")}
                </button>

                {}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div className="text-xs opacity-75">
                    {t("dashboard.schedulePublish", "Publish Schedule")}
                  </div>

                  <input
                    type="datetime-local"
                    value={dtLocal}
                    onChange={(e) => setDtLocal(e.target.value)}
                    className="input"
                  />

                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button className="icon-btn-ghost" onClick={closeSchedule}>
                      {t("dashboard.cancel", "Cancel")}
                    </button>
                    <button
                      className="icon-btn-ghost"
                      disabled={!dtLocal}
                      onClick={confirmSchedule}
                    >
                      {t("dashboard.confirm", "Confirm")}
                    </button>
                  </div>
                </div>

                {}
                {scheduledEpochSeconds && (
                  <button className="icon-btn-ghost text-red" onClick={removeSchedule}>
                    {t("dashboard.removeSchedule", "Remove scheduled publish")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

DashboardChartItem.displayName = "DashboardChartItem";
export default DashboardChartItem;
