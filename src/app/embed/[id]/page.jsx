import { notFound } from 'next/navigation';
import "./page.css";
import { Star, Download } from 'lucide-react';

const APILink = process.env.NEXT_PUBLIC_API_URL;

async function fetchLevel(rawId) {
    const cleanId = rawId.replace(/^UnCh-/, '');
    const res = await fetch(`${APILink}/api/charts/${cleanId}/`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const json = await res.json();
    const data = json.data;

    return {
        id: data.id,
        sonolusId: rawId,
        title: data.title || 'Untitled Level',
        description: data.description || 'No description provided.',
        author: data.author_full || data.author || 'Unknown',
        rating: data.rating || 0,
        likes: data.likes || data.like_count || 0,
        downloads: data.downloads || 0
    };
}

export default async function EmbedPage({ params }) {
    const { id } = await params;
    let level;

    try {
        level = await fetchLevel(id);
    } catch (e) {
        notFound();
    }

    return (
        <a href={`https://unch.untitledcharts.com/levels/${level.sonolusId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div className="embed-container">
                <div className="embed-header">
                    <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt="Logo" className="embed-mini-logo" />
                    <span>{level.author}</span>
                </div>

                <div className="embed-body">
                    <h1 className="embed-title">{level.title}</h1>
                    <p className="embed-description">{level.description}</p>
                </div>

                <div className="embed-stats">
                    <div className="embed-stat-item">
                        <span className="rating-dot"></span>
                        <span>Lv. {level.rating}</span>
                    </div>
                    <div className="embed-stat-item">
                        <Star className="stat-icon" />
                        <span>{level.likes}</span>
                    </div>
                    {/* Add download count if available in future */}
                </div>

                <div className="embed-footer">
                    <span>View on UntitledCharts</span>
                </div>
            </div>
        </a>
    );
}
