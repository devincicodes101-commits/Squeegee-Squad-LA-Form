import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
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

// Editorial serif — used only for the brand wordmark + section headers.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Squeegee Squad LA — Estimator",
  description:
    "Internal estimating tool for Squeegee Squad LA. Generates a preliminary estimate range — never a final quote.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#677a5c",
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
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="bg-canvas text-ink min-h-full">
        <Header />
        <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
        <footer className="mx-auto mt-12 w-full max-w-4xl px-4 pb-10 pb-safe text-center sm:px-6">
          <div className="mx-auto mb-4 h-px w-24 bg-line" aria-hidden />
          <p className="tracked text-[10px] text-muted">
            Squeegee Squad LA · Window · Pressure · Specialty
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Estimates are preliminary. Final pricing confirmed after site review.
          </p>
        </footer>
      </body>
    </html>
  );
}
