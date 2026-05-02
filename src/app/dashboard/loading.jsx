export default function Loading() {
    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 20px 40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div className="skeleton-pulse" style={{ width: 200, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)' }} />
                <div className="skeleton-pulse" style={{ width: 120, height: 40, borderRadius: 10, background: 'rgba(56,189,248,0.1)' }} />
            </div>

            <div style={{ display: 'flex', gap: 24 }}>
                {/* Sidebar */}
                <div style={{ width: 260, flexShrink: 0 }}>
                    <div className="skeleton-pulse" style={{ width: '100%', height: 300, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
                </div>

                {/* Chart grid */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i}>
                            <div className="skeleton-pulse" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 10 }} />
                            <div className="skeleton-pulse" style={{ width: '75%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 6 }} />
                            <div className="skeleton-pulse" style={{ width: '50%', height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
