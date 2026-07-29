import { model, Schema, models } from "mongoose";

export interface IBookSummary {
    _id?: string;
    userId: string;
    bookId: Schema.Types.ObjectId | string;
    summaryText: string;
    keyTakeaways?: string[];
    transcriptCount?: number;
    visitedAt: Date;
    createdAt?: Date;
}

const BookSummarySchema = new Schema({
    userId: { type: String, required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    summaryText: { type: String, required: true },
    keyTakeaways: [{ type: String }],
    transcriptCount: { type: Number, default: 0 },
    visitedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const BookSummary = models.BookSummary || model('BookSummary', BookSummarySchema);

export default BookSummary;
