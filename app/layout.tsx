import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { getCurrentUser } from "@/lib/actions/auth.actions";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import InspectBlocker from "@/components/InspectBlocker";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getCurrentUser();

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function blockEvent(e) {
                  if (e.type === 'contextmenu') {
                    e.preventDefault();
                    return false;
                  }
                  if (e.type === 'keydown') {
                    var k = (e.key || '').toUpperCase();
                    if (k === 'F12' || e.keyCode === 123 ||
                       ((e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey) && ['I','J','C','K','S'].includes(k)) ||
                       ((e.ctrlKey || e.metaKey) && k === 'U')) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                  }
                }
                window.addEventListener('contextmenu', blockEvent, true);
                document.addEventListener('contextmenu', blockEvent, true);
                window.addEventListener('keydown', blockEvent, true);
                document.addEventListener('keydown', blockEvent, true);
              })();
            `,
          }}
        />
      </head>
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
          <InspectBlocker />
        </AuthProvider>
      </body>
    </html>
  );
}
