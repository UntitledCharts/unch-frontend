export default function Loading() {
    return (
        <div style={{
            width: '100%',
            maxWidth: 450,
            height: 240,
            margin: '0 auto',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            padding: 20,
            gap: 16,
        }}>
            <div className="skeleton-pulse" style={{ width: 120, height: 120, borderRadius: 10, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
                <div className="skeleton-pulse" style={{ width: '80%', height: 18, borderRadius: 6, background: 'rgba(255,255,255,0.08)', marginBottom: 10 }} />
                <div className="skeleton-pulse" style={{ width: '60%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }} />
                <div className="skeleton-pulse" style={{ width: '40%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
            </div>
        </div>
    );
}
