"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch {
      toast.error("Login failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-lapis p-6 rounded-2xl shadow">
        <h1 className="text-2xl text-tangerine font-semibold text-center mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="max-w-sm mx-auto flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border p-2 rounded bg-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 rounded bg-white"
        />
        <button type="submit" 
            className="w-full bg-maya text-white py-2 rounded 
            hover:bg-rosso hover:cursor-pointer transition">
        {/* className="bg-blue-500 text-white rounded p-2"> */}
          Login
        </button>
      </form>
    </div>
    </div>

  );
}
