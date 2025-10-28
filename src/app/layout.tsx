import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from '@/components/Providers';
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
  const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
  const squareScriptUrl = squareEnvironment === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js';

  return (
    <html lang="en">
      <head>
        <script
          type="text/javascript"
          src={squareScriptUrl}
          async
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
