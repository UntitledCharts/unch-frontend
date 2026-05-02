import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const revalidate = 86400;
export const alt = 'UntitledCharts';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    let logoData = null;
    try {
        const logoUrl = new URL('../../public/636a8f1e76b38cb1b9eb0a3d88d7df6f.png', import.meta.url);
        const logoRes = await fetch(logoUrl);
        if (logoRes.ok) logoData = await logoRes.arrayBuffer();
    } catch (e) {
        console.error(e);
    }

    return new ImageResponse(
        (
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 30,
            }}>
                {logoData ? <img src={`data:image/png;base64,${Buffer.from(logoData).toString('base64')}`} width={120} height={120} /> : <div style={{ fontSize: 100, display: 'flex' }}>🎵</div>}

                <div style={{
                    fontSize: 80,
                    fontWeight: 900,
                    color: 'white',
                    display: 'flex',
                }}>
                    UntitledCharts
                </div>
            </div>
        ),
        { ...size }
    );
}
