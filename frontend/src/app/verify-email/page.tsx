"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bounty_api/verify-email/?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Your email has been successfully verified! You can now log in.");
        } else {
          setStatus("error");
          setMessage(data.detail || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again later.");
      }
    };

    verify();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-lapis p-6 rounded-2xl shadow">
          <h1 className={`text-2xl pb-6 ${status === "success" ? "text-tangerine" : status === "error" ? "text-rosso" : ""}`}>
            {message}
          </h1>
          {status === "success" && (
            <div className="flex justify-between">
            <Link href="/"
                className="px-6 py-1 font-medium bg-rosso text-white rounded 
                hover:text-tangerine hover:cursor-pointer">
                    Home
            </Link> 
            <Link href="/login"
                className="px-6 py-1 font-medium bg-rosso text-white rounded 
                hover:text-tangerine hover:cursor-pointer">
                    Login
            </Link> 
            </div>
          )}
      </div>
    </div>

  );
}
