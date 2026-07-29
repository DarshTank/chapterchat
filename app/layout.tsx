import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";
import {Toaster} from "@/components/ui/sonner";

const newsreader = Newsreader({
    variable: "--font-newsreader",
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    style: ['normal', 'italic'],
    display: 'swap'
});

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: '--font-plus-jakarta-sans',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
    variable: '--font-jetbrains-mono',
    subsets: ['latin'],
    display: 'swap'
});

export const metadata: Metadata = {
  title: "ChapterChat",
  description: "Transform your books into interactive AI conversations. Upload PDFs, and chat with your books using voice.",
  icons: {
    icon: [
      { url: "/icon copy.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon copy.svg",
    apple: "/icon copy.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
        <html lang="en">
          <body
            className={`${newsreader.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col bg-(--bg-primary)`}
          >
            <Navbar />
            <main className="flex-1 pt-20 sm:pt-22">
              {children}
            </main>
            <Footer />
            <Toaster />
          </body>
        </html>
    </AuthProvider>
  );
}
