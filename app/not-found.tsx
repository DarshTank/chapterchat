import Link from "next/link";
import { PlusCircle, SearchX, Home } from "lucide-react";
import TransparentLogo from "@/components/TransparentLogo";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#faf8f5] text-[#212a3b] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Background Ambient Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#663820]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-xl w-full text-center space-y-8 relative z-10">
                {/* Brand Logo Header */}
                <div className="flex justify-center mb-2">
                    <TransparentLogo size="lg" />
                </div>

                {/* 404 Card Container */}
                <div className="bg-white/90 backdrop-blur-md border border-[#e7ded0] rounded-3xl p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 via-[#663820] to-stone-700" />

                    {/* Stylized Icon */}
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-[#f8f4e9] border border-[#e7ded0] text-[#663820] flex items-center justify-center shadow-inner group">
                        <SearchX className="size-10 stroke-[1.75] text-[#663820] group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Big 404 & Heading */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#663820] bg-[#663820]/10 px-3.5 py-1.5 rounded-full border border-[#663820]/20 inline-block">
                            Error 404 — Page Not Found
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#212a3b] pt-2">
                            Lost in the Stacks?
                        </h1>
                        <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto font-medium">
                            The book manuscript or page you are looking for does not exist, has been removed, or is restricted to its owner.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#e7ded0]/60 my-4" />

                    {/* Navigation Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            href="/"
                            className="w-full sm:w-auto px-6 py-3 bg-[#663820] hover:bg-[#7a4528] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Home size={16} />
                            <span>Return to Library</span>
                        </Link>

                        <Link
                            href="/books/new"
                            className="w-full sm:w-auto px-6 py-3 bg-[#f8f4e9] hover:bg-[#f3e4c7] border border-[#e7ded0] text-[#663820] font-bold text-sm rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <PlusCircle size={16} />
                            <span>Upload New Book</span>
                        </Link>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <p className="text-xs text-stone-500 font-medium">
                    Need help? Make sure you are signed into the account that uploaded the book.
                </p>
            </div>
        </div>
    );
}
