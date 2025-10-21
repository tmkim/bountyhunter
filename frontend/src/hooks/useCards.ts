import { useEffect, useState } from "react";
import { OnePieceCard } from "@/bh_lib/types";
import { getAllCards, saveCards } from "@/bh_lib/indexedDB";

const ONE_DAY = 24 * 60 * 60 * 1000;

// --- Helper: Deduplicate cards by id or product_id ---
function dedupeCards(cards: OnePieceCard[]): OnePieceCard[] {
  const seen = new Map<number | string, OnePieceCard>();
  for (const card of cards) {
    const key = card.id ?? card.product_id;
    if (!seen.has(key)) seen.set(key, card);
  }
  return Array.from(seen.values());
}

// --- Helper: Detect obviously stale data ---
function isStaleData(cards: OnePieceCard[]): boolean {
  if (!cards.length) return true;

  // too large = probably duplicated cache
  if (cards.length > 10000) return true;

  // old data format (subtypes joined by ";")
  if (cards.some(c => c.subtype?.includes(";"))) return true;

  // missing key fields = corrupted
  if (cards.some(c => !c.name || !c.product_id)) return true;

  return false;
}

export function useCards() {
  const [cards, setCards] = useState<OnePieceCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCards() {
      setLoading(true);

      // Step 1: Load local data
      const localCards = await getAllCards();
      let validLocal = dedupeCards(localCards);

      // Step 2: Check timestamp
      const lastFetch = localStorage.getItem("cardsLastFetched");
      const now = Date.now();
      const isOld = !lastFetch || now - Number(lastFetch) > ONE_DAY;

      // Step 3: Determine if we need a fresh fetch
      const shouldRefetch = isOld || isStaleData(validLocal);

      if (shouldRefetch) {
        console.log("Fetching fresh card data from backend...");
        try {
          const res = await fetch("http://localhost:8000/bounty_api/onepiece_card/");
          const data: OnePieceCard[] = await res.json();

          // Clean, dedupe, save, and display
          const unique = dedupeCards(data);
          setCards(unique);
          await saveCards(unique);
          localStorage.setItem("cardsLastFetched", now.toString());
        } catch (err) {
          console.error("Failed to fetch cards:", err);
          // Fallback to local even if stale
          setCards(validLocal);
        }
      } else {
        console.log("Using cached card data.");
        setCards(validLocal);
      }

      setLoading(false);
    }

    loadCards();
  }, []);

  return { cards, loading };
}
