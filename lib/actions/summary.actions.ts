'use server';

import { connectToDatabase } from "@/database/mongoose";
import BookSummary from "@/database/models/book-summary.model";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import { serializeData } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export const getBookVisitAndSummaries = async (bookId: string) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: "Unauthorized", summaries: [], visitTime: new Date().toISOString() };
        }

        await connectToDatabase();

        const summaries = await BookSummary.find({
            bookId,
            userId: user._id.toString(),
        }).sort({ createdAt: -1 }).lean();

        return {
            success: true,
            visitTime: new Date().toISOString(),
            summaries: serializeData(summaries),
        };
    } catch (error) {
        console.error("Error fetching book summaries:", error);
        return {
            success: false,
            error: (error as Error).message,
            summaries: [],
            visitTime: new Date().toISOString(),
        };
    }
};

export const generateAndSaveSummaryAction = async (
    bookId: string,
    messages: { role: string; content: string }[]
) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: "Unauthorized. Please sign in." };
        }

        if (!messages || messages.length === 0) {
            return { success: false, error: "No conversation messages to summarize." };
        }

        await connectToDatabase();

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return { success: false, error: "Groq API key is missing." };
        }

        const { Groq } = await import("groq-sdk");
        const groq = new Groq({ apiKey: groqApiKey });

        const conversationText = messages
            .map((m) => `${m.role === 'user' ? 'User' : 'AI Voice Companion'}: ${m.content}`)
            .join("\n");

        const prompt = `You are an expert literary AI assistant. Summarize the following conversation between a user and an AI book companion.
Provide a concise, high-level summary paragraph and exactly 3 bullet point key takeaways.

Format your response strictly as JSON with the following structure:
{
  "summaryText": "Concise 2-3 sentence overview of the main topics discussed.",
  "keyTakeaways": [
    "Key takeaway 1",
    "Key takeaway 2",
    "Key takeaway 3"
  ]
}

Conversation Transcript:
${conversationText}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 600,
        });

        const rawContent = chatCompletion.choices[0]?.message?.content || "";
        let parsed: { summaryText: string; keyTakeaways: string[] } = {
            summaryText: "Conversation summary generated.",
            keyTakeaways: [],
        };

        try {
            parsed = JSON.parse(rawContent);
        } catch {
            parsed.summaryText = rawContent;
        }

        const newSummary = await BookSummary.create({
            userId: user._id.toString(),
            bookId,
            summaryText: parsed.summaryText || "Discussion completed.",
            keyTakeaways: parsed.keyTakeaways || [],
            transcriptCount: messages.length,
            visitedAt: new Date(),
        });

        revalidatePath(`/books/${bookId}`);

        return {
            success: true,
            data: serializeData(newSummary),
        };
    } catch (error) {
        console.error("Error generating Groq AI summary:", error);
        return {
            success: false,
            error: (error as Error).message || "Failed to generate summary.",
        };
    }
};

export const deleteBookSummaryAction = async (summaryId: string) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: "Unauthorized." };
        }

        await connectToDatabase();

        await BookSummary.findOneAndDelete({
            _id: summaryId,
            userId: user._id.toString(),
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting book summary:", error);
        return { success: false, error: (error as Error).message };
    }
};
