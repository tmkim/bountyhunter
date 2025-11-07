// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bountyhunter",
  description: "Track, manage, and hunt down your trading card bounties.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`flex flex-col ${inter.className} h-screen bg-lapis text-black`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 bg-opbrown">
            {children}
          </main>
          <Toaster
            position="top-center"
            toastOptions={{
              success: {
                style: {
                  background: "#1b4332",
                  color: "#d8f3dc",
                  border: "1px solid #40916c",
                },
              },
              error: {
                style: {
                  background: "#780000",
                  color: "#fff",
                  border: "1px solid #c1121f",
                },
              },
            }
          }
        />
        </AuthProvider>
      </body>
    </html>
  );
}
