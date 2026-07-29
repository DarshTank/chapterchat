import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Voice mapping: persona name → Groq Orpheus voice
// Available Groq Orpheus voices: hannah, diana, autumn, daniel, austin, troy
const PERSONA_VOICE_MAP: Record<string, string> = {
    // Male voices
    dave:     'daniel',   // Male, natural
    daniel:   'austin',   // Male, clear
    chris:    'troy',     // Male, friendly
    james:    'daniel',   // Male, deep
    alex:     'austin',   // Male, energetic
    // Female voices
    rachel:   'hannah',   // Female, warm
    sarah:    'diana',    // Female, gentle
    samantha: 'autumn',   // Female, professional
    aria:     'hannah',   // Female, story-like
    victoria: 'autumn',   // Female, British/smooth & articulate
    hazel:    'hannah',   // Female, enthusiastic
};

const DEFAULT_VOICE = 'hannah';

export async function POST(req: Request) {
    try {
        const { text, persona } = await req.json();

        if (!text || typeof text !== 'string' || !text.trim()) {
            return NextResponse.json({ error: 'text is required' }, { status: 400 });
        }

        const apiKey = process.env.GROQ_VOICE_API_KEY || process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GROQ_VOICE_API_KEY or GROQ_API_KEY is not configured' }, { status: 500 });
        }

        const groq = new Groq({ apiKey });

        const personaKey = (persona || 'rachel').toLowerCase();
        const voice = PERSONA_VOICE_MAP[personaKey] || DEFAULT_VOICE;

        // Groq Orpheus TTS — returns audio buffer
        const response = await groq.audio.speech.create({
            model: 'canopylabs/orpheus-v1-english',
            voice,
            input: text.trim(),
            response_format: 'wav',
        });

        // Get the audio as an ArrayBuffer and stream it back
        const audioBuffer = await response.arrayBuffer();

        return new Response(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Cache-Control': 'no-store',
            },
        });
    } catch (error: any) {
        const message = error?.message || String(error);
        const isRateLimit = error?.status === 429 || message.includes('429') || message.includes('rate_limit');
        console.warn('[TTS API Warning] Groq TTS rate limit or error:', message);
        return NextResponse.json(
            { error: message, isRateLimit },
            { status: isRateLimit ? 429 : 500 }
        );
    }
}
