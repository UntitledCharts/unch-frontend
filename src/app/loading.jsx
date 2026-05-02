export default function Loading() {
    return (
        <div style={{ width: '100%', minHeight: '80vh', padding: '20px clamp(20px, 5vw, 60px)' }}>
            {/* Hero skeleton */}
            <div style={{
                width: '100%',
                height: 'clamp(350px, 55vh, 550px)',
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(56,189,248,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '40px clamp(20px, 5vw, 40px)',
                gap: 24,
                marginBottom: 32,
            }}>
                <div className="skeleton-pulse" style={{
                    width: 'clamp(120px, 15vw, 200px)',
                    aspectRatio: '1/1',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    flexShrink: 0,
                }} />
                <div style={{ flex: 1, paddingBottom: 8 }}>
                    <div className="skeleton-pulse" style={{ width: 80, height: 22, borderRadius: 20, background: 'rgba(56,189,248,0.1)', marginBottom: 12 }} />
                    <div className="skeleton-pulse" style={{ width: '60%', maxWidth: 320, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', marginBottom: 10 }} />
                    <div className="skeleton-pulse" style={{ width: '40%', maxWidth: 200, height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }} />
                    <div className="skeleton-pulse" style={{ width: '30%', maxWidth: 160, height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginBottom: 20 }} />
                    <div className="skeleton-pulse" style={{ width: 130, height: 40, borderRadius: 10, background: 'rgba(56,189,248,0.08)' }} />
                </div>
            </div>

            {/* Carousel sections */}
            {[1, 2, 3].map(section => (
                <div key={section} style={{ marginBottom: 32 }}>
                    <div className="skeleton-pulse" style={{ width: 180, height: 22, borderRadius: 8, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
                    <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{ flexShrink: 0, width: 'clamp(160px, 20vw, 220px)' }}>
                                <div className="skeleton-pulse" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 10 }} />
                                <div className="skeleton-pulse" style={{ width: '80%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', marginBottom: 6 }} />
                                <div className="skeleton-pulse" style={{ width: '50%', height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
