import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const revalidate = 86400;
export const alt = 'Browse Levels - UntitledCharts';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 30,
            }}>
                {}
                <div style={{
                    fontSize: 80,
                    display: 'flex',
                }}>
                    📊
                </div>

                {}
                <div style={{
                    fontSize: 64,
                    fontWeight: 900,
                    color: 'white',
                    display: 'flex',
                }}>
                    Browse Levels
                </div>

                {}
                <div style={{
                    fontSize: 28,
                    color: '#94a3b8',
                    display: 'flex',
                }}>
                    Discover and play community-created charts on Sonolus
                </div>

                {}
                <div style={{
                    position: 'absolute',
                    bottom: 40,
                    right: 60,
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#38bdf8',
                    display: 'flex',
                }}>
                    UntitledCharts
                </div>
            </div>
        ),
        { ...size }
    );
}
