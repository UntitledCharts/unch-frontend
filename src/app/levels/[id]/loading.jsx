import "./page.css";
import "./LevelCard.css";

export default function Loading() {
    return (
        <main className="level-detail-wrapper">
            <div className="level-bg-blur" style={{ background: 'rgba(56,189,248,0.03)' }} />

            <div className="back-btn-container">
                <div style={{ width: 80, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }} />
            </div>

            <div className="level-detail-container">
                <div className="level-top-section">
                    <div className="level-image-container">
                        <div className="level-cover skeleton-pulse" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 12, background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    <div className="level-info" style={{ gap: 12 }}>
                        <div className="skeleton-pulse" style={{ width: '70%', height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)' }} />
                        <div className="skeleton-pulse" style={{ width: '50%', height: 18, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginTop: 4 }} />
                        <div className="skeleton-pulse" style={{ width: '40%', height: 18, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginTop: 4 }} />

                        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                            <div className="skeleton-pulse" style={{ width: 60, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                            <div className="skeleton-pulse" style={{ width: 60, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <div className="skeleton-pulse" style={{ width: 120, height: 40, borderRadius: 10, background: 'rgba(56,189,248,0.1)' }} />
                            <div className="skeleton-pulse" style={{ width: 120, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
                    <div className="skeleton-pulse" style={{ flex: 1, height: 120, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
                    <div className="skeleton-pulse" style={{ flex: 1, height: 120, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
                </div>

                <div style={{ marginTop: 24 }}>
                    <div className="skeleton-pulse" style={{ width: '30%', height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton-pulse" style={{ width: '100%', height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.03)', marginBottom: 10 }} />
                    ))}
                </div>
            </div>
        </main>
    );
}
