import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Level Detail';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
    const { id } = params;
    const cleanId = id.replace(/^UnCh-/, '');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // Initialize data containers
    let logoData = null;
    let mikuData = null;
    let starsData = null;
    const emojiDataMap = {};

    // Parallelize ALL asset fetching (Core assets + Emojis)
    // This ensures we wait for everything without sequential bottlenecks
    try {
        // 1. Prepare Core Asset Promises
        // Use absolute URL for public assets in Edge runtime to avoid relative path issues
        // We can reuse the API_URL or APP_URL logic, but for public files, constructing a full URL is safest.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

        const logoUrl = `${appUrl}/636a8f1e76b38cb1b9eb0a3d88d7df6f.png`;
        const mikuUrl = `${appUrl}/mikudayo.png`;
        const starsUrl = `${appUrl}/stars.png`;

        const coreAssetsPromise = Promise.all([
            fetch(logoUrl).then(res => res.ok ? res.arrayBuffer() : null).catch(() => null),
            fetch(mikuUrl).then(res => res.ok ? res.arrayBuffer() : null).catch(() => null),
            fetch(starsUrl).then(res => res.ok ? res.arrayBuffer() : null).catch(() => null)
        ]);

        // 2. Prepare Emoji Promises
        // Import emojis dynamically or use the static import (dynamic is fine here)
        const { emojis } = await import('../../../../src/data/emojis');

        const emojiPromises = Object.entries(emojis).map(async ([name, config]) => {
            try {
                let imgUrl;
                if (config.image.startsWith('http')) {
                    imgUrl = config.image;
                } else {
                    imgUrl = new URL(`../../../../public/emojis/${config.image}`, import.meta.url);
                }

                const imgRes = await fetch(imgUrl);
                if (imgRes.ok) {
                    const buffer = await imgRes.arrayBuffer();
                    const bytes = new Uint8Array(buffer);
                    let mimeType = 'image/png';
                    if (bytes[0] === 0xFF && bytes[1] === 0xD8) mimeType = 'image/jpeg';
                    else if (bytes[0] === 0x47 && bytes[1] === 0x49) mimeType = 'image/gif';
                    else if (bytes[0] === 0x52 && bytes[1] === 0x49) mimeType = 'image/webp';

                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                    emojiDataMap[name] = `data:${mimeType};base64,${btoa(binary)}`;
                } else {
                    console.error(`Failed to fetch emoji image: ${imgUrl} - ${imgRes.status}`);
                }
            } catch (e) {
                console.error("Emoji fetch error:", e);
            }
        });

        // 3. Await ALL fetches together
        const [coreAssetBuffers] = await Promise.all([
            coreAssetsPromise,
            Promise.all(emojiPromises) // This promise resolves after all emoji fetches and map updates are done
        ]);

        [logoData, mikuData, starsData] = coreAssetBuffers;

    } catch (e) {
        console.error("Asset loading error:", e);
    }

    // Helper to render text with emojis
    const renderTextWithEmojis = (text, fontSize = 24) => {
        if (!text) return null;
        const emojiKeys = Object.keys(emojiDataMap);
        if (emojiKeys.length === 0) return text;

        const pattern = new RegExp(`(${emojiKeys.map(k => `:${k}:`).join('|')})`, 'g');
        const parts = text.split(pattern);

        return parts.map((part, i) => {
            const match = part.match(/^:([^:]+):$/);
            if (match && emojiDataMap[match[1]]) {
                return (
                    <img
                        key={i}
                        src={emojiDataMap[match[1]]}
                        width={fontSize * 1.2}
                        height={fontSize * 1.2}
                        style={{
                            verticalAlign: 'middle',
                            margin: '0 4px'
                        }}
                    />
                );
            }
            return part;
        });
    };

    let levelData = null;
    let assetBaseUrl = null;
    let jacketData = null;
    let backgroundData = null;

    try {
        const res = await fetch(`${apiUrl}/api/charts/${cleanId}/`);
        if (res.ok) {
            const json = await res.json();
            levelData = json.data;
            assetBaseUrl = json.asset_base_url;

            if (assetBaseUrl && levelData?.author && levelData?.id) {
                const bgV3Hash = levelData.background_v3_file_hash || (levelData.backgroundV3 && levelData.backgroundV3.hash);
                const bgHash = levelData.background_file_hash || (levelData.background && levelData.background.hash);
                const jacketHash = levelData.jacket_file_hash || (levelData.cover && levelData.cover.hash);
                const bgUsedHash = bgV3Hash || bgHash || jacketHash;

                if (bgUsedHash) {
                    const bgUrl = `${assetBaseUrl}/${levelData.author}/${levelData.id}/${bgUsedHash}`;
                    try {
                        const bgRes = await fetch(bgUrl);
                        if (bgRes.ok) {
                            const buffer = await bgRes.arrayBuffer();
                            const bytes = new Uint8Array(buffer);
                            let mimeType = 'image/png';
                            if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) mimeType = 'image/jpeg';
                            let binary = '';
                            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                            backgroundData = `data:${mimeType};base64,${btoa(binary)}`;
                        }
                    } catch (e) { }
                }

                if (jacketHash) {
                    try {
                        const jacketUrl = `${assetBaseUrl}/${levelData.author}/${levelData.id}/${jacketHash}`;
                        const imgRes = await fetch(jacketUrl);
                        if (imgRes.ok) {
                            const buffer = await imgRes.arrayBuffer();
                            const bytes = new Uint8Array(buffer);
                            let mimeType = 'image/png';
                            if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) mimeType = 'image/jpeg';
                            let binary = '';
                            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                            jacketData = `data:${mimeType};base64,${btoa(binary)}`;
                        }
                    } catch (e) { }
                }
            }
        }
    } catch (e) { }

    const fonts = [];
    let fontDataDB = null;
    let fontDataEB = null;
    try {
        const fontDBUrl = new URL('../../../../public/FOT-RodinNTLG Pro DB.otf', import.meta.url);
        const fontEBUrl = new URL('../../../../public/FOT-RodinNTLG Pro EB.otf', import.meta.url);
        const [fontDBRes, fontEBRes] = await Promise.all([fetch(fontDBUrl), fetch(fontEBUrl)]);
        if (fontDBRes.ok) fontDataDB = await fontDBRes.arrayBuffer();
        if (fontEBRes.ok) fontDataEB = await fontEBRes.arrayBuffer();
    } catch (e) { }

    if (fontDataDB) fonts.push({ name: 'Rodin', data: fontDataDB, weight: 400, style: 'normal' });
    if (fontDataEB) fonts.push({ name: 'Rodin', data: fontDataEB, weight: 700, style: 'normal' });

    if (!levelData) {
        return new ImageResponse(
            (
                <div style={{
                    background: '#0f172a',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 20,
                    fontFamily: fonts.length > 0 ? 'Rodin' : 'sans-serif',
                }}>
                    <div style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>Chart Not Found</div>
                </div>
            ),
            { ...size, fonts }
        );
    }

    const isStaffPick = levelData.staff_pick === 1 || levelData.staff_pick === true || levelData.staff_picked;
    const hasDescription = levelData.description && levelData.description.trim().length > 0;

    // Configuration
    const FRAME_MARGIN = 30; // Close to edge

    // Border Color - White
    const BORDER_COLOR = 'rgba(255, 255, 255, 0.7)';
    const BORDER_THICKNESS = 2; // Thinner border
    const CORNER_RADIUS = 12; // Reduced curve 

    // L-Shape Dimensions
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
                backgroundColor: '#020617', // Dark background for base
            }}>
                {/* Background Image - LOWER OPACITY */}
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

                {/* Dark Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.3), rgba(2, 6, 23, 0.6) 60%, rgba(2, 6, 23, 0.8))',
                }} />

                {/* --- BORDER FRAME (4 L-SHAPES) --- */}

                {/* Top-Left Corner */}
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

                {/* Top-Right Corner */}
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

                {/* Bottom-Left Corner */}
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

                {/* Bottom-Right Corner */}
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


                {/* Stars at Top Gap */}
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

                {/* Stars at Bottom Gap */}
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

                {/* Staff Pick Badge */}
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
                        zIndex: 20
                    }}>
                        ⭐ Staff Pick
                    </div>
                )}

                {/* Main Content Area */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    position: 'absolute',
                    top: 80,
                    left: 70,
                    right: 70,
                    height: 470,
                    alignItems: 'center',
                    gap: 60, // Increased gap
                }}>
                    {/* Jacket - SIZED UP to 300, No Outline */}
                    <div style={{
                        width: 300,
                        height: 300,
                        borderRadius: 30, // Reduced curve to match border slightly (was 40)
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                        flexShrink: 0,
                        display: 'flex',
                    }}>
                        {jacketData ? (
                            <img src={jacketData} width={300} height={300} style={{ objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🎵</div>
                        )}
                    </div>

                    {/* Text Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                        {/* Level Badge - BLUE */}
                        <div style={{
                            fontSize: 18,
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.15)',
                            padding: '6px 20px',
                            borderRadius: 50,
                            border: '1px solid rgba(56, 189, 248, 0.5)',
                            fontWeight: 700,
                            marginBottom: 20,
                            display: 'flex',
                            alignSelf: 'flex-start',
                        }}>
                            Lv. {levelData.rating || '?'}
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: 60, fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                            {renderTextWithEmojis((levelData.title || 'Untitled').slice(0, 28), 60)}
                        </div>

                        {/* Artist */}
                        <div style={{ fontSize: 30, color: '#f1f5f9', marginBottom: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            {renderTextWithEmojis((levelData.artists || 'Unknown Artist').slice(0, 36), 30)}
                        </div>

                        {/* Charter */}
                        <div style={{ fontSize: 24, color: '#94a3b8', display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
                            Charted by {renderTextWithEmojis((levelData.author_full || levelData.author || 'Unknown').slice(0, 30), 24)}
                        </div>

                        {/* Description */}
                        {hasDescription && (
                            <div style={{
                                fontSize: 18,
                                color: '#e2e8f0',
                                lineHeight: 1.4,
                                padding: '18px 24px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: 16, // Reduced curve
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                maxWidth: 660,
                            }}>
                                {renderTextWithEmojis(levelData.description.slice(0, 130), 18)}{levelData.description.length > 130 ? '...' : ''}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Area */}
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
                    {/* Brand - BLUE, Absolute Left */}
                    <div style={{ position: 'absolute', left: 70, fontSize: 24, fontWeight: 400, color: '#38bdf8', display: 'flex', fontStyle: 'italic', opacity: 1 }}>
                        Untitled Charts
                    </div>

                    {/* Stats - Normal Flexbox (Centered by parent justifyContent: center) */}
                    <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fca5a5', fontSize: 24, fontWeight: 600 }}>
                            ❤️ {levelData.likes || levelData.like_count || 0}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#cbd5e1', fontSize: 24, fontWeight: 600 }}>
                            💬 {levelData.comments_count || levelData.comment_count || 0}
                        </div>
                    </div>

                    {/* Mikudayo - Absolute Right */}
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
}
