'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Pause, Square, Loader2 } from 'lucide-react';
import { voiceCategories, voiceOptions } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VoiceSelectorProps } from '@/types';

const VoiceSelector = ({ value, onChange, disabled, className }: VoiceSelectorProps) => {
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

    const activeAudioRef = React.useRef<HTMLAudioElement | null>(null);

    // Stop speech synthesis & audio playback when component unmounts
    useEffect(() => {
        return () => {
            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current = null;
            }
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const stopVoicePreview = () => {
        if (activeAudioRef.current) {
            activeAudioRef.current.pause();
            activeAudioRef.current.src = '';
            activeAudioRef.current = null;
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setPlayingVoiceId(null);
    };

    const fallbackToBrowserSpeech = (sampleText: string, voiceId: string, name: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setPlayingVoiceId(null);
            return;
        }

        const synth = window.speechSynthesis;
        try {
            if (synth.speaking || synth.pending) synth.cancel();
            if (synth.paused) synth.resume();

            const voices = synth.getVoices();
            const voiceEntry = voiceOptions[voiceId as keyof typeof voiceOptions];
            const isMale = voiceEntry?.description.toLowerCase().includes('male') && !voiceEntry?.description.toLowerCase().includes('female');

            const englishVoices = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('EN'));
            const pool = englishVoices.length > 0 ? englishVoices : voices;

            let selectedVoice: SpeechSynthesisVoice | undefined;
            if (voiceEntry?.match) {
                for (const keyword of voiceEntry.match) {
                    const found = pool.find(v => v.name.toLowerCase().includes(keyword) || v.lang.toLowerCase().includes(keyword));
                    if (found) {
                        selectedVoice = found;
                        break;
                    }
                }
            }

            if (!selectedVoice) {
                const genderPool = pool.filter(v =>
                    isMale
                        ? /\b(male|david|mark|james|daniel|chris|guy|paul|richard|rishi|sean|alex|fred)\b/i.test(v.name)
                        : /\b(female|zira|hazel|linda|catherine|samantha|karen|fiona|moira|susan|jenny|aria|sara|rachel|victoria)\b/i.test(v.name)
                );

                const list = isMale
                    ? ['dave', 'daniel', 'chris', 'james', 'alex']
                    : ['rachel', 'sarah', 'samantha', 'aria', 'victoria', 'hazel'];
                const voiceIdx = list.indexOf(voiceId);

                if (genderPool.length > 0) {
                    selectedVoice = genderPool[Math.max(0, voiceIdx) % genderPool.length];
                } else {
                    selectedVoice = pool[Math.max(0, voiceIdx) % pool.length];
                }
            }

            const utterance = new SpeechSynthesisUtterance(sampleText);
            utterance.rate = voiceEntry?.rate || 1.0;
            utterance.pitch = voiceEntry?.pitch || 1.0;
            utterance.volume = 1.0;
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang || 'en-US';
            } else {
                utterance.lang = 'en-US';
            }

            utterance.onend = () => setPlayingVoiceId(null);
            utterance.onerror = () => setPlayingVoiceId(null);

            synth.speak(utterance);
            if (synth.paused) synth.resume();
        } catch (err) {
            console.error('Error previewing browser voice:', err);
            setPlayingVoiceId(null);
        }
    };

    const handleVoicePreviewClick = async (e: React.MouseEvent, voiceId: string, name: string) => {
        e.stopPropagation();
        e.preventDefault();

        // If clicking the voice that is currently playing, stop/pause it
        if (playingVoiceId === voiceId) {
            stopVoicePreview();
            return;
        }

        // If another voice is playing, stop it first
        if (playingVoiceId) {
            stopVoicePreview();
        }

        setPlayingVoiceId(voiceId);
        const sampleText = `Hello! I am ${name}, your AI companion for reading books.`;

        // 1. Try Groq AI TTS API first so preview matches live session audio 100%!
        try {
            const res = await fetch('/api/ai/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: sampleText, persona: voiceId }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                activeAudioRef.current = audio;

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    activeAudioRef.current = null;
                    setPlayingVoiceId(null);
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(audioUrl);
                    activeAudioRef.current = null;
                    fallbackToBrowserSpeech(sampleText, voiceId, name);
                };

                await audio.play();
                return;
            }
        } catch (err) {
            console.warn('[TTS Preview] Groq API preview unavailable, falling back to browser speech:', err);
        }

        // 2. Fallback to browser Web Speech API
        fallbackToBrowserSpeech(sampleText, voiceId, name);
    };

    const renderVoiceGroup = (title: string, categoryKeys: string[]) => (
        <div className="space-y-3.5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#663820] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#663820]" /> {title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {categoryKeys.map((voiceId) => {
                    const voice = voiceOptions[voiceId as keyof typeof voiceOptions];
                    const isSelected = value === voiceId;
                    const isTesting = playingVoiceId === voiceId;

                    return (
                        <Label
                            key={voiceId}
                            className={cn(
                                'relative flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 select-none',
                                isSelected
                                    ? 'bg-[#f4efe6] border-[#663820] shadow-md ring-2 ring-[#663820]/15'
                                    : 'bg-white border-[#e7ded0] hover:border-[#663820]/40 hover:bg-[#fbf9f5] shadow-xs hover:shadow-sm',
                                disabled && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <RadioGroupItem value={voiceId} id={voiceId} className="sr-only" />
                            <div className="flex flex-col gap-1 pr-9">
                                <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                        isSelected ? "border-[#663820] bg-[#663820]" : "border-stone-300 bg-white"
                                    )}>
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <span className="font-serif font-bold text-[#212a3b] text-base">{voice.name}</span>
                                </div>
                                <p className="text-xs text-stone-500 font-sans leading-relaxed pl-6">
                                    {voice.description}
                                </p>
                            </div>

                            {/* Voice Audio Preview / Stop Button */}
                            <button
                                type="button"
                                onClick={(e) => handleVoicePreviewClick(e, voiceId, voice.name)}
                                disabled={disabled}
                                title={isTesting ? "Pause/Stop voice sample" : "Listen to voice sample"}
                                className={cn(
                                    "absolute right-3.5 top-3.5 p-2 rounded-xl transition-all shadow-xs shrink-0",
                                    isTesting
                                        ? "bg-[#663820] text-white shadow-md animate-pulse scale-105"
                                        : "bg-[#f4efe6] hover:bg-[#663820] text-[#663820] hover:text-white"
                                )}
                            >
                                {isTesting ? (
                                    <Pause className="w-4 h-4 fill-current" />
                                ) : (
                                    <Volume2 className="w-4 h-4" />
                                )}
                            </button>
                        </Label>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className={cn('space-y-6', className)}>
            <RadioGroup
                value={value}
                onValueChange={onChange}
                disabled={disabled}
                className="space-y-8"
            >
                {renderVoiceGroup('Male Voices', voiceCategories.male)}
                {renderVoiceGroup('Female Voices', voiceCategories.female)}
            </RadioGroup>
        </div>
    );
};

export default VoiceSelector;
