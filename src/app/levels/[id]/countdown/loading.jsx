export default function Loading() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            gap: 24,
        }}>
            <div className="skeleton-pulse" style={{ width: 200, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)' }} />
            <div className="skeleton-pulse" style={{ width: 300, height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }} />
        </div>
    );
}
