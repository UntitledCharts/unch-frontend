import LevelCard from './LevelCard';
import { notFound } from 'next/navigation';

const APILink = process.env.NEXT_PUBLIC_API_URL;
const SONOLUS_SERVER_URL = process.env.NEXT_PUBLIC_SONOLUS_SERVER_URL;


async function fetchLevel(rawId) {
  const cleanId = rawId.replace(/^UnCh-/, '');
  const res = await fetch(`${APILink}/api/charts/${cleanId}/`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const json = await res.json();
  const data = json.data;
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
    author: data.author_full || data.author || 'Unknown',
    artists: data.artists || 'Unknown Artist',
    rating: data.rating || 0,
    likes: data.likes || data.like_count || 0,
    comments: data.comments || data.comments_count || 0,
    createdAt: data.created_at || data.createdAt,
    asset_base_url: base,

    music_hash: data.music_file_hash || (data.music && data.music.hash),
    background_file_hash: data.background_file_hash || (data.background && data.background.hash),
    background_v3_file_hash: data.background_v3_file_hash || (data.backgroundV3 && data.backgroundV3.hash),

    backgroundUrl: buildAssetUrl(data.background_file_hash || (data.background && data.background.hash)),
    backgroundV3Url: buildAssetUrl(data.background_v3_file_hash || (data.backgroundV3 && data.backgroundV3.hash)),
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

  const ogDescription = level.description;
  const twitterText = `Play ${level.title} now on UntitledCharts!\nLevel ${level.rating} charted by ${level.author}`;

  return {
    title: `[${level.rating}] ${level.title}`,
    description: ogDescription,
    openGraph: {
      title: `[${level.rating}] ${level.title}`,
      description: ogDescription,
      site_name: `UntitledCharts - ${level.author}`,
      images: level.thumbnail ? [{ url: level.thumbnail }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `[${level.rating}] ${level.title}`,
      description: twitterText,
      images: level.thumbnail ? [level.thumbnail] : [],
    },
  };
}


export default async function LevelPage({ params }) {
  const { id } = await params;

  let level;
  try {
    level = await fetchLevel(id);
  } catch {
    notFound();
  }

  return <LevelCard level={level} SONOLUS_SERVER_URL={SONOLUS_SERVER_URL} />;
}
