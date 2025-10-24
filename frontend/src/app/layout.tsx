// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

import Navbar from "@/components/Navbar";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bountyhunter",
  description: "Track, manage, and hunt down your bounties.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`flex flex-col  ${inter.className} h-screen bg-lapis text-black`}>
        <Navbar />
        <main className="flex-1 bg-brown">{children}</main>
      </body>
    </html>
  );
}
