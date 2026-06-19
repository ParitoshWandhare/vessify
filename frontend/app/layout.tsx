import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Vessify — Personal Finance Intelligence",
    template: "%s | Vessify",
  },
  description:
    "Extract, categorize, and track your transactions with AI-powered precision. Built for modern finance.",
  keywords: ["finance", "transactions", "budgeting", "personal finance"],
  openGraph: {
    title: "Vessify",
    description: "AI-powered personal finance transaction extractor",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#0A0A0A" />
      </head>
      <body
        className={`${inter.variable} font-sans bg-[#0A0A0A] text-white antialiased min-h-screen`}
      >
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(17, 17, 17, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "white",
              backdropFilter: "blur(20px)",
            },
          }}
        />
      </body>
    </html>
  );
}
