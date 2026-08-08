'use client';

import { createMicLevel, type MicLevelHandle } from './micLevel';

/**
 * MediaRecorder-based capture with voice-activity detection.
 *
 * Replaces the Web Speech API for input. MediaRecorder is supported
 * essentially everywhere (including Firefox and iOS Safari), so the same
 * code path works on every target browser.
 */

/**
 * Codec preference order. Safari only produces mp4/aac — hardcoding webm,
 * as most examples do, is a common reason voice input "works on Chrome but
 * not iPhone". Empty string = let the browser pick its default.
 */
const CODEC_CANDIDATES = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac',
    '',
];

export function pickMimeType(): string {
    if (typeof MediaRecorder === 'undefined') return '';
    for (const type of CODEC_CANDIDATES) {
        if (type === '') return '';
        try {
            if (MediaRecorder.isTypeSupported(type)) return type;
        } catch {
            /* isTypeSupported can throw on some older implementations */
        }
    }
    return '';
}

export function isRecordingSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof MediaRecorder !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia
    );
}

export type RecorderOptions = {
    /** Silence duration that ends a turn. Mirrors the old 900ms timer. */
    silenceMs?: number;
    /** Ignore turns shorter than this — usually coughs or clicks. */
    minSpeechMs?: number;
    /** Hard cap on a single turn, so a stuck mic can't upload forever. */
    maxTurnMs?: number;
    onTurnEnd: (audio: Blob) => void;
    onLevel?: (level: number) => void;
    onError?: (err: Error) => void;
};

export type RecorderHandle = {
    stop: () => void;
    isActive: () => boolean;
};

export function startVoiceRecorder(
    ctx: AudioContext,
    stream: MediaStream,
    opts: RecorderOptions
): RecorderHandle {
    const {
        silenceMs = 900,
        minSpeechMs = 300,
        maxTurnMs = 30000,
        onTurnEnd,
        onLevel,
        onError,
    } = opts;

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
        recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);
    } catch (err: any) {
        onError?.(new Error(`Could not start recording: ${err?.message ?? err}`));
        return { stop: () => {}, isActive: () => false };
    }

    const level: MicLevelHandle = createMicLevel(ctx, stream);

    let chunks: BlobPart[] = [];
    let speaking = false;
    let turnStartedAt = 0;
    let stopped = false;
    let rafId: number | null = null;

    recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onerror = (e: any) => {
        onError?.(new Error(`Recording error: ${e?.error?.name ?? 'unknown'}`));
    };

    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        chunks = [];
        const elapsed = Date.now() - turnStartedAt;

        // Drop clips too short to be speech, so we don't spend quota on them.
        if (elapsed >= minSpeechMs && blob.size > 0) {
            onTurnEnd(blob);
        }

        speaking = false;
        level.resetSilence();
    };

    const beginTurn = () => {
        if (speaking || stopped) return;
        if (recorder.state === 'recording') return;
        chunks = [];
        turnStartedAt = Date.now();
        speaking = true;
        try {
            recorder.start();
        } catch (err: any) {
            speaking = false;
            onError?.(new Error(`Could not start recording: ${err?.message ?? err}`));
        }
    };

    const endTurn = () => {
        if (!speaking) return;
        if (recorder.state !== 'recording') return;
        try {
            recorder.stop(); // fires onstop → onTurnEnd
        } catch {
            speaking = false;
        }
    };

    // VAD loop: start on speech, stop after sustained silence.
    // getLevel() is the single sample point per frame — it refreshes the
    // silence timer, so the checks below read consistent state.
    const tick = () => {
        if (stopped) return;

        onLevel?.(level.getLevel());

        if (!speaking) {
            if (level.isSpeaking()) beginTurn();
        } else {
            const tooLong = Date.now() - turnStartedAt >= maxTurnMs;
            if (tooLong || level.isSilent(silenceMs)) endTurn();
        }

        rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return {
        stop: () => {
            stopped = true;
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = null;
            // Discard any in-flight turn rather than transcribing a partial.
            if (recorder.state === 'recording') {
                recorder.onstop = null;
                try {
                    recorder.stop();
                } catch {
                    /* already stopped */
                }
            }
            speaking = false;
            level.stop();
        },
        isActive: () => !stopped,
    };
}
