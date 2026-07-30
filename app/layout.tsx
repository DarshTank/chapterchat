import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import { getSystemSettings } from "@/lib/actions/admin.actions";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import InspectProtectionManager from "@/components/InspectProtectionManager";

export const dynamic = 'force-dynamic';

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
    weight: ['400', '500'],
    display: 'swap'
});

export const metadata: Metadata = {
    title: "ChapterChat — AI-Powered Book Voice Companion",
    description: "Transform reading into interactive voice conversations. Upload your book PDF, converse in real time with AI book companions, and track key insights.",
    keywords: ["book companion", "voice chat AI", "PDF audio companion", "Groq AI", "literary chat"],
    icons: {
        icon: [{ url: "/icon copy.svg", type: "image/svg+xml" }],
        shortcut: "/icon copy.svg",
        apple: "/icon copy.svg",
    },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getCurrentUser();
  const settingsRes = await getSystemSettings();
  const initialDisableInspect = settingsRes.data?.disableInspect ?? true;

  return (
    <html lang="en">
      <body
        className={`${newsreader.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col bg-(--bg-primary)`}
      >
        <AuthProvider initialUser={initialUser as any}>
          <Navbar />
          <main className="flex-1 pt-20 sm:pt-22">
            {children}
          </main>
          <Footer />
          <Toaster />
          <InspectProtectionManager initialDisableInspect={initialDisableInspect} />
        </AuthProvider>
      </body>
    </html>
  );
}
