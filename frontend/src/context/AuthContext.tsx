"use client"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { toast } from "react-hot-toast";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isRefreshing = useRef(false);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    if (!user) return
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.warn("fetchUser failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

const refreshUser = useCallback(async () => {
  if (isRefreshing.current || !user) return;
  isRefreshing.current = true;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/token/refresh/`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Token refresh failed");

    await fetchUser();
    console.log("🔄 Token refreshed successfully");
  } catch (err) {
    console.error("Refresh failed, logging out:", err);

    const wasLoggedIn = !!user;
    setUser(null);

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout/`, {
      method: "POST",
      credentials: "include",
    });

    if (wasLoggedIn) {
        toast.error("Your session expired. Please log in again.");
        router.push("/login");
    }
  } finally {
    isRefreshing.current = false;
  }
}, [fetchUser, router, user]);


  const login = async (username: string, password: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });
    if (!res.ok) {
        toast.error("Invalid username or password");
        throw new Error("Login failed");
    }
    await fetchUser();
    toast.success("Welcome back!");
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
      credentials: "include",
    });
    if (!res.ok) {
        toast.error("Registration failed");
        throw new Error("Registration failed");
    }
    toast.success("Account created successfully");
    await fetchUser();
  };

  const logout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout/`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  // Try to fetch user on initial mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Auto-refresh every 4 minutes
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => refreshUser(), 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  // Refresh when tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshUser();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, register, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
