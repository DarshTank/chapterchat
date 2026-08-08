'use client';

/**
 * Mic level metering off a shared AudioContext.
 *
 * Two consumers:
 *  - the UI level meter (replaces the interim transcript we lose by moving
 *    transcription server-side, so the user still gets live proof the mic
 *    is working)
 *  - voice-activity detection for turn-taking (Phase 1)
 *
 * Both read the same AnalyserNode, so the mic is tapped once.
 */

export type MicLevelHandle = {
    /** Current RMS level, 0..1. Read from a rAF loop. */
    getLevel: () => number;
    /** True once level has stayed under the silence threshold long enough. */
    isSilent: (silenceMs: number) => boolean;
    /** Reset the silence timer — call when a new turn starts. */
    resetSilence: () => void;
    stop: () => void;
};

// Tuned for typical speech on consumer mics. Deliberately low: false
// "still speaking" is much cheaper than truncating someone mid-sentence.
const SILENCE_THRESHOLD = 0.015;

export function createMicLevel(
    ctx: AudioContext,
    stream: MediaStream
): MicLevelHandle {
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    // NB: analyser is intentionally not connected to ctx.destination —
    // routing the mic to the speakers would cause feedback.

    const buf = new Float32Array(analyser.fftSize);
    let lastLoudAt = Date.now();
    let stopped = false;

    const getLevel = (): number => {
        if (stopped) return 0;
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        if (rms > SILENCE_THRESHOLD) lastLoudAt = Date.now();
        return Math.min(1, rms * 4); // scaled for display
    };

    return {
        getLevel,
        isSilent: (silenceMs: number) => {
            if (stopped) return true;
            getLevel(); // refresh lastLoudAt
            return Date.now() - lastLoudAt >= silenceMs;
        },
        resetSilence: () => {
            lastLoudAt = Date.now();
        },
        stop: () => {
            stopped = true;
            try {
                source.disconnect();
                analyser.disconnect();
            } catch {
                /* already disconnected */
            }
        },
    };
}

/** Stop all tracks on a stream. The old code leaked these — the mic
 *  indicator stayed lit for the whole session. */
export function releaseStream(stream: MediaStream | null) {
    if (!stream) return;
    stream.getTracks().forEach((t) => {
        try {
            t.stop();
        } catch {
            /* already stopped */
        }
    });
}
