'use client';

/**
 * Session-scoped audio primitives.
 *
 * The critical constraint this module exists to satisfy: iOS Safari grants
 * playback permission to a *specific* HTMLAudioElement, and only when the
 * first play() for that element happens synchronously inside a real user
 * gesture. Creating a new Audio() per sentence — as the old implementation
 * did — means every element after the first is unprivileged, so play()
 * rejects with NotAllowedError and the session is silent.
 *
 * So: one element per session, unlocked once on the Start click, reused for
 * every sentence by swapping .src.
 */

// 1-frame silent WAV. Playing this is what actually performs the unlock.
const SILENT_WAV =
    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export type UnlockResult = {
    audioUnlocked: boolean;
    contextUnlocked: boolean;
};

export class AudioSession {
    private el: HTMLAudioElement | null = null;
    private ctx: AudioContext | null = null;
    private unlocked = false;
    private blobUrls = new Set<string>();

    /**
     * Must be called synchronously from within a user-gesture handler
     * (e.g. onClick), before any await. Awaiting first pushes the play()
     * call outside the gesture window and iOS will reject it.
     */
    unlock(): UnlockResult {
        let audioUnlocked = false;
        let contextUnlocked = false;

        // --- HTMLAudioElement ---
        try {
            if (!this.el) {
                this.el = new Audio();
                // Lets iOS play in the silent-switch/ringer-off position and
                // keeps playback inline rather than kicking to fullscreen.
                this.el.setAttribute('playsinline', '');
                this.el.preload = 'auto';
            }

            this.el.src = SILENT_WAV;
            const p = this.el.play();
            if (p !== undefined) {
                p.then(() => {
                    this.el?.pause();
                    audioUnlocked = true;
                }).catch(() => {
                    // Left locked; caller surfaces a tap-to-enable affordance.
                });
            }
            // Optimistic: the promise settles after this returns, but a
            // non-throwing play() inside a gesture is the signal we have.
            audioUnlocked = true;
            this.unlocked = true;
        } catch {
            audioUnlocked = false;
        }

        // --- AudioContext (needed by VAD + the level meter) ---
        try {
            const Ctor =
                (window as any).AudioContext || (window as any).webkitAudioContext;
            if (Ctor) {
                if (!this.ctx) this.ctx = new Ctor();
                if (this.ctx?.state === 'suspended') void this.ctx.resume();
                contextUnlocked = this.ctx?.state === 'running';
            }
        } catch {
            contextUnlocked = false;
        }

        // --- speechSynthesis (fallback path) ---
        try {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.getVoices();
                window.speechSynthesis.resume();
            }
        } catch {
            /* non-fatal */
        }

        return { audioUnlocked, contextUnlocked };
    }

    getContext(): AudioContext | null {
        return this.ctx;
    }

    isUnlocked(): boolean {
        return this.unlocked;
    }

    /**
     * Play one clip on the shared element. Resolves when playback ends.
     * Rejects with a NotAllowedError-tagged error if the browser blocked
     * playback, so the caller can distinguish "autoplay blocked" (needs a
     * user tap) from "this clip is broken" (skip to the next one).
     */
    play(url: string, onStart?: (durationSec: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.el) {
                reject(new Error('AudioSession not initialised'));
                return;
            }
            const el = this.el;

            const cleanup = () => {
                el.onended = null;
                el.onerror = null;
                el.onloadedmetadata = null;
            };

            el.onloadedmetadata = () => {
                const d = el.duration;
                onStart?.(Number.isFinite(d) && d > 0 ? d : 0);
            };

            el.onended = () => {
                cleanup();
                resolve();
            };

            el.onerror = () => {
                cleanup();
                const err = new Error(
                    `Audio decode/network error (code ${el.error?.code ?? 'unknown'})`
                );
                err.name = 'AudioDecodeError';
                reject(err);
            };

            el.src = url;
            el.currentTime = 0;

            const p = el.play();
            if (p !== undefined) {
                p.catch((err: any) => {
                    cleanup();
                    if (err?.name === 'NotAllowedError') {
                        this.unlocked = false; // needs a fresh gesture
                    }
                    reject(err);
                });
            }
        });
    }

    pause() {
        this.el?.pause();
    }

    resume(): Promise<void> {
        const p = this.el?.play();
        return p ?? Promise.resolve();
    }

    trackBlobUrl(url: string) {
        this.blobUrls.add(url);
    }

    revokeBlobUrls() {
        this.blobUrls.forEach((u) => {
            try {
                URL.revokeObjectURL(u);
            } catch {
                /* already revoked */
            }
        });
        this.blobUrls.clear();
    }

    /** Stop playback without tearing down the unlock. */
    stopPlayback() {
        if (!this.el) return;
        this.el.onended = null;
        this.el.onerror = null;
        this.el.onloadedmetadata = null;
        this.el.pause();
        // Deliberately NOT removing src / calling load(): on iOS that can
        // drop the element's privileged state and re-lock the session.
    }

    /** Full teardown. After this, unlock() must run in a new gesture. */
    dispose() {
        this.stopPlayback();
        this.revokeBlobUrls();
        try {
            void this.ctx?.close();
        } catch {
            /* already closed */
        }
        this.ctx = null;
        this.el = null;
        this.unlocked = false;
    }
}
