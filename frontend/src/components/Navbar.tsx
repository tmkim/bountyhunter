"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// src/components/Navbar.tsx
export default function Navbar() {
    const { user, logout } = useAuth();
    return (
        <header className="bg-maya shadow border-b-2 border-black">
            <nav className="w-full mx-auto flex items-center justify-between px-6 py-3">
                <Link href="/" className="text-2xl font-bold text-black">Bountyhunter</Link>
                {/* Placeholder login/user menu */}
                {/* <button className="rounded bg-rosso px-3 py-1 text-white hover:bg-brown">
                        Login
                    </button> */}
                {user ? (
                    <div className="flex gap-4 items-center">
                        <span>{user.username}</span>
                        <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <Link href="/login"
                        className="px-2 py-1 font-medium bg-rosso text-white rounded 
                        hover:text-tangerine hover:cursor-pointer">
                            Login
                        </Link>    
                        <Link href="/register"
                        className="px-2 py-1 font-medium bg-rosso text-white rounded 
                        hover:text-tangerine hover:cursor-pointer">
                            Register
                        </Link>
                    </div>
                )}
            </nav>
        </header>
    );
}
