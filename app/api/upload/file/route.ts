import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: Please sign in' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | Blob;
        const filename = (formData.get('filename') as string) || 'upload.pdf';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.chapterchat_READ_WRITE_TOKEN;

        if (!token) {
            return NextResponse.json({ error: 'Vercel Blob token is missing in .env' }, { status: 500 });
        }

        // Try private access for private store, fallback to public if store is public
        let blob;
        try {
            blob = await put(filename, file, {
                access: 'private',
                token,
                addRandomSuffix: true,
            });
        } catch (e) {
            console.warn('Private upload failed, retrying with public access:', e);
            blob = await put(filename, file, {
                access: 'public',
                token,
                addRandomSuffix: true,
            });
        }

        return NextResponse.json(blob);
    } catch (error) {
        console.error('Server file upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to upload file to Vercel Blob' },
            { status: 500 }
        );
    }
}
