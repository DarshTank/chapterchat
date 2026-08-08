'use client';

import { Mic, MicOff, Loader2, Volume2, Sparkles, Clock, FileText, ExternalLink, X, MessageSquare, Pause, Play, Square, RotateCcw } from "lucide-react";
import usePiperVoice from "@/hooks/usePiperVoice";
import { IBook } from "@/types";
import Image from "next/image";
import Transcript from "@/components/Transcript";
import TextChat from "@/components/TextChat";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatBlobUrl } from "@/lib/utils";
import BookSummarySection from "@/components/BookSummarySection";
import { generateAndSaveSummaryAction } from "@/lib/actions/summary.actions";

const VoiceControls = ({ book }: { book: IBook }) => {
    const {
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
        clearError,
        limitError,
        maxDurationSeconds,
        audioBlocked,
        enableAudio,
        micLevel,
    } = usePiperVoice(book);

    const router = useRouter();
    const [summaryTrigger, setSummaryTrigger] = useState(0);
    const [autoSummarizedCount, setAutoSummarizedCount] = useState(0);
    const [showPdf, setShowPdf] = useState(false);
    const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');

    useEffect(() => {
        if (limitError) {
            toast.error(limitError);
            clearError();
        }
    }, [limitError, clearError]);

    // Auto-summarize when session stops/ends and new messages exist
    useEffect(() => {
        if (!isActive && messages.length > 0 && messages.length !== autoSummarizedCount) {
            const autoSummarize = async () => {
                setAutoSummarizedCount(messages.length);
                toast.info("Auto-summarizing discussion with Groq AI...");
                const res = await generateAndSaveSummaryAction(book._id, messages);
                if (res.success && res.data) {
                    toast.success("Discussion summary saved to your history!");
                    setSummaryTrigger((prev) => prev + 1);
                }
            };
            autoSummarize();
        }
    }, [isActive, messages, autoSummarizedCount, book._id]);

    const handleEndSession = async () => {
        stop();
        if (messages.length > 0 && messages.length !== autoSummarizedCount) {
            setAutoSummarizedCount(messages.length);
            toast.info("Auto-summarizing discussion with Groq AI...");
            const res = await generateAndSaveSummaryAction(book._id, messages);
            if (res.success && res.data) {
                toast.success("Discussion summary saved to your history!");
                setSummaryTrigger((prev) => prev + 1);
            }
        }
    };

    const handleStartNewSession = async () => {
        stop();
        if (messages.length > 0 && messages.length !== autoSummarizedCount) {
            setAutoSummarizedCount(messages.length);
            toast.info("Auto-summarizing discussion with Groq AI...");
            const res = await generateAndSaveSummaryAction(book._id, messages);
            if (res.success && res.data) {
                toast.success("Discussion summary saved to your history!");
                setSummaryTrigger((prev) => prev + 1);
            }
        }
        resetSession();
        toast.success("Started a new voice conversation!");
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusDisplay = () => {
        switch (status) {
            case 'connecting': return { label: 'Connecting to AI...', color: 'bg-amber-500 animate-pulse', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'starting': return { label: 'Starting Engine...', color: 'bg-blue-500 animate-pulse', badgeClass: 'bg-blue-50 text-[#663820] border-blue-200' };
            case 'listening': return { label: 'Listening to You', color: 'bg-emerald-500 animate-pulse', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'thinking': return { label: 'AI Thinking...', color: 'bg-amber-500 animate-pulse', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'speaking': return { label: 'AI Speaking', color: 'bg-emerald-500 animate-pulse', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            default: return { label: 'Session Ready', color: 'bg-stone-400', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200' };
        }
    };

    const statusDisplay = getStatusDisplay();
    const isLoading = status === 'connecting';

    return (
        <div className={`mx-auto flex flex-col gap-8 transition-all duration-300 ${showPdf ? 'max-w-7xl' : 'max-w-5xl'}`}>
            {/* BOOK DETAILS HERO CARD */}
            <div className="bg-gradient-to-r from-[#f8f4e9] via-[#f4efe6] to-[#f8f4e9] border border-[#e7ded0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                {/* Book Cover */}
                <div className="relative shrink-0 group">
                    <div className="w-[140px] h-[200px] sm:w-[160px] sm:h-[230px] rounded-2xl overflow-hidden shadow-xl border-2 border-white relative bg-stone-100">
                        <Image
                            src={formatBlobUrl(book.coverURL)}
                            alt={book.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>

                {/* Book & Engine Info */}
                <div className="flex-1 flex flex-col justify-between h-full space-y-4 text-center md:text-left w-full">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold text-[#663820]">
                            <span className="flex items-center gap-1 bg-[#663820]/10 px-2.5 py-1 rounded-md border border-[#663820]/20">
                                <Volume2 size={13} /> Persona: {book.persona || "Rachel"}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#212a3b] leading-tight">
                            {book.title}
                        </h1>
                        <p className="text-sm sm:text-base text-stone-600 font-medium">by {book.author}</p>
                    </div>
                </div>
            </div>

            {/* CHAT & PDF MANUSCRIPT SIDE-BY-SIDE SPLIT CONTAINER */}
            <div className={`grid grid-cols-1 gap-6 items-start transition-all duration-300 ${showPdf ? 'lg:grid-cols-12' : ''}`}>
                {/* LEFT COLUMN: PDF MANUSCRIPT READER (BESIDE CHAT WHEN TOGGLED) */}
                {showPdf && (
                    <div className="lg:col-span-6 bg-white border border-[#e7ded0] rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-300 h-[580px] flex flex-col">
                        <div className="flex items-center justify-between px-2 border-b border-stone-100 pb-3 shrink-0">
                            <div className="flex items-center gap-2 text-[#212a3b] font-serif font-bold text-sm sm:text-base truncate">
                                <FileText size={18} className="text-[#663820] shrink-0" />
                                <span className="truncate">PDF Reader — {book.title}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <a
                                    href={formatBlobUrl(book.fileURL)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#663820] hover:underline"
                                >
                                    <ExternalLink size={13} /> Open
                                </a>
                                <button
                                    onClick={() => setShowPdf(false)}
                                    className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 text-xs font-bold px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all"
                                >
                                    <X size={14} /> Close
                                </button>
                            </div>
                        </div>
                        <div className="w-full flex-1 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
                            <iframe
                                src={formatBlobUrl(book.fileURL)}
                                className="w-full h-full border-none"
                                title={`${book.title} PDF Manuscript`}
                            />
                        </div>
                    </div>
                )}

                {/* RIGHT COLUMN: INTERACTIVE DUAL MODE CONTAINER (VOICE vs TEXT CHAT) */}
                <div className={`${showPdf ? 'lg:col-span-6' : 'w-full'} bg-white border border-[#e7ded0] rounded-3xl shadow-sm overflow-hidden h-[580px] flex flex-col relative`}>
                    {/* Header Bar with Mode Selection Tabs */}
                    <div className="px-5 py-3.5 bg-[#faf8f5] border-b border-[#e7ded0] flex flex-wrap items-center justify-between gap-3 shrink-0">
                        {/* Mode Selector Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-[#f3e4c7]/60 p-1 rounded-xl border border-[#e7ded0]">
                            <button
                                onClick={() => setActiveTab('voice')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'voice'
                                        ? 'bg-[#663820] text-white shadow-xs'
                                        : 'text-stone-700 hover:text-[#212a3b]'
                                }`}
                            >
                                <Mic size={13} />
                                <span>Talk with Book (Voice)</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('text')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'text'
                                        ? 'bg-[#663820] text-white shadow-xs'
                                        : 'text-stone-700 hover:text-[#212a3b]'
                                }`}
                            >
                                <MessageSquare size={13} />
                                <span>Chat with Book (Text)</span>
                            </button>

                            <button
                                onClick={() => setShowPdf((prev) => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    showPdf
                                        ? 'bg-[#663820] text-white shadow-xs'
                                        : 'text-stone-700 hover:text-[#212a3b]'
                                }`}
                            >
                                <FileText size={13} />
                                <span>{showPdf ? "Hide Book" : "Show Book"}</span>
                            </button>
                        </div>

                        <span className="text-xs text-stone-500 hidden sm:inline">Groq AI Powered</span>
                    </div>

                    {/* Loading overlay when connecting */}
                    {activeTab === 'voice' && isLoading && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full border-4 border-[#663820]/20 border-t-[#663820] animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Mic className="size-5 text-[#663820]" />
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-base font-bold font-serif text-[#212a3b]">
                                    {messages.length === 0 ? 'Connecting to your AI companion...' : 'Reconnecting voice stream...'}
                                </p>
                                <p className="text-xs text-stone-500">Initializing voice synthesis & microphone channel</p>
                            </div>
                        </div>
                    )}

                    {/* Autoplay blocked — needs a fresh user gesture to unlock.
                        Without this the session plays silently with no explanation. */}
                    {activeTab === 'voice' && audioBlocked && (
                        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                                <Volume2 size={15} className="shrink-0" />
                                <span>Your browser blocked audio playback.</span>
                            </div>
                            <button
                                onClick={enableAudio}
                                className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs cursor-pointer"
                            >
                                <Volume2 className="size-3.5" />
                                <span>Enable Audio</span>
                            </button>
                        </div>
                    )}

                    {/* Tab Body: Voice vs Text Chat */}
                    {activeTab === 'voice' ? (
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            {/* DEDICATED VOICE CONTROLS TOOLBAR INSIDE TALK TAB */}
                            <div className="px-4 py-2.5 bg-[#f8f4e9] border-b border-[#e7ded0] flex flex-wrap items-center justify-between gap-3 shrink-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusDisplay.badgeClass}`}>
                                        <span className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
                                        {statusDisplay.label}
                                    </span>

                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-stone-700 text-xs font-semibold border border-stone-200 shadow-xs">
                                        <Clock size={13} className="text-amber-600" />
                                        <span>{formatDuration(duration)} / {formatDuration(maxDurationSeconds)}</span>
                                    </span>
                                </div>

                                {/* CONTROLS IN TOOLBAR (PAUSE, STOP, RESUME, NEW CONVERSATION) */}
                                {isActive ? (
                                    <div className="flex items-center gap-2">
                                        {isPaused ? (
                                            <button
                                                onClick={resumeAudio}
                                                className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs cursor-pointer animate-pulse"
                                                title="Resume voice playback"
                                            >
                                                <Play className="size-3.5 fill-current" />
                                                <span>Resume Voice</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={pauseAudio}
                                                className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-amber-900/80 hover:bg-amber-900 text-white transition-all shadow-xs cursor-pointer"
                                                title="Pause voice playback"
                                            >
                                                <Pause className="size-3.5 fill-current" />
                                                <span>Pause Voice</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={handleEndSession}
                                            className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white transition-all shadow-xs cursor-pointer"
                                            title="Stop and end voice session"
                                        >
                                            <Square className="size-3.5 fill-current" />
                                            <span>Stop Session</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={start}
                                            disabled={isLoading}
                                            className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-[#663820] hover:bg-[#522d19] text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                            title={messages.length > 0 ? "Resume voice session" : "Start voice session"}
                                        >
                                            <Mic className="size-3.5" />
                                            <span>{messages.length > 0 ? "Resume Session" : "Start Session"}</span>
                                        </button>

                                        {messages.length > 0 && (
                                            <button
                                                onClick={handleStartNewSession}
                                                className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-white border border-[#e7ded0] hover:bg-stone-100 text-stone-800 transition-all shadow-xs cursor-pointer"
                                                title="Start a new voice conversation"
                                            >
                                                <RotateCcw className="size-3.5 text-[#663820]" />
                                                <span>New Conversation</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Transcript
                                messages={messages}
                                currentMessage={currentMessage}
                                currentUserMessage={currentUserMessage}
                                onStartVoice={isActive ? handleEndSession : start}
                                onStartNewConversation={handleStartNewSession}
                                isActive={isActive}
                                isLoading={isLoading}
                                micLevel={micLevel}
                                status={status}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            <TextChat book={book} />
                        </div>
                    )}
                </div>
            </div>

            {/* GROQ AI PAST CONVERSATION SUMMARIES & VISIT HISTORY SECTION */}
            <BookSummarySection bookId={book._id} messages={messages} summaryTrigger={summaryTrigger} />
        </div>
    );
};

export default VoiceControls;
