import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const targetUrl = searchParams.get('url');

        if (!targetUrl) {
            return new NextResponse('URL parameter is required', { status: 400 });
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.chapterchat_READ_WRITE_TOKEN;

        // Fetch private blob from Vercel Blob Storage using server Authorization token
        const response = await fetch(targetUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
            // Try appending token query param as fallback for Vercel Blob private store
            const urlWithToken = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}token=${token}`;
            const retryRes = await fetch(urlWithToken);
            if (retryRes.ok) {
                const arrayBuffer = await retryRes.arrayBuffer();
                const contentType = retryRes.headers.get('content-type') || 'image/png';
                return new NextResponse(arrayBuffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                });
            }
            return new NextResponse('Failed to fetch private blob', { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/png';

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Blob proxy error:', error);
        return new NextResponse('Internal server error fetching blob', { status: 500 });
    }
}
