"use client";

import React from "react";
import Link from "next/link";
import TransparentLogo from "@/components/TransparentLogo";

export default function Footer() {
    return (
        <footer className="w-full bg-[#ece2cf] text-stone-700 border-t border-[#d8caaf]">
            {/* Main row */}
            <div className="max-w-7xl px-5 mx-auto w-full py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Left: Logo + brand */}
                <div className="flex items-center gap-3">
                    <TransparentLogo size="sm" />
                    <span className="text-xs text-stone-600 font-medium hidden sm:inline">
                        AI-Powered Book Voice Conversations
                    </span>
                </div>



                {/* Right: Copyright */}
                <p className="text-xs text-stone-500 font-medium">
                    © {new Date().getFullYear()} ChapterChat
                </p>
            </div>
        </footer>
    );
}
