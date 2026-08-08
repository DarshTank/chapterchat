'use client';

import { isRecordingSupported, pickMimeType } from './voiceRecorder';

/**
 * Up-front capability detection.
 *
 * The old code only discovered an unsupported browser *after* the user
 * clicked Start, and several failure modes (insecure context, missing
 * mediaDevices) were swallowed entirely. This reports the specific reason
 * before the session begins.
 */

export type VoiceCapability = {
    supported: boolean;
    /** User-facing explanation when unsupported. */
    reason?: string;
    /** Non-blocking notes (e.g. mic permission already denied). */
    warning?: string;
    details: {
        secureContext: boolean;
        mediaDevices: boolean;
        mediaRecorder: boolean;
        audioContext: boolean;
        mimeType: string;
    };
};

export function checkVoiceCapability(): VoiceCapability {
    // SSR guard — treat as supported so the UI doesn't flash an error
    // before hydration.
    if (typeof window === 'undefined') {
        return {
            supported: true,
            details: {
                secureContext: true,
                mediaDevices: true,
                mediaRecorder: true,
                audioContext: true,
                mimeType: '',
            },
        };
    }

    const secureContext = window.isSecureContext === true;
    const mediaDevices = !!navigator.mediaDevices?.getUserMedia;
    const mediaRecorder = typeof MediaRecorder !== 'undefined';
    const audioContext =
        typeof (window as any).AudioContext !== 'undefined' ||
        typeof (window as any).webkitAudioContext !== 'undefined';
    const mimeType = mediaRecorder ? pickMimeType() : '';

    const details = { secureContext, mediaDevices, mediaRecorder, audioContext, mimeType };

    // getUserMedia is only exposed in secure contexts, so check this first —
    // otherwise it looks like a missing-API problem rather than a URL problem.
    if (!secureContext) {
        return {
            supported: false,
            reason:
                'Voice chat requires a secure (HTTPS) connection. Please open this site over HTTPS.',
            details,
        };
    }

    if (!mediaDevices) {
        return {
            supported: false,
            reason:
                'This browser cannot access the microphone. Please try Chrome, Edge, Safari, or Firefox.',
            details,
        };
    }

    if (!mediaRecorder) {
        return {
            supported: false,
            reason:
                'This browser cannot record audio. Please update it, or use text chat instead.',
            details,
        };
    }

    if (!audioContext) {
        return {
            supported: false,
            reason:
                'This browser does not support audio processing. Please update it, or use text chat instead.',
            details,
        };
    }

    return { supported: true, details };
}

/**
 * Check mic permission without prompting, where the Permissions API allows
 * it. Returns null when the browser can't answer (Firefox and Safari have
 * historically not supported the 'microphone' descriptor).
 */
export async function getMicPermissionState(): Promise<PermissionState | null> {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return null;
    try {
        const status = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
        });
        return status.state;
    } catch {
        return null;
    }
}
