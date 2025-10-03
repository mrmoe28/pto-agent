import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Permit Office Search - Georgia",
  description: "Find local permit offices in Georgia for building permits, planning, and zoning services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <SessionProvider>
          <Navigation />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
