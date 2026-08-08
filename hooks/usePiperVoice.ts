'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { IBook, Messages } from '@/types';
import { startVoiceSession, endVoiceSession } from '@/lib/actions/session.actions';
import { voiceOptions } from '@/lib/constants';
import { AudioSession } from '@/lib/audio/audioSession';
import { releaseStream } from '@/lib/audio/micLevel';
import {
    startVoiceRecorder,
    isRecordingSupported,
    type RecorderHandle,
} from '@/lib/audio/voiceRecorder';

export function useLatestRef<T>(value: T) {
    const ref = useRef(value);
    useEffect(() => { ref.current = value; }, [value]);
    return ref;
}

const TIMER_INTERVAL_MS = 1000;
const SECONDS_PER_MINUTE = 60;

export type CallStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'thinking' | 'speaking';

// Split text into natural sentence chunks for pipelined TTS
function splitIntoSentences(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

// Call the /api/ai/tts route and return an AudioBuffer blob URL, or null if rate limited / error / timeout
async function synthesizeSentence(text: string, persona: string, timeoutMs: number = 3500): Promise<string | null> {
    try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

        const res = await fetch('/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, persona }),
            signal: controller?.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!res.ok) {
            return null;
        }

        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch (err: any) {
        if (err?.name !== 'AbortError') {
            console.warn(`[TTS Fallback] Groq TTS synthesis error:`, err);
        }
        return null;
    }
}

export function usePiperVoice(book: IBook) {
    const { userId } = useAuth();

    const [status, setStatus] = useState<CallStatus>('idle');
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [limitError, setLimitError] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const isStoppingRef = useRef(false);

    // One audio element for the whole session. See lib/audio/audioSession.ts
    // for why per-sentence `new Audio()` breaks on iOS.
    const audioSessionRef = useRef<AudioSession | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);

    // Set when the browser blocks playback (NotAllowedError). The UI shows a
    // tap-to-enable button; previously this failed silently.
    const [audioBlocked, setAudioBlocked] = useState(false);

    const recorderRef = useRef<RecorderHandle | null>(null);

    // Live mic level (0..1) driving the meter. Replaces the interim
    // transcript, which Whisper cannot provide since it returns text only
    // once a turn has ended.
    const [micLevel, setMicLevel] = useState(0);
    const micLevelRef = useRef(0);

    const getAudioSession = useCallback((): AudioSession => {
        if (!audioSessionRef.current) {
            audioSessionRef.current = new AudioSession();
        }
        return audioSessionRef.current;
    }, []);

    const statusRef = useLatestRef(status);
    const maxDurationSeconds = 60 * 60;
    const maxDurationRef = useLatestRef(maxDurationSeconds);
    const durationRef = useLatestRef(duration);
    const messagesRef = useLatestRef(messages);

    const persona = book.persona || 'rachel';

    // Pre-warm browser voices on initial mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                window.speechSynthesis.getVoices();
                window.speechSynthesis.onvoiceschanged = () => {
                    window.speechSynthesis.getVoices();
                };
            } catch (_) {}
        }
    }, []);

    /**
     * Unlock audio playback. MUST be called synchronously from the user
     * gesture (the Start click) before any await — awaiting first moves the
     * play() call outside the gesture window and iOS rejects it.
     */
    const primeAudio = useCallback(() => {
        if (typeof window === 'undefined') return;
        const session = getAudioSession();
        const { audioUnlocked } = session.unlock();
        setAudioBlocked(!audioUnlocked);
    }, [getAudioSession]);

    const revokeBlobUrls = useCallback(() => {
        audioSessionRef.current?.revokeBlobUrls();
    }, []);

    const stopActiveAudio = useCallback(() => {
        audioSessionRef.current?.stopPlayback();
    }, []);

    const isPausedRef = useRef(false);
    const [isPaused, setIsPaused] = useState(false);

    // Pause active audio or speech synthesis
    const pauseAudio = useCallback(() => {
        isPausedRef.current = true;
        setIsPaused(true);
        audioSessionRef.current?.pause();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                window.speechSynthesis.pause();
            }
        }
    }, []);

    // Resume active audio or speech synthesis
    const resumeAudio = useCallback(() => {
        isPausedRef.current = false;
        setIsPaused(false);
        audioSessionRef.current?.resume().catch(() => {});
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
        }
    }, []);

    // Stop capturing microphone input (without releasing the mic stream).
    const stopRecognitionOnly = useCallback(() => {
        if (recorderRef.current) {
            try { recorderRef.current.stop(); } catch (_) {}
            recorderRef.current = null;
        }
        setMicLevel(0);
        micLevelRef.current = 0;
        // Legacy SpeechRecognition instance, if one is ever set by a fallback.
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (_) {}
            recognitionRef.current = null;
        }
    }, []);

    // Stop everything
    const stopAudioAndRecognition = useCallback(() => {
        stopActiveAudio();
        stopRecognitionOnly();
        revokeBlobUrls();
    }, [stopActiveAudio, stopRecognitionOnly, revokeBlobUrls]);

    // Fallback to Web Speech API when Groq Orpheus API reaches rate limit or times out
    const speakWithWebSpeechFallback = useCallback((textToSpeak: string, onEnded?: () => void) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            if (onEnded) onEnded();
            return;
        }

        const synth = window.speechSynthesis;
        try {
            if (synth.speaking || synth.pending) synth.cancel();
            synth.resume();
        } catch (_) {}

        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        const voiceEntry = voiceOptions[persona as keyof typeof voiceOptions] || voiceOptions.rachel;
        if (voiceEntry?.pitch) utterance.pitch = voiceEntry.pitch;
        if (voiceEntry?.rate) utterance.rate = voiceEntry.rate;

        let voices = synth.getVoices();
        if (voices.length === 0) {
            voices = synth.getVoices();
        }

        const isMale = voiceEntry?.description?.toLowerCase().includes('male') && !voiceEntry?.description?.toLowerCase().includes('female');
        let selectedVoice = voices.find(v => v.name.toLowerCase().includes(persona.toLowerCase()));
        if (!selectedVoice && voiceEntry?.match) {
            for (const keyword of voiceEntry.match) {
                const found = voices.find(v => v.name.toLowerCase().includes(keyword) || v.lang.toLowerCase().includes(keyword));
                if (found) {
                    selectedVoice = found;
                    break;
                }
            }
        }
        if (!selectedVoice) {
            selectedVoice = voices.find(v =>
                isMale
                    ? /\b(male|david|mark|james|daniel|chris|alex|guy|paul|richard|rishi|sean|fred)\b/i.test(v.name)
                    : /\b(female|zira|hazel|samantha|aria|victoria|rachel|diana|linda|catherine|karen|fiona|moira|susan|jenny|sara)\b/i.test(v.name)
            );
        }
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang || 'en-US';
        } else {
            utterance.lang = 'en-US';
        }

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const spokenText = textToSpeak.substring(0, event.charIndex + event.charLength);
                setCurrentMessage(spokenText);
            }
        };

        // Keep-alive timer for Chrome SpeechSynthesis bug (Chrome pauses speech synthesis after a few seconds)
        const keepAliveInterval = setInterval(() => {
            if (!synth.speaking) {
                clearInterval(keepAliveInterval);
            } else {
                synth.resume();
            }
        }, 250);

        utterance.onend = () => {
            clearInterval(keepAliveInterval);
            if (onEnded) onEnded();
        };

        utterance.onerror = () => {
            clearInterval(keepAliveInterval);
            if (onEnded) onEnded();
        };

        try {
            synth.speak(utterance);
            synth.resume();
        } catch (err) {
            clearInterval(keepAliveInterval);
            if (onEnded) onEnded();
        }
    }, [persona]);

    /**
     * Speak text using Groq TTS with sentence pipelining:
     * - Split into sentences
     * - Synthesize sentence N+1 while sentence N is playing
     * - Transcript updates in sync with audio playback
     */
    const speakText = useCallback(async (text: string, onEnded?: () => void) => {
        if (typeof window === 'undefined') return;

        stopRecognitionOnly();
        setStatus('speaking');
        setCurrentMessage('');

        const sentences = splitIntoSentences(text);
        if (sentences.length === 0) {
            setCurrentMessage('');
            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
            if (onEnded) onEnded();
            return;
        }

        let completed = false;
        let wordTimer: NodeJS.Timeout | null = null;

        const clearWordTimer = () => {
            if (wordTimer) {
                clearInterval(wordTimer);
                wordTimer = null;
            }
        };

        const finish = () => {
            if (completed) return;
            completed = true;
            clearWordTimer();
            setCurrentMessage('');
            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
            revokeBlobUrls();
            if (onEnded) onEnded();
        };

        if (isStoppingRef.current) { finish(); return; }

        // Pipeline: fetch sentence 0 immediately, fetch N+1 while N is playing
        const fetchCache: Map<number, Promise<string | null>> = new Map();

        const fetchSentence = (i: number): Promise<string | null> => {
            if (!fetchCache.has(i)) {
                // Sentence 0: 2500ms max to start initial audio quickly
                // Sentence N+1: 6000ms max while previous sentence is playing in background
                const timeout = i === 0 ? 2500 : 6000;
                fetchCache.set(i, synthesizeSentence(sentences[i], persona, timeout));
            }
            return fetchCache.get(i)!;
        };

        // Kick off sentence 0 fetch immediately
        fetchSentence(0);

        let sentenceIndex = 0;

        const playNextSentence = async () => {
            if (isStoppingRef.current || sentenceIndex >= sentences.length) {
                finish();
                return;
            }

            // Pre-fetch next sentence in background while current one is awaited
            if (sentenceIndex + 1 < sentences.length) {
                fetchSentence(sentenceIndex + 1);
            }

            try {
                const audioUrl = await fetchSentence(sentenceIndex);

                if (!audioUrl) {
                    const remainingText = sentences.slice(sentenceIndex).join(' ');
                    if (!remainingText.trim()) {
                        finish();
                        return;
                    }

                    if (!isStoppingRef.current) {
                        speakWithWebSpeechFallback(remainingText, finish);
                    }
                    return;
                }

                const session = getAudioSession();
                session.trackBlobUrl(audioUrl);

                if (isStoppingRef.current) { finish(); return; }

                // Word-by-word transcript sync, started once we know the duration.
                const startWordTimer = (durationSec: number) => {
                    clearWordTimer();

                    const previousText = sentences.slice(0, sentenceIndex).join(' ');
                    const prefix = previousText ? previousText + ' ' : '';
                    const currentSentenceText = sentences[sentenceIndex];
                    const words = currentSentenceText.split(' ');

                    if (words.length <= 1) {
                        setCurrentMessage(prefix + currentSentenceText);
                        return;
                    }

                    let wordCount = 1;
                    setCurrentMessage(prefix + words.slice(0, wordCount).join(' '));

                    // durationSec is 0 when metadata is unavailable (common on
                    // mobile Safari before loadedmetadata) — estimate instead.
                    const totalDurationMs = durationSec > 0
                        ? durationSec * 1000
                        : words.length * 280;

                    const intervalMs = Math.max(70, Math.floor(totalDurationMs / words.length));

                    wordTimer = setInterval(() => {
                        if (isPausedRef.current) return;
                        wordCount++;
                        if (wordCount <= words.length) {
                            setCurrentMessage(prefix + words.slice(0, wordCount).join(' '));
                        } else {
                            clearWordTimer();
                        }
                    }, intervalMs);
                };

                try {
                    await session.play(audioUrl, startWordTimer);

                    clearWordTimer();
                    setCurrentMessage(sentences.slice(0, sentenceIndex + 1).join(' '));
                    sentenceIndex++;
                    await playNextSentence();
                } catch (playErr: any) {
                    clearWordTimer();

                    if (playErr?.name === 'NotAllowedError') {
                        // Autoplay blocked. The old code silently skipped here,
                        // producing a completely silent session with no
                        // explanation. Surface it and stop — resuming needs a
                        // fresh user gesture.
                        console.warn('[TTS] Playback blocked by autoplay policy');
                        setAudioBlocked(true);
                        setLimitError('Tap "Enable Audio" to hear your AI companion.');
                        finish();
                        return;
                    }

                    // Decode/network failure on this clip: fall back to browser
                    // speech for the rest rather than dropping the turn.
                    console.warn('[TTS] Clip failed, using browser speech:', playErr?.message);
                    const remaining = sentences.slice(sentenceIndex).join(' ');
                    if (remaining.trim() && !isStoppingRef.current) {
                        speakWithWebSpeechFallback(remaining, finish);
                    } else {
                        finish();
                    }
                    return;
                }
            } catch (err) {
                clearWordTimer();
                console.error('[TTS] Synthesis or playback error:', err);
                sentenceIndex++;
                playNextSentence();
            }
        };

        await playNextSentence();
    }, [persona, stopRecognitionOnly, revokeBlobUrls, getAudioSession, speakWithWebSpeechFallback]);

    /**
     * Re-unlock audio after an autoplay block. Must be wired to a real click.
     */
    const enableAudio = useCallback(() => {
        const { audioUnlocked } = getAudioSession().unlock();
        setAudioBlocked(!audioUnlocked);
        if (audioUnlocked) setLimitError(null);
    }, [getAudioSession]);

    const isProcessingRef = useRef(false);

    // Send user message to AI and speak response
    const processUserSpeech = useCallback(async (userText: string) => {
        const text = userText.trim();
        if (!text || isStoppingRef.current || isProcessingRef.current) return;

        isProcessingRef.current = true;

        // Stop capturing while the AI thinks and speaks, so its own voice
        // is not recorded as the user's next turn.
        stopRecognitionOnly();
        setStatus('thinking');
        setCurrentUserMessage('');

        const currentHistory = messagesRef.current;
        const updatedMessages: Messages[] = [
            ...currentHistory,
            { role: 'user', content: text },
        ];
        setMessages(updatedMessages);

        const recentHistory = updatedMessages.slice(-10).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        }));

        try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 10000) : null;

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: recentHistory,
                    bookTitle: book.title,
                    bookAuthor: book.author,
                    bookId: book._id,
                }),
                signal: controller?.signal,
            });

            if (timeoutId) clearTimeout(timeoutId);

            const data = await res.json();
            const reply = data.response || "That's an interesting point! Tell me more.";

            if (!isStoppingRef.current) {
                await speakText(reply, () => {
                    if (!isStoppingRef.current) {
                        setTimeout(() => {
                            if (!isStoppingRef.current) startListening();
                        }, 300);
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching AI response:', err);
            setStatus('listening');
            setLimitError('Failed to connect to AI companion. Please try again.');
            if (!isStoppingRef.current) {
                setTimeout(() => {
                    if (!isStoppingRef.current) startListening();
                }, 1000);
            }
        } finally {
            isProcessingRef.current = false;
        }
    }, [book.title, book.author, book._id, messagesRef, speakText, stopRecognitionOnly]);

    /**
     * Send a recorded turn to our Whisper route and hand the text to the
     * chat pipeline.
     */
    const transcribeTurn = useCallback(async (audio: Blob) => {
        if (isStoppingRef.current || isProcessingRef.current) return;

        setStatus('thinking');
        setCurrentUserMessage('');

        try {
            const form = new FormData();
            form.append('audio', audio);

            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 15000) : null;

            const res = await fetch('/api/ai/stt', {
                method: 'POST',
                body: form,
                signal: controller?.signal,
            });

            if (timeoutId) clearTimeout(timeoutId);

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                if (res.status === 429 || body?.isRateLimit) {
                    setLimitError('Speech recognition is busy right now. Please wait a moment and try again.');
                } else if (body?.isConfigError) {
                    setLimitError('Speech recognition is not configured on the server.');
                } else {
                    setLimitError('Could not understand the audio. Please try again.');
                }
                if (!isStoppingRef.current) setStatus('listening');
                return;
            }

            const data = await res.json();
            const text = (data?.text ?? '').trim();

            // Empty transcript: silence or noise. Just keep listening.
            if (!text) {
                if (!isStoppingRef.current) setStatus('listening');
                return;
            }

            await processUserSpeech(text);
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                console.warn('[STT] Request failed:', err?.message);
                setLimitError('Could not reach the speech service. Check your connection.');
            }
            if (!isStoppingRef.current) setStatus('listening');
        }
    }, [processUserSpeech]);

    const transcribeTurnRef = useLatestRef(transcribeTurn);

    /**
     * Begin listening. Uses MediaRecorder + server-side Whisper rather than
     * the browser's SpeechRecognition, which is unavailable or unreliable on
     * Firefox, Brave, in-app webviews, and iOS Safari.
     */
    const startListening = useCallback(() => {
        if (isStoppingRef.current || isProcessingRef.current) return;

        if (!isRecordingSupported()) {
            setLimitError('Voice input is not supported in this browser. Please update your browser or use text chat.');
            setStatus('idle');
            return;
        }

        const ctx = audioSessionRef.current?.getContext();
        const stream = micStreamRef.current;

        if (!ctx || !stream) {
            setLimitError('Microphone is not ready. Please restart the session.');
            setStatus('idle');
            return;
        }

        // A suspended context produces a flat level signal, so VAD would
        // never trigger. Safari suspends aggressively on backgrounding.
        if (ctx.state === 'suspended') void ctx.resume();

        stopRecognitionOnly();

        recorderRef.current = startVoiceRecorder(ctx, stream, {
            silenceMs: 900,
            onTurnEnd: (audio) => {
                if (isStoppingRef.current || isProcessingRef.current) return;
                void transcribeTurnRef.current(audio);
            },
            onLevel: (l) => {
                micLevelRef.current = l;
                setMicLevel(l);
            },
            onError: (err) => {
                console.warn('[Recorder]', err.message);
                setLimitError('Microphone recording failed. Please restart the session.');
                setStatus('idle');
            },
        });

        setStatus('listening');
    }, [stopRecognitionOnly, transcribeTurnRef]);

    // Start full voice session
    const start = useCallback(async () => {
        if (!userId) {
            setLimitError('Please sign in to start a voice session.');
            return;
        }

        // Synchronously unlock browser HTML5 audio & speech synthesis on user gesture
        primeAudio();

        setLimitError(null);
        setStatus('connecting');
        isStoppingRef.current = false;

        // Insecure contexts (plain HTTP) have no navigator.mediaDevices at
        // all. The old optional-chaining skipped this silently and failed
        // later with a confusing error.
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            setStatus('idle');
            setLimitError('Voice requires a secure (HTTPS) connection. Please open this site over HTTPS.');
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus('idle');
            setLimitError('This browser cannot access the microphone. Please try Chrome, Edge, Safari, or Firefox.');
            return;
        }

        // Request microphone permission. Keep the stream — Phase 1 (VAD +
        // level meter) needs it, and holding it lets us stop tracks properly
        // on teardown instead of leaking the mic for the whole session.
        try {
            releaseStream(micStreamRef.current);
            micStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
        } catch (micErr) {
            console.error('Microphone permission error:', micErr);
            setStatus('idle');
            setLimitError('Microphone permission was denied. Please allow microphone permissions in your browser URL bar.');
            return;
        }

        // Start session in database
        try {
            const result = await startVoiceSession(userId, book._id);

            if (!result.success) {
                setLimitError(result.error || 'Session failed to start. Please try again.');
                setStatus('idle');
                return;
            }

            sessionIdRef.current = result.sessionId || null;
            startTimeRef.current = Date.now();
            setDuration(0);

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                if (startTimeRef.current) {
                    const newDuration = Math.floor(
                        (Date.now() - startTimeRef.current) / TIMER_INTERVAL_MS
                    );
                    setDuration(newDuration);
                    if (newDuration >= maxDurationRef.current) {
                        stop();
                        setLimitError(
                            `Session time limit (${Math.floor(
                                maxDurationRef.current / SECONDS_PER_MINUTE
                            )} minutes) reached.`
                        );
                    }
                }
            }, TIMER_INTERVAL_MS);

            if (!isStoppingRef.current) startListening();

        } catch (err) {
            console.error('Failed to start voice session:', err);
            setStatus('idle');
            setLimitError('Failed to start voice session. Please try again.');
        }
    }, [userId, book._id, maxDurationRef, startListening, primeAudio]);

    // Stop session
    const stop = useCallback(() => {
        isStoppingRef.current = true;
        setStatus('idle');
        setCurrentMessage('');
        setCurrentUserMessage('');

        stopAudioAndRecognition();

        // Release the mic so the browser's recording indicator turns off.
        releaseStream(micStreamRef.current);
        micStreamRef.current = null;

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch (_) {}
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (sessionIdRef.current) {
            endVoiceSession(sessionIdRef.current, durationRef.current).catch(err =>
                console.error('Failed to end voice session:', err)
            );
            sessionIdRef.current = null;
        }

        startTimeRef.current = null;
        isPausedRef.current = false;
        setIsPaused(false);
    }, [stopAudioAndRecognition, durationRef]);

    const resetSession = useCallback(() => {
        stop();
        setMessages([]);
        setCurrentMessage('');
        setCurrentUserMessage('');
        setDuration(0);
    }, [stop]);

    const clearError = useCallback(() => {
        setLimitError(null);
    }, []);

    useEffect(() => {
        return () => {
            if (sessionIdRef.current) stop();
            releaseStream(micStreamRef.current);
            micStreamRef.current = null;
            audioSessionRef.current?.dispose();
            audioSessionRef.current = null;
        };
    }, [stop]);

    const isActive =
        status === 'starting' ||
        status === 'listening' ||
        status === 'thinking' ||
        status === 'speaking';

    return {
        status,
        isActive,
        isPaused,
        pauseAudio,
        resumeAudio,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        start,
        stop,
        resetSession,
        limitError,
        maxDurationSeconds,
        clearError,
        audioBlocked,
        enableAudio,
        micLevel,
    };
}

export default usePiperVoice;
