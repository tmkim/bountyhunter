// frontend/lib/api/auth.ts
export async function registerUser(data: { username: string; password: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // send/receive cookies
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

export async function loginUser(data: { username: string; password: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function logoutUser() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout/`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Logout failed");
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/`, {
    credentials: "include",
  });
  if (res.status === 401) throw new Error("Not authenticated");
  return res.json();
}
