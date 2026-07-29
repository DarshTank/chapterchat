'use client';

import React, { useEffect, useState } from "react";
import { Sparkles, Clock, Calendar, BrainCircuit, Loader2, CheckCircle2, ChevronRight, MessageSquareText, Layers, Trash2 } from "lucide-react";
import { getBookVisitAndSummaries, generateAndSaveSummaryAction, deleteBookSummaryAction } from "@/lib/actions/summary.actions";
import { toast } from "sonner";

interface BookSummarySectionProps {
    bookId: string;
    messages?: { role: string; content: string }[];
    summaryTrigger?: number;
}

export default function BookSummarySection({ bookId, messages = [], summaryTrigger = 0 }: BookSummarySectionProps) {
    const [summaries, setSummaries] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [visitTime, setVisitTime] = useState<string>("");
    const [loadingSummaries, setLoadingSummaries] = useState<boolean>(true);
    const [generating, setGenerating] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchVisitAndSummaries = async () => {
        const res = await getBookVisitAndSummaries(bookId);
        if (res.success) {
            setSummaries(res.summaries || []);
            if (!visitTime) {
                setVisitTime(res.visitTime || new Date().toISOString());
            }
        }
        setLoadingSummaries(false);
    };

    useEffect(() => {
        setLoadingSummaries(true);
        fetchVisitAndSummaries();
    }, [bookId]);

    useEffect(() => {
        if (summaryTrigger > 0) {
            fetchVisitAndSummaries();
            setSelectedIndex(0);
        }
    }, [summaryTrigger]);

    const handleGenerateSummary = async () => {
        if (!messages || messages.length === 0) {
            toast.error("No active conversation to summarize yet. Start a voice session first!");
            return;
        }

        setGenerating(true);
        toast.info("Generating AI summary with Groq Llama 3.3...");

        const res = await generateAndSaveSummaryAction(bookId, messages);

        if (res.success && res.data) {
            toast.success("Conversation summary generated and saved!");
            setSummaries((prev) => [res.data, ...prev]);
            setSelectedIndex(0);
        } else {
            toast.error(res.error || "Failed to generate summary.");
        }
        setGenerating(false);
    };

    const handleDeleteSummary = async (summaryId: string) => {
        if (!summaryId) return;
        setDeletingId(summaryId);

        const res = await deleteBookSummaryAction(summaryId);

        if (res.success) {
            toast.success("Conversation summary deleted.");
            setSummaries((prev) => prev.filter((item) => item._id !== summaryId));
            setSelectedIndex(0);
        } else {
            toast.error(res.error || "Failed to delete summary.");
        }
        setDeletingId(null);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateString;
        }
    };

    const selectedSummary = summaries.length > 0 ? (summaries[selectedIndex] || summaries[0]) : null;

    return (
        <div className="space-y-6 pt-4">
            {/* STACKED CONVERSATION SESSIONS & SELECTED SUMMARY VIEWER */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <Layers size={18} className="text-[#663820]" />
                        <span>Saved Discussion Stack ({summaries.length})</span>
                    </h3>
                </div>

                {loadingSummaries ? (
                    <div className="bg-white border border-[#e7ded0] rounded-3xl p-8 text-center space-y-3">
                        <Loader2 size={24} className="animate-spin text-[#663820] mx-auto" />
                        <p className="text-xs text-stone-500 font-medium">Loading saved conversation stack...</p>
                    </div>
                ) : summaries.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT STACK LIST: SESSION SELECTOR BUTTONS */}
                        <div className="lg:col-span-4 bg-white border border-[#e7ded0] rounded-3xl p-4 shadow-xs space-y-2">
                            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 py-2 border-b border-stone-100">
                                Select Session to View
                            </div>
                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {summaries.map((item: any, idx: number) => {
                                    const isSelected = selectedIndex === idx;
                                    return (
                                        <button
                                            key={item._id || idx}
                                            onClick={() => setSelectedIndex(idx)}
                                            className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-center justify-between gap-3 ${
                                                isSelected
                                                    ? 'bg-[#663820] text-white border-[#663820] shadow-md'
                                                    : 'bg-[#faf8f5] hover:bg-[#f3e4c7]/50 text-stone-700 border-[#e7ded0]'
                                            }`}
                                        >
                                            <div className="space-y-1 overflow-hidden">
                                                <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                                                    <Clock size={13} className={isSelected ? "text-amber-200" : "text-[#663820]"} />
                                                    <span>{formatDate(item.createdAt || item.visitedAt)}</span>
                                                </div>
                                                <p className={`text-[11px] truncate ${isSelected ? 'text-amber-100/90' : 'text-stone-500'}`}>
                                                    {item.transcriptCount || 0} messages • Groq AI
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className={`shrink-0 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT VIEW PANEL: SELECTED CONVERSATION DETAILS */}
                        <div className="lg:col-span-8 bg-white border border-[#e7ded0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                            {selectedSummary && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                                            <Clock size={15} className="text-[#663820]" />
                                            <span>Session Date: {formatDate(selectedSummary.createdAt || selectedSummary.visitedAt)}</span>
                                            {selectedSummary.transcriptCount > 0 && (
                                                <span className="text-stone-400">
                                                    • {selectedSummary.transcriptCount} messages
                                                </span>
                                            )}
                                        </div>

                                        {/* DELETE SUMMARY BUTTON */}
                                        <button
                                            onClick={() => handleDeleteSummary(selectedSummary._id)}
                                            disabled={deletingId === selectedSummary._id}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                                        >
                                            {deletingId === selectedSummary._id ? (
                                                <Loader2 size={13} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={13} />
                                            )}
                                            <span>Delete Summary</span>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-[#663820] uppercase tracking-wider">
                                                Selected Conversation Summary
                                            </h4>
                                            <p className="text-sm text-stone-700 font-serif leading-relaxed italic bg-[#faf8f5] p-5 rounded-2xl border border-[#e7ded0]">
                                                &ldquo;{selectedSummary.summaryText}&rdquo;
                                            </p>
                                        </div>

                                        {selectedSummary.keyTakeaways && selectedSummary.keyTakeaways.length > 0 && (
                                            <div className="space-y-3 pt-2">
                                                <h4 className="text-xs font-bold text-[#663820] uppercase tracking-wider">
                                                    Key Discussion Takeaways
                                                </h4>
                                                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {selectedSummary.keyTakeaways.map((takeaway: string, idx: number) => (
                                                        <li
                                                            key={idx}
                                                            className="text-xs text-stone-700 bg-[#f8f4e9] p-3.5 rounded-2xl border border-[#e7ded0] flex items-start gap-2 leading-relaxed"
                                                        >
                                                            <ChevronRight size={14} className="text-[#663820] shrink-0 mt-0.5" />
                                                            <span>{takeaway}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-[#e7ded0] rounded-3xl p-10 text-center space-y-3 shadow-xs">
                        <div className="w-12 h-12 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-center mx-auto text-stone-500">
                            <MessageSquareText size={22} />
                        </div>
                        <h4 className="font-serif font-bold text-base text-[#212a3b]">No conversation summaries yet</h4>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                            Conversations are automatically summarized with Groq AI when voice sessions end and stored here!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
