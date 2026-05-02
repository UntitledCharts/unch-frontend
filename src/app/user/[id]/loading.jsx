import "./page.css";

export default function Loading() {
    return (
        <div className="profile-page">
            {/* Banner skeleton */}
            <div className="skeleton-pulse" style={{ width: '100%', height: 200, background: 'rgba(255,255,255,0.04)' }} />

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: -40, marginBottom: 24 }}>
                    <div className="skeleton-pulse" style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '3px solid #020617', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div className="skeleton-pulse" style={{ width: 160, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
                        <div className="skeleton-pulse" style={{ width: 100, height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton-pulse" style={{ width: 80, height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
                    ))}
                </div>

                {/* Charts grid */}
                <div className="skeleton-pulse" style={{ width: 120, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-pulse" style={{ aspectRatio: '1/1.3', borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
