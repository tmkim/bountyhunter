export async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error(`An error occurred while fetching: ${res.statusText}`);
    // Optionally attach more context to error
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}
