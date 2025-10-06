// frontend/hooks/useCards.ts
import { useEffect, useState } from "react";
import { OnePieceCard } from "@/lib/types";
import { getAllCards, saveCards } from "../lib/indexedDB";

const ONE_DAY = 24 * 60 * 60 * 1000;

export function useCards() {
  const [cards, setCards] = useState<OnePieceCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCards() {
      // Load cards from IndexedDB first
      const localCards = await getAllCards();
      if (localCards.length > 0) setCards(localCards);

      // Check last fetch timestamp
      const lastFetch = localStorage.getItem("cardsLastFetched");
      const now = Date.now();
      if (!lastFetch || now - Number(lastFetch) > ONE_DAY) {
        try {
          const res = await fetch("http://localhost:8000/bounty_api/onepiece_card/");
          const data: OnePieceCard[] = await res.json();
          setCards(data);
          await saveCards(data);
          localStorage.setItem("cardsLastFetched", now.toString());
        } catch (err) {
          console.error("Failed to fetch cards:", err);
        }
      }

      setLoading(false);
    }

    loadCards();
  }, []);

  return { cards, loading };
}
