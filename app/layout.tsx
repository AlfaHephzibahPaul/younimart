import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SupabaseProvider } from "@/components/supabase-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "YOUnimart",
  description: "Campus marketplace for Federal University Dutse students",
};

export const viewport: Viewport = {
  themeColor: "#1a5c38",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <SupabaseProvider>{children}</SupabaseProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
