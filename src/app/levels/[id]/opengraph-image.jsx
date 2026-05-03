import { ImageResponse } from 'next/og';
import { getDecodedFonts, getDecodedFontDB } from '../../../data/fontLoader';
import { emojis } from '../../../data/emojis';

const logoUrl = new URL('../../../../public/636a8f1e76b38cb1b9eb0a3d88d7df6f.png', import.meta.url);
const mikuUrl = new URL('../../../../public/mikudayo.png', import.meta.url);
const starsUrl = new URL('../../../../public/stars.png', import.meta.url);
const defpfpUrl = new URL('../../../../public/defpfp.webp', import.meta.url);

export const runtime = 'edge';
export const revalidate = 3600;
export const alt = 'Level Detail';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const isValidImage = (bytes) => {
    if (!bytes || bytes.byteLength < 8) return false;
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
        && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
    return false;
};

const bufferToBase64 = (buffer, defaultMime = 'image/png') => {
    if (!buffer) return null;
    const bytes = new Uint8Array(buffer);
    if (!isValidImage(bytes)) return null;
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
    let levelData = null;
    let assetBaseUrl = null;

    try {
        const { id } = await params;
        const cleanId = id.replace(/^UnCh-/, '');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        try {
            const res = await fetch(`${apiUrl}/api/charts/${cleanId}/`);
            if (res.ok) {
                const json = await res.json();
                levelData = json.data;
                assetBaseUrl = json.asset_base_url;
            }
        } catch (e) { console.error("Could not fetch level", e); }

        if (!levelData) {
            try {
                const res = await fetch(`${apiUrl}/api/charts/${cleanId}/scheduled/`);
                if (res.ok) {
                    const json = await res.json();
                    levelData = json.data;
                    assetBaseUrl = json.asset_base_url;
                }
            } catch (e) {}
        }

        if (!levelData) {
            const fonts = getDecodedFontDB();
            return new ImageResponse(
                (
                    <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.length > 0 ? 'Rodin' : 'sans-serif' }}>
                        <div style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>Chart Not Found</div>
                    </div>
                ),
                { ...size, fonts }
            );
        }

        const requiredEmojiKeys = new Set();
        const textsToCheck = [levelData.title, levelData.artists, levelData.author, levelData.author_full];
        Object.keys(emojis).forEach(key => {
            const pattern = `:${key}:`;
            if (textsToCheck.some(t => t && t.includes(pattern))) {
                requiredEmojiKeys.add(key);
            }
        });

        
        const logoPromise = fetch(logoUrl).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
        const mikuPromise = fetch(mikuUrl).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
        const starsPromise = fetch(starsUrl).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
        const defpfpPromise = fetch(defpfpUrl).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);

        let bgPromise = Promise.resolve(null);
        let jacketPromise = Promise.resolve(null);
        let pfpPromise = Promise.resolve(null);

        const bgUsedHash = levelData.background_v3_file_hash || (levelData.backgroundV3 && levelData.backgroundV3.hash) || levelData.background_file_hash || (levelData.background && levelData.background.hash) || levelData.jacket_file_hash || (levelData.cover && levelData.cover.hash);
        if (assetBaseUrl && bgUsedHash) {
            bgPromise = fetch(`${assetBaseUrl}/${levelData.author}/${levelData.id}/${bgUsedHash}`).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
        }

        const jacketHash = levelData.jacket_file_hash || (levelData.cover && levelData.cover.hash);
        if (assetBaseUrl && jacketHash) {
            jacketPromise = fetch(`${assetBaseUrl}/${levelData.author}/${levelData.id}/${jacketHash}`).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
        }

        if (assetBaseUrl && levelData.author) {
            pfpPromise = fetch(`${apiUrl}/api/accounts/${levelData.author}`).then(async r => {
                if (!r.ok) return null;
                const authorJson = await r.json();
                if (authorJson.account?.profile_hash) {
                    return fetch(`${assetBaseUrl}/${levelData.author}/profile/${authorJson.account.profile_hash}`).then(r2 => r2.ok ? r2.arrayBuffer() : null);
                }
                return null;
            }).catch(() => null);
        }

        const fonts = getDecodedFonts();

        const emojiDataMap = {};
        const emojiPromises = Array.from(requiredEmojiKeys).map(async (name) => {
            try {
                const config = emojis[name];
                const imgUrl = config.image.startsWith('http')
                    ? config.image
                    : new URL(`../../../../public/emojis/${config.image}`, import.meta.url).toString();
                const imgRes = await fetch(imgUrl);
                if (imgRes.ok) {
                    const buffer = await imgRes.arrayBuffer();
                    emojiDataMap[name] = bufferToBase64(buffer);
                }
            } catch (e) { }
        });

        const [logoBuffer, mikuBuffer, starsBuffer, defpfpBuffer, bgBuffer, jacketBuffer, pfpBuffer] = await Promise.all([
            logoPromise, mikuPromise, starsPromise, defpfpPromise, bgPromise, jacketPromise, pfpPromise, ...emojiPromises
        ]);

        const logoData = bufferToBase64(logoBuffer);
        const mikuData = bufferToBase64(mikuBuffer);
        const starsData = bufferToBase64(starsBuffer);
        const defpfpData = bufferToBase64(defpfpBuffer, 'image/webp');
        const backgroundData = bufferToBase64(bgBuffer, 'image/jpeg');
        const jacketData = bufferToBase64(jacketBuffer, 'image/jpeg');
        const authorPfpData = bufferToBase64(pfpBuffer, 'image/png');

        const renderTextWithEmojis = (text, fontSize = 24) => {
            if (!text) return <div style={{ display: 'flex' }}></div>;

            if (!/(:[a-zA-Z0-9_]+:)/.test(text)) {
                return <div style={{ display: 'flex' }}>{text}</div>;
            }

            const parts = text.split(/(:[a-zA-Z0-9_]+:)/g).filter(Boolean);
            return (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    {parts.map((part, i) => {
                        const match = part.match(/^:([a-zA-Z0-9_]+):$/);
                        if (match && emojiDataMap[match[1]]) {
                            const emojiSize = Math.round(fontSize * 1.2);
                            return (
                                <img
                                    key={i}
                                    src={emojiDataMap[match[1]]}
                                    width={emojiSize}
                                    height={emojiSize}
                                    style={{ margin: '0 4px', display: 'flex' }}
                                />
                            );
                        }
                        return <div key={i} style={{ display: 'flex' }}>{part}</div>;
                    })}
                </div>
            );
        };

        const isStaffPick = levelData.staff_pick === 1 || levelData.staff_pick === true || levelData.staff_picked;

        
        const FRAME_MARGIN = 30; 

        
        const BORDER_COLOR = 'rgba(255, 255, 255, 0.7)';
        const BORDER_THICKNESS = 2; 
        const CORNER_RADIUS = 12; 

        
        const H_ARM_LEN = 440;
        const V_ARM_LEN = 210;

        return new ImageResponse(
            (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    fontFamily: fonts.length > 0 ? 'Rodin' : 'sans-serif',
                    overflow: 'hidden',
                    color: 'white',
                    backgroundColor: '#020617', 
                }}>
                    {}
                    {backgroundData && (
                        <img
                            src={backgroundData}
                            width={1200}
                            height={630}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                objectFit: 'cover',
                                opacity: 0.5,
                            }}
                        />
                    )}

                    {}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.3), rgba(2, 6, 23, 0.6) 60%, rgba(2, 6, 23, 0.8))',
                    }} />

                    {}

                    {}
                    <div style={{
                        position: 'absolute',
                        top: FRAME_MARGIN,
                        left: FRAME_MARGIN,
                        width: H_ARM_LEN,
                        height: V_ARM_LEN,
                        borderTopLeftRadius: CORNER_RADIUS,
                        borderTop: `${BORDER_THICKNESS}px solid ${BORDER_COLOR}`,
                        borderLeft: `${BORDER_THICKNESS}px solid ${BORDER_COLOR}`,
                    }} />

                    {}
                    <div style={{
                        position: 'absolute',
                        top: FRAME_MARGIN,
                        right: FRAME_MARGIN,
                        width: H_ARM_LEN,
                        height: V_ARM_LEN,
                        borderTopRightRadius: CORNER_RADIUS,
                        borderTop: `${BORDER_THICKNESS}px solid ${BORDER_COLOR}`,
                        borderRight: `${BORDER_THICKNESS}px solid ${BORDER_COLOR}`,
                    }} />

                    {}
                    <div style={{
                        position: 'absolute',
                        bottom: FRAME_MARGIN,
                        left: FRAME_MARGIN,
                        width: H_ARM_LEN,
                        height: V_ARM_LEN,
                        borderBottomLeftRadius: CORNER_RADIUS,
                        borderBottom: `${BORDER_THICKNESS}px solid ${BORDER_COLOR}`,
                        borderLeft: `${BORDER_THICKNESS}px solid ${BORDER_COLOR}`,
                    }} />

                    {}
                    <div style={{
                        position: 'absolute',
                        bottom: FRAME_MARGIN,
                        right: FRAME_MARGIN,
                        width: H_ARM_LEN,
                        height: V_ARM_LEN,
                        borderBottomRightRadius: CORNER_RADIUS,
                        borderBottom: `${BORDER_THICKNESS}px solid ${BORDER_COLOR}`,
                        borderRight: `${BORDER_THICKNESS}px solid ${BORDER_COLOR}`,
                    }} />


                    {}
                    {starsData && (
                        <img
                            src={starsData}
                            style={{
                                position: 'absolute',
                                top: FRAME_MARGIN - 14,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 200,
                                height: 32,
                                objectFit: 'contain'
                            }}
                        />
                    )}

                    {}
                    {starsData && (
                        <img
                            src={starsData}
                            style={{
                                position: 'absolute',
                                bottom: FRAME_MARGIN - 14,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 200,
                                height: 28,
                                objectFit: 'contain'
                            }}
                        />
                    )}

                    {}
                    {isStaffPick && (
                        <div style={{
                            position: 'absolute',
                            top: 60,
                            right: 60,
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#fbbf24',
                            background: 'rgba(251, 191, 36, 0.15)',
                            padding: '6px 14px',
                            borderRadius: 50,
                            border: '2px solid rgba(251, 191, 36, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            ⭐ Staff Pick
                        </div>
                    )}

                    {}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        position: 'absolute',
                        top: 80,
                        left: 70,
                        right: 70,
                        height: 470,
                        alignItems: 'center',
                        gap: 60, 
                    }}>
                        {}
                        <div style={{
                            width: 300,
                            height: 300,
                            borderRadius: 30, 
                            overflow: 'hidden',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                            flexShrink: 0,
                            display: 'flex',
                            position: 'relative', 
                        }}>
                            {jacketData ? (
                                <img src={jacketData} width={300} height={300} style={{ objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🎵</div>
                            )}
                            {}
                            <div style={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                fontSize: 18,
                                fontWeight: 700,
                                color: '#38bdf8',
                                background: 'rgba(0,0,0,0.7)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 8,
                                padding: '4px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                }}>
                                Lv. {levelData.rating || '?'}
                            </div>
                        </div>

                        {}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>


                            {}
                            <div style={{ fontSize: 60, fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                {renderTextWithEmojis((levelData.title || 'Untitled').slice(0, 28), 60)}
                            </div>

                            {}
                            <div style={{ fontSize: 30, color: '#f1f5f9', marginBottom: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                {renderTextWithEmojis((levelData.artists || 'Unknown Artist').slice(0, 36), 30)}
                            </div>

                            {}
                            <div style={{ fontSize: 24, color: '#94a3b8', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    marginRight: 12,
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#1e293b'
                                }}>
                                    <img src={authorPfpData || defpfpData} width={32} height={32} style={{ objectFit: 'cover' }} />
                                </div>
                                <div style={{ display: 'flex', marginRight: 6 }}>Charted by</div>{renderTextWithEmojis((levelData.author_full || levelData.author || 'Unknown').slice(0, 30), 24)}
                            </div>
                        </div>
                    </div>

                    {}
                    <div style={{
                        position: 'absolute',
                        bottom: 40,
                        width: '100%',
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 60px',
                        left: 0,
                    }}>
                        {}
                        <div style={{ position: 'absolute', left: 70, fontSize: 24, fontWeight: 400, color: '#38bdf8', display: 'flex', fontStyle: 'italic', opacity: 1 }}>
                            Untitled Charts
                        </div>

                        {}
                        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fca5a5', fontSize: 24, fontWeight: 600 }}>
                                ❤️ {levelData.like_count || 0}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#cbd5e1', fontSize: 24, fontWeight: 600 }}>
                                💬 {levelData.comment_count || 0}
                            </div>
                        </div>

                        {}
                        {mikuData && (
                            <img
                                src={mikuData}
                                width={50}
                                height={50}
                                style={{
                                    position: 'absolute',
                                    right: 70,
                                    objectFit: 'contain',
                                    opacity: 0.9
                                }}
                            />
                        )}
                    </div>

                </div>
            ),
            { ...size, fonts }
        );

    } catch (e) {
        console.error('OG image completely failed:', e);
        return new ImageResponse(
            (
                <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: 'white' }}>
                    <div style={{ fontSize: 48, fontWeight: 700 }}>{levelData ? levelData.title : 'Chart Preview'}</div>
                    <div style={{ fontSize: 24, color: '#94a3b8', marginTop: 16 }}>Unavailable</div>
                </div>
            ),
            { ...size }
        );
    }
}
