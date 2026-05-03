import LevelCard from './LevelCard';

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

  return {
    title: data.title || 'Untitled Level',
    description: data.description || 'No description provided.',
    author: data.author_full || data.author || 'Unknown',
    artists: data.artists || 'Unknown Artist',
    rating: data.rating || 0,
    createdAt: data.created_at || data.createdAt,
  };
}

async function fetchScheduled(rawId) {
  const cleanId = rawId.replace(/^UnCh-/, '');
  const res = await fetch(`${APILink}/api/charts/${cleanId}/scheduled/`);
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }) {
  const { id } = await params;

  let level;
  try {
    level = await fetchLevel(id);
  } catch {
    return { title: 'Level not found' };
  }

  if (!level) {
    const scheduled = await fetchScheduled(id);
    if (scheduled?.data) {
      const d = scheduled.data;
      return {
        title: `${d.title} - ${d.artists}`,
        openGraph: { title: d.title, siteName: 'UntitledCharts' },
        other: { 'theme-color': '#38bdf8' },
      };
    }
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
  return <LevelCard initialLevel={null} id={id} SONOLUS_SERVER_URL={SONOLUS_SERVER_URL} />;
}
