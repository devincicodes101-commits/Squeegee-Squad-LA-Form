import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Squeegee Squad LA — Estimator",
  description:
    "Internal estimating tool for Squeegee Squad LA. Generates a preliminary estimate range — never a final quote.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b6bcb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-canvas text-ink min-h-full">
        <Header />
        <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
