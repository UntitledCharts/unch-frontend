import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get('url');

    if (!audioUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        const response = await fetch(audioUrl);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch audio' }, { status: response.status });
        }

        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');

        if (!headers.get('content-type')) {
            headers.set('content-type', 'audio/mpeg');
        }

        return new NextResponse(response.body, {
            status: 200,
            headers: headers,
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
