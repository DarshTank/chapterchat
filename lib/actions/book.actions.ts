'use server';

import {CreateBook, TextSegment} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import {escapeRegex, generateSlug, serializeData} from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";

import { getCurrentUser } from "@/lib/actions/auth.actions";

export const getAllBooks = async (search?: string) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: true, data: [] };
        }

        await connectToDatabase();

        const userIdStr = user._id ? user._id.toString() : null;
        if (!userIdStr) {
            return { success: true, data: [] };
        }

        const userIds: any[] = [userIdStr];
        if (mongoose.Types.ObjectId.isValid(userIdStr)) {
            userIds.push(new mongoose.Types.ObjectId(userIdStr));
        }

        let userQuery: any = { userId: { $in: userIds } };

        if (search && search.trim()) {
            const escapedSearch = escapeRegex(search.trim());
            const regex = new RegExp(escapedSearch, 'i');
            userQuery = {
                userId: { $in: userIds },
                $or: [
                    { title: { $regex: regex } },
                    { author: { $regex: regex } },
                ]
            };
        }

        const books = await Book.find(userQuery).sort({ createdAt: -1 }).lean();

        return {
            success: true,
            data: serializeData(books)
        }
    } catch (e) {
        console.error('Error connecting to database', e);
        return {
            success: false, error: e
        }
    }
}

export const checkBookExists = async (title: string) => {
    try {
        const user = await getCurrentUser();
        if (!user) return { exists: false };

        await connectToDatabase();
        const slug = generateSlug(title);

        const userIdStr = user._id ? user._id.toString() : null;
        if (!userIdStr) return { exists: false };

        const userIds: any[] = [userIdStr];
        if (mongoose.Types.ObjectId.isValid(userIdStr)) {
            userIds.push(new mongoose.Types.ObjectId(userIdStr));
        }

        const existingBook = await Book.findOne({
            slug,
            userId: { $in: userIds }
        }).lean();

        if (existingBook) {
            return {
                exists: true,
                book: serializeData(existingBook)
            }
        }

        return { exists: false };
    } catch (e) {
        console.error('Error checking book exists', e);
        return { exists: false, error: e };
    }
}

export const createBook = async (data: CreateBook) => {
    try {
        await connectToDatabase();

        const { getCurrentUser } = await import("@/lib/actions/auth.actions");
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser._id !== data.userId) {
            return { success: false, error: "Unauthorized" };
        }

        let slug = generateSlug(data.title);

        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            if (existingBook.userId.toString() === currentUser._id.toString()) {
                return {
                    success: true,
                    data: serializeData(existingBook),
                    alreadyExists: true,
                };
            } else {
                // Generate a unique slug for this user if another user used the title
                slug = `${slug}-${Date.now().toString(36)}`;
            }
        }

        const book = await Book.create({ ...data, userId: currentUser._id, slug, totalSegments: 0 });

        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error('Error creating a book', e);

        return {
            success: false,
            error: e,
        }
    }
}

export const getBookBySlug = async (slug: string) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectToDatabase();

        const book = await Book.findOne({ slug }).lean();

        if (!book) {
            return { success: false, error: 'Book not found' };
        }

        // Strict Ownership Security Check
        const userIdStr = user._id ? user._id.toString() : '';
        if (book.userId.toString() !== userIdStr && book.userId.toString() !== user._id.toString()) {
            console.warn(`Unauthorized slug access attempt by user ${user._id} to book ${book._id} owned by ${book.userId}`);
            return { success: false, error: 'Unauthorized access to book' };
        }

        return {
            success: true,
            data: serializeData(book)
        }
    } catch (e) {
        console.error('Error fetching book by slug', e);
        return {
            success: false, error: e
        }
    }
}

export const saveBookSegments = async (bookId: string, userId: string, segments: TextSegment[]) => {
    try {
        await connectToDatabase();

        console.log('Saving book segments...');

        const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount }) => ({
            userId, bookId, content: text, segmentIndex, pageNumber, wordCount
        }));

        await BookSegment.insertMany(segmentsToInsert);

        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        console.log('Book segments saved successfully.');

        return {
            success: true,
            data: { segmentsCreated: segments.length}
        }
    } catch (e) {
        console.error('Error saving book segments', e);

        return {
            success: false,
            error: e,
        }
    }
}

// Searches book segments using MongoDB text search with regex fallback
export const searchBookSegments = async (bookId: string, query: string, limit: number = 5) => {
    try {
        await connectToDatabase();

        console.log(`Searching for: "${query}" in book ${bookId}`);

        const bookObjectId = new mongoose.Types.ObjectId(bookId);

        // Try MongoDB text search first (requires text index)
        let segments: Record<string, unknown>[] = [];
        try {
            segments = await BookSegment.find({
                bookId: bookObjectId,
                $text: { $search: query },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();
        } catch {
            // Text index may not exist — fall through to regex fallback
            segments = [];
        }

        // Fallback: regex search matching ANY keyword
        if (segments.length === 0) {
            const keywords = query.split(/\s+/).filter((k) => k.length > 2);
            const pattern = keywords.map(escapeRegex).join('|');

            segments = await BookSegment.find({
                bookId: bookObjectId,
                content: { $regex: pattern, $options: 'i' },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ segmentIndex: 1 })
                .limit(limit)
                .lean();
        }

        console.log(`Search complete. Found ${segments.length} results`);

        return {
            success: true,
            data: serializeData(segments),
        };
    } catch (error) {
        console.error('Error searching segments:', error);
        return {
            success: false,
            error: (error as Error).message,
            data: [],
        };
    }
};

export const deleteBook = async (bookId: string) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectToDatabase();

        const book = await Book.findById(bookId);
        if (!book) {
            return { success: false, error: 'Book not found' };
        }

        const userIdStr = user._id ? user._id.toString() : '';
        if (book.userId.toString() !== userIdStr) {
            return { success: false, error: 'Unauthorized to delete this book' };
        }

        try {
            const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.chapterchat_READ_WRITE_TOKEN;
            if (token) {
                const { del } = await import('@vercel/blob');
                if (book.fileURL) await del(book.fileURL, { token }).catch(() => {});
                if (book.coverURL) await del(book.coverURL, { token }).catch(() => {});
            }
        } catch (blobErr) {
            console.warn('Could not delete blobs for book:', blobErr);
        }

        await BookSegment.deleteMany({ bookId: book._id });

        try {
            const BookSummary = (await import('@/database/models/book-summary.model')).default;
            if (BookSummary) {
                await BookSummary.deleteMany({ bookId: book._id });
            }
        } catch (sumErr) {
            console.warn('Summary deletion skipped:', sumErr);
        }

        await Book.findByIdAndDelete(bookId);

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/');

        return { success: true };
    } catch (e: any) {
        console.error('Error deleting book:', e);
        return { success: false, error: e.message || 'Failed to delete book' };
    }
};

export const updateBookPersona = async (bookId: string, persona: string) => {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        await connectToDatabase();

        const book = await Book.findById(bookId);
        if (!book) return { success: false, error: 'Book not found' };

        const userIdStr = user._id ? user._id.toString() : '';
        if (book.userId.toString() !== userIdStr) {
            return { success: false, error: 'Unauthorized to update this book' };
        }

        book.persona = persona;
        await book.save();

        const { revalidatePath } = await import('next/cache');
        revalidatePath(`/books/${book.slug}`);
        revalidatePath('/');

        return { success: true, data: serializeData(book) };
    } catch (e: any) {
        console.error('Error updating book persona:', e);
        return { success: false, error: e.message || 'Failed to update persona' };
    }
};

