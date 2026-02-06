import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { AxeDevTools } from "@/components/AxeDevTools";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "UNSAID/UNHEARD - Accessibility-First Super-App",
  description: "An accessibility-first super-app empowering disabled and neurodivergent users through multimodal communication, community connection, and accessible content consumption.",
  keywords: ["accessibility", "disability", "neurodivergent", "communication", "AAC", "sign language", "assistive technology"],
  authors: [{ name: "UNSAID/UNHEARD Team" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AccessibilityProvider>
          {/* Skip to main content link for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
          >
            Skip to main content
          </a>
          
          <main id="main-content" role="main">
            {children}
          </main>
          
          {/* Axe DevTools for development */}
          <AxeDevTools />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
