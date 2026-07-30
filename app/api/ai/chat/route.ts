import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { connectToDatabase } from '@/database/mongoose';
import BookSegment from '@/database/models/book-segment.model';
import { searchBookSegments } from '@/lib/actions/book.actions';

export async function POST(req: Request) {
    try {
        const { message, history, bookTitle, bookAuthor, bookId } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const apiKey = process.env.GROQ_CHAT_API_KEY || process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                response: `I'm ready to discuss "${bookTitle || 'this book'}". Please configure your GROQ_CHAT_API_KEY in your .env file for Groq AI text responses!`
            });
        }

        let contextText = '';

        // Retrieve book content segments from MongoDB if bookId is passed (with a 3s timeout safeguard)
        if (bookId) {
            try {
                const fetchSegments = async () => {
                    await connectToDatabase();
                    const searchRes = await searchBookSegments(bookId, message, 4);
                    let segments = searchRes.data || [];
                    if (segments.length === 0) {
                        const initialSegments = await BookSegment.find({ bookId })
                            .sort({ segmentIndex: 1 })
                            .limit(4)
                            .lean();
                        segments = initialSegments as any[];
                    }
                    return segments;
                };

                const timeoutPromise = new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 3000));
                const segments = await Promise.race([fetchSegments(), timeoutPromise]);

                if (segments && segments.length > 0) {
                    contextText = segments
                        .map((seg: any) => seg.content)
                        .filter(Boolean)
                        .join('\n\n')
                        .slice(0, 3000);
                }
            } catch (dbErr) {
                console.error('Error fetching book segments from database:', dbErr);
            }
        }

        const groq = new Groq({ apiKey });

        const systemPrompt = `You are an AI reading companion for the book "${bookTitle || 'Book'}" by ${bookAuthor || 'Unknown Author'}.
Your goal is to have a natural, engaging conversation with the reader about the book.

${contextText ? `HERE IS EXCERPT CONTEXT FROM THE BOOK IN MONGODB:\n"""\n${contextText}\n"""\nUse the book context above to discuss the contents and answer questions accurately.` : `Provide helpful, engaging conversation about the book.`}

IMPORTANT RULES:
- Keep your response concise (2-4 sentences max), conversational, friendly, and easy to read out loud.
- Do NOT repeat the book title or author name in every response. The reader already knows what book they are discussing. Only mention the title if the reader explicitly asks about it or if it's the very first message.
- Continue the conversation naturally based on what was previously discussed. Do not re-introduce yourself or the book.
- Respond directly to what the reader said. Be specific and engaging.`;

        // Build the messages array with conversation history
        const chatMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
        ];

        // Include recent conversation history if provided (up to 10 messages)
        if (Array.isArray(history) && history.length > 0) {
            const recentHistory = history.slice(-10);
            for (const msg of recentHistory) {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    chatMessages.push({
                        role: msg.role as 'user' | 'assistant',
                        content: msg.content,
                    });
                }
            }
        } else {
            // No history provided, just send the current message
            chatMessages.push({ role: 'user', content: message });
        }

        const completion = await groq.chat.completions.create({
            messages: chatMessages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_completion_tokens: 150,
        });

        const replyText = completion.choices[0]?.message?.content || "That's an interesting point! Tell me more.";

        return NextResponse.json({ response: replyText });
    } catch (error) {
        console.error('Error in Groq AI chat route:', error);
        return NextResponse.json(
            { response: "I had a bit of trouble processing that. Could you ask another question about the book?" },
            { status: 200 }
        );
    }
}
