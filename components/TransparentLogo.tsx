"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TransparentLogoProps {
    className?: string;
    showText?: boolean;
    size?: "sm" | "md" | "lg";
}

export default function TransparentLogo({ className, showText = true, size = "md" }: TransparentLogoProps) {
    const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);

    const sizeDimensions = {
        sm: { icon: "w-9 h-9", text: "text-xl" },
        md: { icon: "w-11 h-11", text: "text-2xl" },
        lg: { icon: "w-14 h-14", text: "text-3xl" },
    };

    const currentSize = sizeDimensions[size];

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "/chapterchat logo.png";

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");

            if (!ctx) return;

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Check for checkerboard background pixels (light gray / white)
                const isBackground =
                    r > 140 && g > 140 && b > 140 && Math.abs(r - b) < 45 && Math.abs(r - g) < 45;

                if (isBackground) {
                    data[i + 3] = 0; // Make background transparent
                } else {
                    // Recolor blue emblem pixels to match the app warm literary terracotta/brown theme
                    // Theme base: #663820 (R:102, G:56, B:32) to #b86428 (R:184, G:100, B:40)
                    const intensity = (b + g) / 450;
                    data[i] = Math.min(255, Math.round(90 + intensity * 95));     // Warm Terracotta Red
                    data[i + 1] = Math.min(255, Math.round(45 + intensity * 55)); // Warm Terracotta Green
                    data[i + 2] = Math.min(255, Math.round(25 + intensity * 20)); // Warm Terracotta Blue
                }
            }

            ctx.putImageData(imageData, 0, 0);
            setProcessedDataUrl(canvas.toDataURL("image/png"));
        };
    }, []);

    return (
        <Link
            href="/"
            className={cn("flex items-center gap-3 select-none", className)}
        >
            {/* Logo Emblem Icon */}
            <div className={cn("relative flex items-center justify-center shrink-0", currentSize.icon)}>
                {processedDataUrl ? (
                    <img
                        src={processedDataUrl}
                        alt="ChapterChat Logo"
                        className="w-full h-full object-contain drop-shadow-xs"
                    />
                ) : (
                    /* Instant vector fallback while canvas processes image */
                    <svg
                        viewBox="0 0 120 90"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full"
                    >
                        <defs>
                            <linearGradient id="themeWarmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#663820" />
                                <stop offset="50%" stopColor="#8c4826" />
                                <stop offset="100%" stopColor="#b86428" />
                            </linearGradient>
                        </defs>
                        <path d="M 10 70 C 18 64, 32 64, 40 72 L 40 28 C 32 20, 18 20, 10 28 Z" fill="url(#themeWarmGrad)" />
                        <path d="M 20 25 C 32 18, 44 20, 48 26 L 48 76 C 42 70, 30 68, 20 72 Z" fill="url(#themeWarmGrad)" opacity="0.85" />
                        <path d="M 48 76 C 54 86, 66 82, 60 70 C 54 58, 46 48, 52 32 C 58 14, 80 12, 96 24 C 112 36, 110 58, 92 66 C 82 70, 74 68, 66 76 C 64 78, 62 82, 64 85 C 70 81, 76 76, 84 74 C 104 72, 116 46, 98 24 C 80 2, 52 8, 48 28 C 44 38, 50 48, 48 76 Z" fill="url(#themeWarmGrad)" />
                        <circle cx="72" cy="36" r="3.5" fill="#663820" />
                        <circle cx="82" cy="36" r="3.5" fill="#663820" />
                        <circle cx="92" cy="36" r="3.5" fill="#663820" />
                    </svg>
                )}
            </div>

            {/* App Name Wordmark Beside Logo */}
            {showText && (
                <div className="flex items-baseline font-serif font-extrabold tracking-tight leading-none">
                    <span className={cn("text-[#212a3b]", currentSize.text)}>
                        Chapter
                    </span>
                    <span className={cn("text-[#663820]", currentSize.text)}>
                        Chat
                    </span>
                </div>
            )}
        </Link>
    );
}
