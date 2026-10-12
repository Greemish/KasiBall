import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KasiBall",
  description:
    "KasiBall — community youth soccer league management. Where Every Dream Starts on the Field.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-kasi-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-kasi-gold focus:px-4 focus:py-2"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}