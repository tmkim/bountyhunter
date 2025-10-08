const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchItems() {
  const res = await fetch(`${API_BASE}/api/items/`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
