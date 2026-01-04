import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'UntitledCharts';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {/* Decorative elements */}
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    borderRadius: '50%',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    borderRadius: '50%',
                }} />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '100px',
                    padding: '20px 60px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(20px)',
                }}>
                    <div style={{ fontSize: '80px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-2px' }}>
                        UntitledCharts
                    </div>
                </div>

                <div style={{
                    marginTop: '40px',
                    fontSize: '32px',
                    color: '#94a3b8',
                    maxWidth: '600px',
                    textAlign: 'center',
                    lineHeight: 1.4,
                }}>
                    The Community Platform for Sonolus
                </div>
            </div>
        ),
        { ...size }
    );
}
