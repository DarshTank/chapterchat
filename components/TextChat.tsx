'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, BookOpen, Trash2 } from 'lucide-react';
import { Messages, IBook } from '@/types';

interface TextChatProps {
    book: IBook;
    onMessagesUpdate?: (messages: Messages[]) => void;
}

export default function TextChat({ book, onMessagesUpdate }: TextChatProps) {
    const [messages, setMessages] = useState<Messages[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const storageKey = `chapterchat_text_session_${book._id}`;

    // Restore preserved session messages from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && book._id) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setMessages(parsed);
                    }
                }
            } catch (e) {
                console.error('Error loading chat session:', e);
            }
        }
    }, [book._id, storageKey]);

    // Persist messages to localStorage whenever chat updates
    useEffect(() => {
        if (typeof window !== 'undefined' && book._id) {
            try {
                if (messages.length > 0) {
                    localStorage.setItem(storageKey, JSON.stringify(messages));
                } else {
                    localStorage.removeItem(storageKey);
                }
            } catch (e) {
                console.error('Error saving chat session:', e);
            }
        }

        scrollToBottom();
        if (onMessagesUpdate) {
            onMessagesUpdate(messages);
        }
    }, [messages, loading, book._id, storageKey]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    const handleClearChat = () => {
        setMessages([]);
        if (typeof window !== 'undefined' && book._id) {
            localStorage.removeItem(storageKey);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput('');

        const newMessages: Messages[] = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const recentHistory = newMessages.slice(-10).map((m) => ({
                role: m.role,
                content: m.content,
            }));

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
            const reply = data.response || "That's an interesting question about the book! Let's explore it further.";

            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        } catch (err) {
            console.error('Error in text chat:', err);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I had a issue connecting to Groq AI. Please try again.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Session Top Bar (Shows when messages exist) */}
            {messages.length > 0 && (
                <div className="px-4 py-2 bg-[#faf8f5] border-b border-[#e7ded0] flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold text-[#663820]">
                        Preserved Session History ({messages.length} msgs)
                    </span>
                    <button
                        onClick={handleClearChat}
                        className="inline-flex items-center gap-1 text-stone-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all cursor-pointer"
                    >
                        <Trash2 size={13} /> Clear Session
                    </button>
                </div>
            )}

            {/* Messages Feed */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 text-stone-500">
                        <div className="w-14 h-14 rounded-2xl bg-[#f8f4e9] border border-[#e7ded0] flex items-center justify-center text-[#663820]">
                            <BookOpen size={26} />
                        </div>
                        <div className="space-y-1 max-w-sm">
                            <h3 className="text-base font-bold font-serif text-[#212a3b]">
                                Text Chat with {book.title}
                            </h3>
                            <p className="text-xs text-stone-500">
                                Ask any question about characters, themes, chapter breakdowns, or key concepts in this book.
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 items-start animate-in fade-in duration-200 ${
                                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                        >
                            {/* Avatar Icon */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                    msg.role === 'user'
                                        ? 'bg-[#663820] text-white'
                                        : 'bg-[#f3e4c7] text-[#212a3b] border border-[#e7ded0]'
                                }`}
                            >
                                {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                            </div>

                            {/* Message Bubble */}
                            <div
                                className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-[#663820] text-white rounded-tr-xs shadow-xs'
                                        : 'bg-[#f8f4e9] text-[#212a3b] border border-[#e7ded0] rounded-tl-xs shadow-xs'
                                }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex gap-3 items-center text-stone-400 text-xs font-medium pl-1">
                        <div className="w-8 h-8 rounded-full bg-[#f3e4c7] border border-[#e7ded0] flex items-center justify-center text-[#212a3b]">
                            <Bot size={15} />
                        </div>
                        <div className="bg-[#f8f4e9] border border-[#e7ded0] px-4 py-3 rounded-2xl flex items-center gap-2 text-stone-600 text-xs font-semibold">
                            <Loader2 size={14} className="animate-spin text-[#663820]" />
                            <span>Groq AI is typing...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form Bar */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 bg-[#faf8f5] border-t border-[#e7ded0] flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask a question about "${book.title}"...`}
                    disabled={loading}
                    className="flex-1 bg-white border border-[#e7ded0] rounded-xl px-4 py-3 text-sm text-[#212a3b] placeholder-stone-400 focus:outline-none focus:border-[#663820] transition-colors"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-3 bg-[#663820] hover:bg-[#7a4528] disabled:bg-stone-300 text-white rounded-xl transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
