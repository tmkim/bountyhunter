"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      alert("Logged in!");
    } catch {
      alert("Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-10 flex flex-col gap-4">
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
      <button type="submit" className="bg-blue-500 text-white rounded p-2">
        Login
      </button>
    </form>
  );
}
