import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            return new NextResponse('Failed to fetch image', { status: response.status });
        }

        const buffer = await response.arrayBuffer();

        
        const bytes = new Uint8Array(buffer);
        let contentType = 'image/png';

        
        if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
            contentType = 'image/jpeg';
        } else if (bytes[0] === 0x89 && bytes[1] === 0x50) {
            contentType = 'image/png';
        } else if (bytes[0] === 0x47 && bytes[1] === 0x49) {
            contentType = 'image/gif';
        } else if (bytes[0] === 0x52 && bytes[1] === 0x49) {
            contentType = 'image/webp';
        }

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch {
        return new NextResponse('Failed to proxy image', { status: 500 });
    }
}
