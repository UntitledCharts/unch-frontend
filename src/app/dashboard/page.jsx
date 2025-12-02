"use client";
import "./page.css";
import { useState, useEffect, useRef, useCallback } from "react";
import ChartsList from "../../components/charts-list/ChartsList";
import PaginationControls from "../../components/pagination-controls/PaginationControls";
import ChartModal from "../../components/chart-modal/ChartModal";
import { useUser } from "../../contexts/UserContext";
import { useRouter } from "next/navigation";

const APILink = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const router = useRouter();
  const {
    sonolusUser,
    session,
    isSessionValid,
    clearExpiredSession,
    isClient,
    sessionReady,
  } = useUser();
  useEffect(() => {
    if (sessionReady && (!sonolusUser || !isSessionValid())) {
      router.push("/login");
    }
  }, [sessionReady, sonolusUser, isSessionValid, router]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deletablePost, setDeletablePost] = useState(null);

  // Audio state management
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRefs = useRef({});

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
  });

  const handleMyCharts = async (page = 0) => {
    setLoading(true);
    setError(null);

    // Don't make API calls until client-side mounting is complete
    if (!isClient) {
      setLoading(false);
      return;
    }

    // Don't make API calls until session has been properly evaluated
    if (!sessionReady) {
      setLoading(false);
      return;
    }

    // Check if session is still valid before making API call
    if (!isSessionValid()) {
      console.log("Session expired, clearing data");
      clearExpiredSession();
      setLoading(false);
      return;
    }

    // Ensure we have a session token before making the API call
    if (!session) {
      console.log("No session token available, skipping API call");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${APILink}/api/charts?page=${page}&type=advanced&status=ALL`,
        {
          headers: {
            Authorization: `${session}`,
          },
        }
      );

      // Check if the API call failed due to expired session
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          console.log("API call failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        throw new Error(`Network error: ${res.status}`);
      }

      const data = await res.json();

      const BASE = data.asset_base_url || `${APILink}`;
      const items = Array.isArray(data?.data) ? data.data : [];

      const normalized = items.map((item) => ({
        id: item.id,
        title: item.title,
        artists: item.artists,
        author: item.author_full,
        author_field: item.chart_design, // NOTE: used for edit, since we don't want to upload the #... handle.
        authorId: item.author,
        rating: item.rating,
        description: item.description,
        tags: item.tags,
        coverUrl: item.jacket_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.jacket_file_hash}`
          : "",
        bgmUrl: item.music_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.music_file_hash}`
          : "",
        backgroundUrl: item.background_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.background_file_hash}`
          : `${BASE}/${item.author}/${item.id}/${item.background_v3_file_hash}`,
        has_bg: item.background_file_hash ? true : false,
        chartUrl: item.chart_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.chart_file_hash}`
          : "",
        previewUrl: item.preview_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.preview_file_hash}`
          : "",
        likeCount: item.like_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        status: item.status,
      }));

      setPosts(normalized);
      setPageCount(data.pageCount || 0);
      setTotalCount(data.data?.[0]?.total_count || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data after client-side mounting and session is ready
    if (isClient && sessionReady) {
      handleMyCharts();
    }
  }, [isClient, sessionReady]);

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
    });
    setError(null); // Clear any previous errors
    setIsOpen(true);
  };

  const openEdit = (post) => {
    setMode("edit");
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
    });
    setEditData({
      id: post.id,
      title: post.title,
      jacketUrl: post.coverUrl,
      bgmUrl: post.bgmUrl,
      chartUrl: post.chartUrl,
      previewUrl: post.previewUrl,
      backgroundUrl: post.backgroundUrl,
    });
    setError(null); // Clear any previous errors
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
    setMode(null);
    setEditData(null);
    setError(null); // Clear any errors when closing
    // Reset form to clean state
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
    });
  };

  const update = (key) => (e) => {
    const value =
      e.target.type === "file" ? e.target.files?.[0] ?? null : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear any errors when user starts interacting with the form
    if (error) {
      setError(null);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (mode === "upload") {
      await handleUpload();
    } else if (mode === "edit") {
      await handleEdit();
    }
  };

  const handleEdit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Don't proceed if not on client side
      if (!isClient) {
        setLoading(false);
        return;
      }

      // Don't proceed until session is ready
      if (!sessionReady) {
        setLoading(false);
        return;
      }

      // Check if session is still valid
      if (!isSessionValid()) {
        console.log("Session expired, clearing data");
        clearExpiredSession();
        setLoading(false);
        return;
      }

      // Ensure we have a session token
      if (!session) {
        console.log("No session token available");
        setError("No session token available");
        setLoading(false);
        return;
      }

      if (!editData || !editData.id) {
        setError("No chart selected for editing");
        setLoading(false);
        return;
      }

      // Validate field lengths
      if (form.title && form.title.length > 50) {
        setError("Title must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.artists && form.artists.length > 50) {
        setError("Artists must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.author && form.author.length > 50) {
        setError("Charter Name must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.description && form.description.length > 1000) {
        setError("Description must be 1000 characters or less.");
        setLoading(false);
        return;
      }

      // Validate tags
      let tags = [];
      if (form.tags && typeof form.tags === "string" && form.tags.trim()) {
        tags = form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        if (tags.length > 3) {
          setError("Maximum 3 tags allowed.");
          setLoading(false);
          return;
        }
        for (const tag of tags) {
          if (tag.length > 10) {
            setError(`Tag "${tag}" must be 10 characters or less.`);
            setLoading(false);
            return;
          }
        }
      }

      // Prepare chart data - only include fields that have values
      const chartData = {};

      if (form.title) chartData.title = form.title;
      if (form.artists) chartData.artists = form.artists;
      if (form.author) chartData.author = form.author;
      if (form.rating) chartData.rating = parseInt(form.rating);
      if (form.description) chartData.description = form.description;
      if (tags.length > 0) chartData.tags = tags;

      // File inclusion flags
      chartData.includes_jacket = form.jacket ? true : false;
      chartData.includes_audio = form.bgm ? true : false;
      chartData.includes_chart = form.chart ? true : false;
      chartData.includes_preview = form.preview ? true : false;
      chartData.includes_background = form.background ? true : false;
      chartData.delete_background = false; // TODO ADD A BUTTON
      chartData.delete_preview = false; // TODO ADD A BUTTON

      // Create FormData
      const formData = new FormData();
      formData.append("data", JSON.stringify(chartData));

      // Add files only if they exist
      if (form.jacket) {
        formData.append("jacket_image", form.jacket);
      }
      if (form.bgm) {
        formData.append("audio_file", form.bgm);
      }
      if (form.chart) {
        formData.append("chart_file", form.chart);
      }
      if (form.preview) {
        formData.append("preview_file", form.preview);
      }
      if (form.background) {
        formData.append("background_image", form.background);
      }

      console.log("chartData", chartData);

      formData.forEach((value, key, parent) => {
        console.log("value", value);
        console.log("key", key);
        console.log("parent", parent);
      });

      // Make the edit request
      const response = await fetch(
        `${APILink}/api/charts/${editData.id}/edit/`,
        {
          method: "PATCH",
          headers: {
            Authorization: session,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log("Edit failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(`Edit failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Edit successful:", result);

      // Close modal, clear form, and refresh chart list
      setIsOpen(false);
      setMode(null);
      setEditData(null);
      setError(null);
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
      });
      await handleMyCharts(currentPage);
    } catch (err) {
      console.error("Edit error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      setError(null);

      // Don't proceed if not on client side
      if (!isClient) {
        setLoading(false);
        return;
      }

      // Don't proceed until session is ready
      if (!sessionReady) {
        setLoading(false);
        return;
      }

      // Check if session is still valid
      if (!isSessionValid()) {
        console.log("Session expired, clearing data");
        clearExpiredSession();
        setLoading(false);
        return;
      }

      // Ensure we have a session token
      if (!session) {
        console.log("No session token available");
        setError("No session token available");
        setLoading(false);
        return;
      }

      // Validate required fields
      if (
        !form.title ||
        !form.artists ||
        !form.author ||
        !form.rating ||
        !form.chart ||
        !form.bgm ||
        !form.jacket
      ) {
        setError(
          "Please fill in all required fields and upload all required files."
        );
        setLoading(false);
        return;
      }

      // Validate field lengths
      if (form.title.length > 50) {
        setError("Title must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.artists.length > 50) {
        setError("Artists must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.author.length > 50) {
        setError("Charter Name must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.description && form.description.length > 1000) {
        setError("Description must be 1000 characters or less.");
        setLoading(false);
        return;
      }

      // Validate tags
      let tags = [];
      if (form.tags) {
        tags = form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        if (tags.length > 3) {
          setError("Maximum 3 tags allowed.");
          setLoading(false);
          return;
        }
        for (const tag of tags) {
          if (tag.length > 10) {
            setError(`Tag "${tag}" must be 10 characters or less.`);
            setLoading(false);
            return;
          }
        }
      }

      // Prepare chart data
      const chartData = {
        rating: parseInt(form.rating),
        title: form.title,
        artists: form.artists,
        author: form.author,
        tags: tags,
        includes_background: !!form.background,
        includes_preview: !!form.preview,
      };

      // Add description if provided
      if (form.description) {
        chartData.description = form.description;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("data", JSON.stringify(chartData));

      // Add required files
      formData.append("jacket_image", form.jacket);
      formData.append("chart_file", form.chart);
      formData.append("audio_file", form.bgm);

      // Add optional files
      if (form.preview) {
        formData.append("preview_file", form.preview);
      }
      if (form.background) {
        formData.append("background_image", form.background);
      }

      // Make the upload request
      const response = await fetch(`${APILink}/api/charts/upload/`, {
        method: "POST",
        headers: {
          Authorization: session,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log("Upload failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Upload successful:", result);

      // Close modal, clear form, and refresh chart list
      setIsOpen(false);
      setMode(null);
      setError(null);
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
      });
      await handleMyCharts(currentPage);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Audio control functions
  const handlePlay = (postId) => {
    // Stop any currently playing audio
    if (currentlyPlaying && currentlyPlaying !== postId) {
      const currentAudio = audioRefs.current[currentlyPlaying];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    setCurrentlyPlaying(postId);
  };

  const handleStop = (postId) => {
    if (currentlyPlaying === postId) {
      setCurrentlyPlaying(null);
    }
  };

  const handleAudioRef = useCallback((postId, audioElement) => {
    audioRefs.current[postId] = audioElement;
  }, []);

  const handleDelete = async (chart) => {
    const id = chart.id;

    setDeletablePost(chart);
  };

  const actuallyDelete = async () => {
    const chart = deletablePost;
    const chartId = chart.id;
    console.log(chartId)

    setDeletablePost(null);
    
    try {
      setLoading(true);
      setError(null);

      // Don't proceed if not on client side
      if (!isClient) {
        setLoading(false);
        return;
      }

      // Don't proceed until session is ready
      if (!sessionReady) {
        setLoading(false);
        return;
      }

      // Check if session is still valid
      if (!isSessionValid()) {
        console.log("Session expired, clearing data");
        clearExpiredSession();
        setLoading(false);
        return;
      }

      // Ensure we have a session token
      if (!session) {
        console.log("No session token available");
        setError("No session token available");
        setLoading(false);
        return;
      }

      const response = await fetch(`${APILink}/api/charts/${chartId}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: session,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log("Deletion failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(`Deletion failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Deletion successful:", result);

      // Refresh the chart list to show updated status
      await handleMyCharts(currentPage);
    } catch (err) {
      console.error("Deletion error error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }

    setDeletablePost(null);
  };

  const handleVisibilityChange = async (chartId, currentStatus, intent) => {
    // Determine next status in cycle: PRIVATE -> PUBLIC -> UNLISTED -> PRIVATE
    let nextStatus = intent;
    // switch (currentStatus) {
    // case 'PRIVATE':
    // nextStatus = 'PUBLIC';
    //     break;
    //   case 'PUBLIC':
    //     nextStatus = 'UNLISTED';
    //     break;
    //   case 'UNLISTED':
    //     nextStatus = 'PRIVATE';
    //     break;
    //   default:
    //     nextStatus = 'PRIVATE';
    // }

    try {
      setLoading(true);
      setError(null);

      // Don't proceed if not on client side
      if (!isClient) {
        setLoading(false);
        return;
      }

      // Don't proceed until session is ready
      if (!sessionReady) {
        setLoading(false);
        return;
      }

      // Check if session is still valid
      if (!isSessionValid()) {
        console.log("Session expired, clearing data");
        clearExpiredSession();
        setLoading(false);
        return;
      }

      // Ensure we have a session token
      if (!session) {
        console.log("No session token available");
        setError("No session token available");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${APILink}/api/charts/${chartId}/visibility/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: session,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log("Visibility change failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(
          `Visibility change failed: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Visibility change successful:", result);

      // Refresh the chart list to show updated status
      await handleMyCharts(currentPage);
    } catch (err) {
      console.error("Visibility change error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while client-side mounting or session is not ready
  if (!isClient || !sessionReady) {
    return (
      <main>
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (error)
    return (
      <main>
        <p>Error: {error}</p>
      </main>
    );

  return (
    <main>
      {error && (
        <div
          style={{
            backgroundColor: "#fee",
            color: "#c00",
            padding: "10px",
            margin: "10px",
            borderRadius: "5px",
            border: "1px solid #fcc",
          }}
        >
          {error}
        </div>
      )}
      <div className="dashboard-container">
        <div className="my-charts">
          <div className="upload-section">
            <h2>My Charts</h2>
            <button
              className="upload-btn"
              type="button"
              onClick={openUpload}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload New Level"}
            </button>
          </div>
          <div className="charts-section">
            <ChartsList
              posts={posts}
              loading={loading}
              currentlyPlaying={currentlyPlaying}
              audioRefs={audioRefs.current}
              onPlay={handlePlay}
              onStop={handleStop}
              onAudioRef={handleAudioRef}
              onEdit={openEdit}
              sonolusUser={sonolusUser}
              onVisibilityChange={handleVisibilityChange}
              onDelete={handleDelete}
            />
          </div>
        </div>

        <PaginationControls
          pageCount={pageCount}
          currentPage={currentPage}
          posts={posts}
          onPageChange={handleMyCharts}
        />
        <ChartModal
          isOpen={isOpen}
          mode={mode}
          form={form}
          onClose={closePanel}
          onSubmit={onSubmit}
          onUpdate={update}
          loading={loading}
          editData={editData}
        />
      </div>
      {deletablePost != null && (
        <div className="modal-overlay">
          <div className="deletion-confirmation">
            <p className="you-sure">
              Are you sure you want to delete "{deletablePost.title}"
            </p>
            <p className="cannot-be-undone">This action cannot be undone</p>
            <div className="modal-buttons">
              <button className="confirm-delete" onClick={actuallyDelete}>
                Delete
              </button>
              <button
                className="cancel-delete"
                onClick={() => setDeletablePost(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
