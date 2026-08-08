import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

/**
 * Server-side speech-to-text via Groq Whisper.
 *
 * This replaces the browser's Web Speech API, which is not a portable
 * speech engine: in Chrome it proxies audio to Google's private backend,
 * Firefox has no support at all, Brave blocks the endpoint, and most
 * in-app webviews lack it. Transcribing on our own server makes voice
 * input behave identically on every browser.
 */

// Groq free tier caps uploads at 25MB; we stay well under with short turns.
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

// Below this, the clip is almost certainly a mis-trigger rather than speech.
// Skipping these protects the daily audio-seconds quota.
const MIN_AUDIO_BYTES = 1024;

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audio = formData.get('audio');

        if (!audio || !(audio instanceof Blob)) {
            return NextResponse.json(
                { error: 'audio file is required' },
                { status: 400 }
            );
        }

        if (audio.size < MIN_AUDIO_BYTES) {
            // Not an error — just nothing worth transcribing.
            return NextResponse.json({ text: '', tooShort: true }, { status: 200 });
        }

        if (audio.size > MAX_AUDIO_BYTES) {
            return NextResponse.json(
                { error: 'Audio clip too long. Please speak in shorter turns.' },
                { status: 413 }
            );
        }

        const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_VOICE_API_KEY;
        if (!apiKey) {
            console.error('[STT] GROQ_API_KEY is not configured');
            return NextResponse.json(
                { error: 'Speech recognition is not configured on the server.', isConfigError: true },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey });

        // The SDK needs a File with an extension it can map to a MIME type.
        const ext = extensionFor(audio.type);
        const file = new File([audio], `speech.${ext}`, {
            type: audio.type || 'audio/webm',
        });

        const transcription = await groq.audio.transcriptions.create({
            file,
            model: 'whisper-large-v3-turbo',
            response_format: 'json',
            // Bias the decoder toward book discussion vocabulary.
            prompt: 'A conversation about a book, its characters, themes, and chapters.',
        });

        const text = (transcription as any)?.text?.trim() ?? '';

        return NextResponse.json({ text }, { status: 200 });
    } catch (error: any) {
        const message = error?.message || String(error);
        const status = error?.status;
        const isRateLimit =
            status === 429 || message.includes('429') || message.includes('rate_limit');

        console.warn('[STT] Transcription failed:', message);

        return NextResponse.json(
            { error: message, isRateLimit },
            { status: isRateLimit ? 429 : 500 }
        );
    }
}

function extensionFor(mimeType: string): string {
    if (!mimeType) return 'webm';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4') || mimeType.includes('aac')) return 'm4a';
    if (mimeType.includes('mpeg')) return 'mp3';
    if (mimeType.includes('wav')) return 'wav';
    return 'webm';
}
