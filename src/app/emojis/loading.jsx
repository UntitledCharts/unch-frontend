export default function Loading() {
    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 20px 40px' }}>
            <div className="skeleton-pulse" style={{ width: 200, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="skeleton-pulse" style={{ height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
                ))}
            </div>
        </div>
    );
}
