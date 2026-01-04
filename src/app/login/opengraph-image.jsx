import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Login - UntitledCharts';
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
                    background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15), transparent 60%)',
                }} />

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10,
                    gap: '20px'
                }}>
                    <div style={{ fontSize: '40px', fontWeight: 700, color: '#38bdf8' }}>
                        UntitledCharts
                    </div>
                    <div style={{ fontSize: '90px', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
                        Login
                    </div>
                    <div style={{ fontSize: '24px', color: '#94a3b8', marginTop: '10px' }}>
                        Sign in to manage your charts
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
