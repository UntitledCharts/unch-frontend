import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Level Detail';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }) {
    const { id } = params;
    const cleanId = id.replace(/^UnCh-/, '');

    // Fetch level data
    // Note: We need absolute URL for fetch in edge function usually, but check env
    // If process.env.NEXT_PUBLIC_API_URL works here.
    // Using a robust fallback or hardcoded for safety if env not avail in edge build time
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://unch.untitledcharts.com';

    let levelData = null;
    try {
        const res = await fetch(`${apiUrl}/api/charts/${cleanId}/`);
        if (res.ok) {
            const json = await res.json();
            levelData = json.data;
        }
    } catch (e) {
        console.error("Failed to fetch OG data", e);
    }

    if (!levelData) {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 40,
                        color: 'white',
                        background: '#0f172a',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    UntitledCharts
                </div>
            ),
            { ...size }
        );
    }

    const bgUrl = levelData.background_v3_file_hash
        ? `${levelData.asset_base_url}/${levelData.author}/${levelData.id}/${levelData.background_v3_file_hash}`
        : (levelData.background_file_hash
            ? `${levelData.asset_base_url}/${levelData.author}/${levelData.id}/${levelData.background_file_hash}`
            : null);

    const coverUrl = levelData.jacket_file_hash
        ? `${levelData.asset_base_url}/${levelData.author}/${levelData.id}/${levelData.jacket_file_hash}`
        : null;

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0f172a',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
            >
                {/* Background Layer */}
                {bgUrl && (
                    <img
                        src={bgUrl}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.3,
                            filter: 'blur(20px)',
                        }}
                    />
                )}

                {/* Content Layer */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    height: '100%',
                    padding: '60px',
                    alignItems: 'center',
                    gap: '40px',
                    zIndex: 10,
                }}>
                    {/* Cover Image */}
                    {coverUrl && (
                        <img
                            src={coverUrl}
                            style={{
                                width: '300px',
                                height: '300px',
                                borderRadius: '24px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                objectFit: 'cover',
                            }}
                        />
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        <div style={{
                            fontSize: '24px',
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.1)',
                            padding: '8px 20px',
                            borderRadius: '50px',
                            width: 'fit-content',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            fontWeight: 800
                        }}>
                            Lv. {levelData.rating}
                        </div>

                        <div style={{ fontSize: '60px', fontWeight: 900, color: 'white', lineHeight: 1.1, textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                            {levelData.title}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                            <div style={{ fontSize: '30px', color: '#cbd5e1' }}>
                                {levelData.artists}
                            </div>
                            <div style={{ fontSize: '24px', color: '#94a3b8' }}>
                                Charted by {levelData.author_full || levelData.author}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', fontSize: '24px' }}>
                                Running in UntitledCharts
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding Footer */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    right: '60px',
                    fontSize: '24px',
                    color: 'rgba(255,255,255,0.5)',
                    zIndex: 10,
                }}>
                    UntitledCharts
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
