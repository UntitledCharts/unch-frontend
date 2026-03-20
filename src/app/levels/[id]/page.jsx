import LevelCard from './LevelCard';
import { notFound } from 'next/navigation';

const APILink = process.env.NEXT_PUBLIC_API_URL;
const SONOLUS_SERVER_URL = process.env.NEXT_PUBLIC_SONOLUS_SERVER_URL;


async function fetchLevel(rawId) {
  const cleanId = rawId.replace(/^UnCh-/, '');
  const res = await fetch(`${APILink}/api/charts/${cleanId}/`);
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const json = await res.json();
  const data = json.data;
  if (data.status === 'PRIVATE') return null;
  const base = json.asset_base_url;

  const buildAssetUrl = (hash) =>
    hash && base && data.author ? `${base}/${data.author}/${data.id}/${hash}` : null;

  return {
    id: data.id,
    sonolusId: rawId,
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
    asset_base_url: base,

    music_hash: data.music_file_hash || (data.music && data.music.hash),
    background_file_hash: data.background_file_hash || (data.background && data.background.hash),
    background_v3_file_hash: data.background_v3_file_hash || (data.backgroundV3 && data.backgroundV3.hash),

    backgroundUrl: buildAssetUrl(data.background_file_hash || (data.background && data.background.hash)),
    backgroundV3Url: buildAssetUrl(data.background_v3_file_hash || (data.backgroundV3 && data.backgroundV3.hash)),

    
    scheduled_publish: data.scheduled_publish || null,
    status: data.status || 'PUBLIC',
  };
}


export async function generateMetadata({ params }) {
  const { id } = await params;

  let level;
  try {
    level = await fetchLevel(id);
  } catch {
    return { title: 'Level not found' };
  }

  const authorName = level.author || 'Unknown';

  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  const publishedDate = formatDate(level.createdAt);

  const rawDescription = level.description || '';
  const cleanDescription = rawDescription.replace(/:[a-zA-Z0-9_]+:/g, '').trim();
  const descriptionText = cleanDescription.slice(0, 300) || 'No description provided.';

  return {
    title: `[Lv. ${level.rating}] ${level.title} - ${level.artists}`,
    description: descriptionText,
    openGraph: {
      title: `${level.title}`,
      description: descriptionText,
      siteName: `UntitledCharts${publishedDate ? ` - ${publishedDate}` : ''}`,
      type: 'article',
      publishedTime: level.createdAt,
      authors: [authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: `[Lv. ${level.rating}] ${level.title}`,
      description: descriptionText,
      creator: `@${authorName}`,
    },
    other: {
      'theme-color': '#38bdf8',
    },
  };
}


export default async function LevelPage({ params }) {
  const { id } = await params;

  let level = null;
  try {
    level = await fetchLevel(id);
  } catch {
    
  }

  if (level === null) {
    
  }

  return <LevelCard initialLevel={level} id={id} SONOLUS_SERVER_URL={SONOLUS_SERVER_URL} />;
}
