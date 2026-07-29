"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Mic,
    BookOpen,
    Zap,
    Sparkles,
    ShieldCheck,
    Volume2,
    ArrowRight,
    CheckCircle2,
    FileText,
    BrainCircuit,
    Headphones,
    MessageSquareText,
    Star,
    Layers,
    Lock
} from "lucide-react";

interface LandingPageProps {
    user: any;
}

export default function LandingPage({ user }: LandingPageProps) {
    return (
        <div className="w-full space-y-20 pb-16">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden pt-8 pb-12 md:pt-12 md:pb-16 bg-gradient-to-b from-[#f9f6f0] via-[#f4efe6] to-[#f7f4ee] rounded-3xl border border-[#e7ded0] p-6 sm:p-12 shadow-sm">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    {/* Hero Title */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-[#212a3b] tracking-tight leading-[1.15]">
                        Turn Every Book Into an <br className="hidden sm:block" />
                        <span className="bg-gradient-to-r from-[#663820] via-[#8c4826] to-[#b86428] bg-clip-text text-transparent">
                            Interactive Voice Conversation
                        </span>
                    </h1>

                    {/* Hero Subtitle */}
                    <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed font-sans">
                        Upload any PDF or manuscript, choose an AI voice persona, and discuss, summarize, or interrogate literature in real time with natural voice.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        {user ? (
                            <Link
                                href="/books/new"
                                className="px-8 py-4 bg-[#663820] hover:bg-[#7a4528] text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5"
                            >
                                <BookOpen size={20} /> Upload New Book
                            </Link>
                        ) : (
                            <Link
                                href="/sign-up"
                                className="px-8 py-4 bg-[#663820] hover:bg-[#7a4528] text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5"
                            >
                                Get Started <ArrowRight size={18} />
                            </Link>
                        )}
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-stone-500 font-medium">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} className="text-emerald-600" /> Real-Time Voice Synthesis
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} className="text-emerald-600" /> Powered by Groq AI
                        </span>
                    </div>
                </div>

                {/* APP PREVIEW MOCKUP CARD */}
                <div className="mt-12 max-w-3xl mx-auto bg-white border border-[#e2d7c5] rounded-2xl shadow-xl overflow-hidden p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#663820]/10 border border-[#663820]/20 flex items-center justify-center text-[#663820] font-serif font-bold">
                                📖
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-base text-[#212a3b]">Clean Code: Handbook of Agile Craftsmanship</h3>
                                <p className="text-xs text-stone-500">By Robert C. Martin • Chapter 3: Functions</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Voice Session
                        </span>
                    </div>

                    {/* Interactive Voice Waveform Animation Preview */}
                    <div className="bg-stone-900 text-white rounded-xl p-5 space-y-4 shadow-inner">
                        <div className="flex items-center justify-between text-xs text-stone-400">
                            <span className="flex items-center gap-1.5 font-medium">
                                <Headphones size={14} className="text-amber-400" /> Voice Persona: <strong className="text-white">Rachel (Classic Reader)</strong>
                            </span>
                            <span className="font-mono text-amber-400">Groq LLM • 42ms</span>
                        </div>

                        {/* Animated Waveform */}
                        <div className="flex items-center justify-center gap-1.5 py-4">
                            <span className="w-1.5 h-6 bg-amber-400 rounded-full animate-[bounce_1.2s_infinite_100ms]" />
                            <span className="w-1.5 h-10 bg-amber-300 rounded-full animate-[bounce_1.4s_infinite_200ms]" />
                            <span className="w-1.5 h-14 bg-amber-200 rounded-full animate-[bounce_1.1s_infinite_300ms]" />
                            <span className="w-1.5 h-8 bg-amber-400 rounded-full animate-[bounce_1.5s_infinite_400ms]" />
                            <span className="w-1.5 h-12 bg-amber-300 rounded-full animate-[bounce_1.3s_infinite_500ms]" />
                            <span className="w-1.5 h-6 bg-amber-400 rounded-full animate-[bounce_1.2s_infinite_600ms]" />
                        </div>

                        <div className="p-3.5 bg-stone-800/80 border border-stone-700 rounded-lg text-sm text-stone-200 font-serif leading-relaxed italic">
                            &ldquo;Functions should do one thing. They should do it well. They should do it only. In Chapter 3, Martin emphasizes that small functions with descriptive names form the bedrock of maintainable software.&rdquo;
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS (3 STEPS) */}
            <section className="space-y-10">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#212a3b]">How ChapterChat Works</h2>
                    <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
                        Transforming static book PDFs into dynamic voice conversations in 3 effortless steps.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Step 1 */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-7 shadow-md space-y-4 hover:border-[#663820]/40 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-[#663820]/10 border border-[#663820]/20 flex items-center justify-center text-[#663820] font-bold text-xl group-hover:bg-[#663820] group-hover:text-white transition-colors">
                            1
                        </div>
                        <h3 className="text-xl font-bold font-serif text-[#212a3b]">Upload Your Book PDF</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">
                            Upload any PDF manuscript, textbook, research paper, or novel up to 50MB into your private cloud library.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-7 shadow-md space-y-4 hover:border-[#663820]/40 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-[#663820]/10 border border-[#663820]/20 flex items-center justify-center text-[#663820] font-bold text-xl group-hover:bg-[#663820] group-hover:text-white transition-colors">
                            2
                        </div>
                        <h3 className="text-xl font-bold font-serif text-[#212a3b]">AI Chapter Parsing</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">
                            ChapterChat automatically extracts text, chunks chapters, and assigns your preferred AI voice persona.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-7 shadow-md space-y-4 hover:border-[#663820]/40 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-[#663820]/10 border border-[#663820]/20 flex items-center justify-center text-[#663820] font-bold text-xl group-hover:bg-[#663820] group-hover:text-white transition-colors">
                            3
                        </div>
                        <h3 className="text-xl font-bold font-serif text-[#212a3b]">Speak & Interrogate</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">
                            Press mic to ask questions, request chapter summaries, or debate ideas with zero latency voice feedback.
                        </p>
                    </div>
                </div>
            </section>

            {/* KEY FEATURES GRID */}
            <section className="space-y-10">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#212a3b]">Everything You Need to Master Any Book</h2>
                    <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
                        Designed for students, researchers, book clubs, and lifelong learners.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Feature 1 */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#663820]/10 text-[#663820] flex items-center justify-center">
                            <Mic size={20} />
                        </div>
                        <h4 className="text-lg font-bold font-serif text-[#212a3b]">Natural Voice Dialogue</h4>
                        <p className="text-sm text-stone-600">
                            Hands-free voice interaction powered by Web Speech Recognition & Piper WASM text-to-speech.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#663820]/10 text-[#663820] flex items-center justify-center">
                            <Zap size={20} />
                        </div>
                        <h4 className="text-lg font-bold font-serif text-[#212a3b]">Groq Llama 3.3 Speed</h4>
                        <p className="text-sm text-stone-600">
                            Lightning-fast neural LLM reasoning provides instant answers with accurate chapter citations.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#663820]/10 text-[#663820] flex items-center justify-center">
                            <Volume2 size={20} />
                        </div>
                        <h4 className="text-lg font-bold font-serif text-[#212a3b]">Custom Voice Personas</h4>
                        <p className="text-sm text-stone-600">
                            Choose between Rachel, Adam, Domi, and Bella to match the tone of fiction, non-fiction, or technical papers.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#663820]/10 text-[#663820] flex items-center justify-center">
                            <Layers size={20} />
                        </div>
                        <h4 className="text-lg font-bold font-serif text-[#212a3b]">Smart Page Chunking</h4>
                        <p className="text-sm text-stone-600">
                            High-density PDF page parsing extracts key themes, key takeaways, and character arcs seamlessly.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#663820]/10 text-[#663820] flex items-center justify-center">
                            <Lock size={20} />
                        </div>
                        <h4 className="text-lg font-bold font-serif text-[#212a3b]">Privacy & Account OTP</h4>
                        <p className="text-sm text-stone-600">
                            Google OAuth 2.0 authentication combined with 6-digit Resend OTP code verification for account safety.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#663820]/10 text-[#663820] flex items-center justify-center">
                            <BrainCircuit size={20} />
                        </div>
                        <h4 className="text-lg font-bold font-serif text-[#212a3b]">Interactive Quizzes & Summaries</h4>
                        <p className="text-sm text-stone-600">
                            Ask your book to test your understanding with oral quizzes, chapter breakdowns, or exam prep questions.
                        </p>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="bg-white border border-[#e7ded0] rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center gap-1 text-amber-500 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={18} fill="currentColor" />
                        ))}
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-[#212a3b]">Loved by Readers & Researchers</h2>
                    <p className="text-stone-600 text-sm">See how ChapterChat changes how people consume literature.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-[#faf8f5] border border-[#e7ded0] rounded-2xl space-y-3">
                        <p className="text-stone-700 text-sm font-serif italic leading-relaxed">
                            &ldquo;As a graduate student with dozens of dense research papers to read every week, ChapterChat lets me talk through complex methodology while walking or cooking. It&apos;s a game changer!&rdquo;
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <div className="w-9 h-9 rounded-full bg-[#663820] text-white flex items-center justify-center font-bold text-xs">
                                DR
                            </div>
                            <div>
                                <h5 className="font-bold text-sm text-[#212a3b]">David Ross</h5>
                                <p className="text-xs text-stone-500">PhD Researcher</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-[#faf8f5] border border-[#e7ded0] rounded-2xl space-y-3">
                        <p className="text-stone-700 text-sm font-serif italic leading-relaxed">
                            &ldquo;The voice response speed is incredible. Being able to ask questions about specific chapters in non-fiction books and get verbal summaries saves me hours of notes.&rdquo;
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <div className="w-9 h-9 rounded-full bg-[#8c4826] text-white flex items-center justify-center font-bold text-xs">
                                EM
                            </div>
                            <div>
                                <h5 className="font-bold text-sm text-[#212a3b]">Elena Martinez</h5>
                                <p className="text-xs text-stone-500">Non-fiction Enthusiast</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION BANNER */}
            <section className="bg-gradient-to-r from-[#212a3b] via-[#1a2130] to-[#121722] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
                        Ready to Bring Your Books to Life?
                    </h2>
                    <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                        Join thousands of readers discovering the power of conversational AI. Start talking to your library today.
                    </p>
                    <div className="pt-2 flex flex-wrap justify-center gap-4">
                        <Link
                            href={user ? "/books/new" : "/sign-up"}
                            className="px-8 py-3.5 bg-[#663820] hover:bg-[#7a4528] text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
                        >
                            {user ? "Upload New Book" : "Get Started Now"} <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
