import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "./components/Header";

// Modern, professional sans — used app-wide.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Squeegee Squad LA — Estimator",
  description:
    "Internal estimating tool for Squeegee Squad LA. Generates a preliminary estimate range — never a final quote.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0e4f73",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-canvas text-ink min-h-full">
        <Header />
        <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-10">
          {children}
        </main>
        <footer className="mx-auto mt-10 w-full max-w-7xl px-4 pb-10 pb-safe text-center sm:mt-12 sm:px-6">
          <div className="mx-auto mb-4 h-px w-24 bg-line" aria-hidden />
          <p className="tracked text-[10px] font-semibold text-muted">
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
