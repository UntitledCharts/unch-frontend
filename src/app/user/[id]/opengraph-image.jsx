import { ImageResponse } from 'next/og';
import { getDecodedFonts } from '../../../data/fontLoader';

export const runtime = 'edge';
export const revalidate = 3600;
export const alt = 'User Profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const defpfpUrl = new URL('../../../../public/defpfp.webp', import.meta.url);
const logoFileUrl = new URL('../../../../public/636a8f1e76b38cb1b9eb0a3d88d7df6f.png', import.meta.url);

const bufferToBase64 = (buffer, defaultMime = 'image/png') => {
    if (!buffer) return null;
    const bytes = new Uint8Array(buffer);
    let mimeType = defaultMime;
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) mimeType = 'image/jpeg';
    else if (bytes[0] === 0x47 && bytes[1] === 0x49) mimeType = 'image/gif';
    else if (bytes[0] === 0x89 && bytes[1] === 0x50) mimeType = 'image/png';
    else if (bytes[0] === 0x52 && bytes[1] === 0x49) mimeType = 'image/webp';
    const CHUNK = 8192;
    const parts = [];
    for (let i = 0; i < bytes.length; i += CHUNK) {
        parts.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
    }
    return `data:${mimeType};base64,${btoa(parts.join(''))}`;
};

export default async function Image({ params }) {
    const { id } = params;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    let accountData = null;
    let charts = [];
    let assetBaseUrl = null;

    const logoPromise = fetch(logoFileUrl)
        .then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);

    const defpfpPromise = fetch(defpfpUrl)
        .then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);

    const handlePromise = fetch(`${apiUrl}/api/accounts/handle/${id}/`)
        .then(async r => {
            if (!r.ok) return null;
            const handleData = await r.json();
            if (!handleData.sonolus_id) return null;
            const profileRes = await fetch(`${apiUrl}/api/accounts/${handleData.sonolus_id}`);
            return profileRes.ok ? profileRes.json() : null;
        }).catch(() => null);

    const directPromise = fetch(`${apiUrl}/api/accounts/${id}`)
        .then(r => r.ok ? r.json() : null).catch(() => null);

    const [logoData, defpfpBuffer, handleResult, directResult] = await Promise.all([logoPromise, defpfpPromise, handlePromise, directPromise]);

    const data = handleResult || directResult;
    if (data?.account) {
        accountData = data.account;
        charts = data.charts || [];
        assetBaseUrl = data.asset_base_url;
    }

    const fonts = getDecodedFonts();
    const defpfpData = bufferToBase64(defpfpBuffer, 'image/webp');

    let pfpUrl = defpfpData;
    if (accountData?.profile_hash && assetBaseUrl) {
        pfpUrl = `${assetBaseUrl}/${accountData.sonolus_id}/profile/${accountData.profile_hash}`;
    }

    let bannerUrl = null;
    if (accountData?.banner_hash && assetBaseUrl) {
        bannerUrl = `${assetBaseUrl}/${accountData.sonolus_id}/banner/${accountData.banner_hash}`;
    }

    
    const totalCharts = charts.length;
    const totalLikes = charts.reduce((sum, c) => sum + (c.likes || c.like_count || 0), 0);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0f172a',
                    
                    position: 'relative',
                }}
            >
                {}
                {bannerUrl ? (
                    <img
                        src={bannerUrl}
                        width={1200}
                        height={630}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            opacity: 0.6,
                            filter: 'blur(10px)',
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(circle at 20% 40%, rgba(56, 189, 248, 0.1) 0%, transparent 50%)',
                        }}
                    />
                )}

                {}
                {bannerUrl && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.7)'
                    }} />
                )}

                {}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    padding: '60px',
                    position: 'relative',
                }}>
                    {}
                    {logoData && (
                        <div style={{ position: 'absolute', top: 40, right: 50, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                                src={`data:image/png;base64,${Buffer.from(logoData).toString('base64')}`}
                                width={40}
                                height={40}
                                style={{ borderRadius: 8 }}
                            />
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: 600 }}>
                                UntitledCharts
                            </span>
                        </div>
                    )}

                    {}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 40, flex: 1, position: 'relative' }}>
                        {}
                        <div
                            style={{
                                width: 200,
                                height: 200,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '4px solid rgba(255,255,255,0.15)',
                                flexShrink: 0,
                                display: 'flex',
                            }}
                        >
                            {pfpUrl ? (
                                <img src={pfpUrl} width={200} height={200} style={{ objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: 200, height: 200, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 80, color: 'rgba(255,255,255,0.3)' }}>?</span>
                                </div>
                            )}
                        </div>

                        {}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span style={{ fontSize: 52, fontWeight: 700, color: 'white' }}>
                                    {accountData?.sonolus_username || 'Unknown User'}
                                </span>
                                {accountData?.admin && (
                                    <span style={{ padding: '6px 14px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: 16, fontWeight: 700, borderRadius: 8 }}>
                                        ADMIN
                                    </span>
                                )}
                                {accountData?.mod && !accountData?.admin && (
                                    <span style={{ padding: '6px 14px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', fontSize: 16, fontWeight: 700, borderRadius: 8 }}>
                                        MOD
                                    </span>
                                )}
                            </div>

                            <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                                #{accountData?.sonolus_handle || '000000'}
                            </span>

                            {}
                            <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>{totalCharts}</span>
                                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>{totalCharts === 1 ? 'Chart' : 'Charts'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>{formatNumber(totalLikes)}</span>
                                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>{totalLikes === 1 ? 'Total Like' : 'Total Likes'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 18, position: 'relative' }}>
                        untitledcharts.com/user/{id?.substring(0, 12)}...
                    </div>
                </div>
            </div>
        ),
        {
            ...size, fonts
        }
    );
}
