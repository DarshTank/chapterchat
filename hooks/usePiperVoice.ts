'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { IBook, Messages } from '@/types';
import { startVoiceSession, endVoiceSession } from '@/lib/actions/session.actions';
import { voiceOptions } from '@/lib/constants';

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

// Call the /api/ai/tts route and return an AudioBuffer blob URL, or null if rate limited / error
async function synthesizeSentence(text: string, persona: string): Promise<string | null> {
    try {
        const res = await fetch('/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, persona }),
        });

        if (!res.ok) {
            console.warn(`[TTS API Status ${res.status}] Falling back to Web Speech Synthesis.`);
            return null;
        }

        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch (err) {
        console.warn(`[TTS Error] Falling back to Web Speech Synthesis:`, err);
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
    const activeAudioRef = useRef<HTMLAudioElement | null>(null);
    const recognitionRef = useRef<any>(null);
    const isStoppingRef = useRef(false);
    // Track blob URLs to revoke them after playback
    const blobUrlsRef = useRef<string[]>([]);

    const statusRef = useLatestRef(status);
    const maxDurationSeconds = 60 * 60;
    const maxDurationRef = useLatestRef(maxDurationSeconds);
    const durationRef = useLatestRef(duration);
    const messagesRef = useLatestRef(messages);

    const persona = book.persona || 'rachel';

    // Revoke all cached blob URLs to free memory
    const revokeBlobUrls = useCallback(() => {
        blobUrlsRef.current.forEach(url => {
            try { URL.revokeObjectURL(url); } catch (_) {}
        });
        blobUrlsRef.current = [];
    }, []);

    // Stop active audio playback
    const stopActiveAudio = useCallback(() => {
        if (activeAudioRef.current) {
            const audio = activeAudioRef.current;
            audio.oncanplaythrough = null;
            audio.onplay = null;
            audio.onended = null;
            audio.onerror = null;
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            activeAudioRef.current = null;
        }
    }, []);

    const isPausedRef = useRef(false);
    const [isPaused, setIsPaused] = useState(false);

    // Pause active audio or speech synthesis
    const pauseAudio = useCallback(() => {
        isPausedRef.current = true;
        setIsPaused(true);
        if (activeAudioRef.current && !activeAudioRef.current.paused) {
            activeAudioRef.current.pause();
        }
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
        if (activeAudioRef.current && activeAudioRef.current.paused) {
            activeAudioRef.current.play().catch(() => {});
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
        }
    }, []);

    // Stop speech recognition
    const stopRecognitionOnly = useCallback(() => {
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

    // Fallback to Web Speech API when Groq Orpheus API reaches rate limit
    const speakWithWebSpeechFallback = useCallback((textToSpeak: string, onEnded?: () => void) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            if (onEnded) onEnded();
            return;
        }

        const synth = window.speechSynthesis;
        try {
            if (synth.speaking || synth.pending) synth.cancel();
            if (synth.paused) synth.resume();
        } catch (_) {}

        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        const voiceEntry = voiceOptions[persona as keyof typeof voiceOptions] || voiceOptions.rachel;
        if (voiceEntry?.pitch) utterance.pitch = voiceEntry.pitch;
        if (voiceEntry?.rate) utterance.rate = voiceEntry.rate;

        const voices = synth.getVoices();
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

        utterance.onend = () => { if (onEnded) onEnded(); };
        utterance.onerror = () => { if (onEnded) onEnded(); };

        try {
            synth.speak(utterance);
            if (synth.paused) synth.resume();
        } catch (err) {
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
                fetchCache.set(i, synthesizeSentence(sentences[i], persona));
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
                    console.warn('[TTS Rate Limit] Groq Orpheus limit reached. Falling back to browser speech synthesis.');
                    const remainingText = sentences.slice(sentenceIndex).join(' ');
                    speakWithWebSpeechFallback(remainingText, finish);
                    return;
                }

                blobUrlsRef.current.push(audioUrl);

                console.log(`[TTS] Playing sentence ${sentenceIndex + 1}/${sentences.length}:`, sentences[sentenceIndex]);

                if (isStoppingRef.current) { finish(); return; }

                const audio = new Audio();
                activeAudioRef.current = audio;

                audio.oncanplaythrough = () => {
                    console.log(`[TTS] Audio ready to play, duration: ${audio.duration}s`);
                };

                audio.onplay = () => {
                    console.log(`[TTS] Audio playback started for sentence ${sentenceIndex + 1}`);
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

                    const totalDurationMs = (audio.duration && !isNaN(audio.duration) && audio.duration > 0)
                        ? (audio.duration * 1000)
                        : (words.length * 280);

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

                audio.onended = () => {
                    console.log(`[TTS] Audio ended for sentence ${sentenceIndex + 1}`);
                    clearWordTimer();
                    const spokenSoFar = sentences.slice(0, sentenceIndex + 1).join(' ');
                    setCurrentMessage(spokenSoFar);
                    activeAudioRef.current = null;
                    sentenceIndex++;
                    playNextSentence();
                };

                audio.onerror = (e) => {
                    clearWordTimer();
                    if (isStoppingRef.current || !audio.src || audio.src === window.location.href) {
                        return;
                    }
                    console.error('[TTS] Audio playback error:', audio.error?.code, audio.error?.message, e);
                    activeAudioRef.current = null;
                    sentenceIndex++;
                    playNextSentence();
                };

                // Set src after attaching event listeners
                audio.src = audioUrl;
                audio.load();

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => console.log('[TTS] play() resolved successfully'))
                        .catch(err => {
                            clearWordTimer();
                            console.error('[TTS] play() rejected:', err.name, err.message);
                            activeAudioRef.current = null;
                            sentenceIndex++;
                            playNextSentence();
                        });
                }
            } catch (err) {
                clearWordTimer();
                console.error('[TTS] Synthesis or playback error:', err);
                sentenceIndex++;
                playNextSentence();
            }
        };

        await playNextSentence();
    }, [persona, stopRecognitionOnly, revokeBlobUrls]);

    // Send user message to AI and speak response
    const processUserSpeech = useCallback(async (userText: string) => {
        if (!userText.trim() || isStoppingRef.current) return;

        setStatus('thinking');
        setCurrentUserMessage('');

        const currentHistory = messagesRef.current;
        const updatedMessages: Messages[] = [
            ...currentHistory,
            { role: 'user', content: userText },
        ];
        setMessages(updatedMessages);

        const recentHistory = updatedMessages.slice(-10).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        }));

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    history: recentHistory,
                    bookTitle: book.title,
                    bookAuthor: book.author,
                    bookId: book._id,
                }),
            });

            const data = await res.json();
            const reply = data.response || "That's an interesting point! Tell me more.";

            if (!isStoppingRef.current) {
                await speakText(reply, () => {
                    if (!isStoppingRef.current) {
                        // Brief delay after TTS ends before restarting mic
                        // prevents audio tail from being picked up as user input
                        setTimeout(() => {
                            if (!isStoppingRef.current) startListening();
                        }, 300);
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching AI response:', err);
            setStatus('idle');
            setLimitError('Failed to connect to AI companion. Please try again.');
        }
    }, [book.title, book.author, book._id, messagesRef, speakText]);

    // Web Speech API recognition loop (microphone input only)
    const networkRetryRef = useRef(0);
    const MAX_NETWORK_RETRIES = 5;

    const startListening = useCallback(() => {
        if (isStoppingRef.current) return;

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setLimitError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            setStatus('idle');
            return;
        }

        stopRecognitionOnly();

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setStatus('listening');

        recognition.onresult = (event: any) => {
            networkRetryRef.current = 0;
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (interimTranscript) setCurrentUserMessage(interimTranscript);

            if (finalTranscript.trim()) {
                setCurrentUserMessage('');
                try { recognition.stop(); } catch (_) {}
                processUserSpeech(finalTranscript.trim());
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setStatus('idle');
                setLimitError('Microphone access was denied. Please allow microphone permissions in your browser URL bar.');
                return;
            }
            if (event.error === 'aborted' || event.error === 'no-speech') {
                if (!isStoppingRef.current && statusRef.current === 'listening') {
                    try { recognition.start(); } catch (_) {}
                }
                return;
            }
            if (event.error === 'network') {
                networkRetryRef.current += 1;
                if (networkRetryRef.current >= MAX_NETWORK_RETRIES) {
                    networkRetryRef.current = 0;
                    setStatus('idle');
                    setLimitError('Speech recognition lost connection. Please check your internet and try again.');
                    return;
                }
                if (!isStoppingRef.current && statusRef.current === 'listening') {
                    const delay = Math.min(1000 * networkRetryRef.current, 3000);
                    setTimeout(() => {
                        if (!isStoppingRef.current && statusRef.current === 'listening') {
                            stopRecognitionOnly();
                            startListening();
                        }
                    }, delay);
                }
                return;
            }
            if (!isStoppingRef.current && statusRef.current === 'listening') {
                setTimeout(() => {
                    if (!isStoppingRef.current && statusRef.current === 'listening') {
                        try { recognition.start(); } catch (_) {}
                    }
                }, 500);
            }
        };

        recognition.onend = () => {
            if (!isStoppingRef.current && statusRef.current === 'listening') {
                try { recognition.start(); } catch (_) {}
            }
        };

        try {
            recognition.start();
        } catch (e) {
            console.error('Error starting recognition:', e);
        }
    }, [processUserSpeech, stopRecognitionOnly, statusRef]);

    // Start full voice session
    const start = useCallback(async () => {
        if (!userId) {
            setLimitError('Please sign in to start a voice session.');
            return;
        }

        setLimitError(null);
        setIsBillingError(false);
        setStatus('connecting');
        isStoppingRef.current = false;

        // Request microphone permission
        try {
            if (navigator.mediaDevices?.getUserMedia) {
                await navigator.mediaDevices.getUserMedia({ audio: true });
            }
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
    }, [userId, book._id, maxDurationRef, startListening]);

    // Stop session
    const stop = useCallback(() => {
        isStoppingRef.current = true;
        setStatus('idle');
        setCurrentMessage('');
        setCurrentUserMessage('');

        stopAudioAndRecognition();

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

    const clearError = useCallback(() => {
        setLimitError(null);
    }, []);

    useEffect(() => {
        return () => {
            if (sessionIdRef.current) stop();
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
        limitError,
        maxDurationSeconds,
        clearError,
    };
}

export default usePiperVoice;
