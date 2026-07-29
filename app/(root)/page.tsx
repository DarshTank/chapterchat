import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LandingPage from "@/components/LandingPage";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/actions/book.actions";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import Search from "@/components/Search";
import { Plus, BookOpen, Sparkles } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function Page(props: { searchParams?: Promise<{ query?: string }> | { query?: string } }) {
    let query: string | undefined = undefined;
    let user: any = null;
    let books: any[] = [];
    let isAdmin = false;

    try {
        const resolvedParams = props.searchParams ? await props.searchParams : {};
        query = resolvedParams?.query;
        user = await getCurrentUser();

        if (user) {
            isAdmin = user.role === 'admin' || user.email.toLowerCase() === 'darshtank05@gmail.com';

            if (!isAdmin) {
                const bookResults = await getAllBooks(query);
                if (bookResults?.success && bookResults?.data) {
                    books = bookResults.data;
                }
            }
        }
    } catch (err) {
        console.error("Error loading home page server data:", err);
    }

    if (user && isAdmin) {
        const { purgeAdminUploadedBooks } = await import("@/lib/actions/admin.actions");
        await purgeAdminUploadedBooks();
        redirect("/admin");
    }

    // IF USER IS LOGGED IN: SHOW PERSONAL BOOKS LIBRARY PAGE DIRECTLY
    if (user) {
        return (
            <div className="wrapper pt-2 pb-16 space-y-8">
                {/* Library Hero Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-r from-[#f8f4e9] via-[#f3e4c7] to-[#f8f4e9] p-6 sm:p-8 rounded-3xl border border-[#e7ded0] shadow-xs">
                    <div>
                        <div className="flex items-center gap-2 text-[#663820] text-xs font-bold uppercase tracking-wider mb-1">
                            <span>Welcome back, {user.name.split(" ")[0]}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#212a3b]">Your Personal Library</h1>
                        <p className="text-xs sm:text-sm text-stone-600 mt-1">
                            Manage your uploaded PDF books and start live AI voice conversations.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Search />
                        <Link
                            href="/books/new"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#663820] hover:bg-[#7a4528] text-white font-bold text-sm rounded-xl transition-all shadow-md shrink-0"
                        >
                            <Plus size={16} /> Upload Book
                        </Link>
                    </div>
                </div>

                {/* Books Grid / Empty State */}
                {books.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-stone-500 font-semibold px-1">
                            <span>Showing {books.length} {books.length === 1 ? "book" : "books"} in your library</span>
                            {query && <span>Search filter: &quot;{query}&quot;</span>}
                        </div>
                        <div className="library-books-grid">
                            {books.map((book: any) => (
                                <BookCard
                                    key={book._id}
                                    id={book._id}
                                    title={book.title}
                                    author={book.author}
                                    coverURL={book.coverURL}
                                    slug={book.slug}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full bg-white border border-[#e7ded0] rounded-3xl p-12 sm:p-16 text-center shadow-xs space-y-5 my-4">
                        <div className="w-14 h-14 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-center mx-auto text-[#663820]">
                            <BookOpen size={28} />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-2xl font-bold font-serif text-[#212a3b]">No books in your library yet</h3>
                            <p className="text-sm text-stone-600">
                                {query
                                    ? `No books found matching "${query}". Try clearing your search query.`
                                    : "Upload your first book PDF to start voice chatting, asking questions, and generating chapter breakdowns!"}
                            </p>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/books/new"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#663820] hover:bg-[#7a4528] text-white font-bold text-sm rounded-xl transition-all shadow-md"
                            >
                                <Plus size={18} /> Upload Your First Book PDF
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // IF USER IS LOGGED OUT: SHOW DEDICATED PROMOTIONAL LANDING PAGE
    return (
        <div className="wrapper pt-2 pb-12 space-y-12">
            <LandingPage user={null} />
        </div>
    );
}
