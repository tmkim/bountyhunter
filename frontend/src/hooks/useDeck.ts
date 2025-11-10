"use client";

import { useState, useEffect, useCallback } from "react";
import { OnePieceCard, OnePieceDeck } from "@/bh_lib/types"; // adjust import paths
import {
  BASE_COST_MAP,
  BASE_RARITY_MAP,
  BASE_COUNTER_MAP,
} from "@/bh_lib/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchLatestPrices(cardIds: number[]): Promise<Record<number, number>> {
  if (!cardIds.length) return {};

  const url = `${API_URL}/bounty_api/onepiece_card/latest-prices/?ids=${cardIds.join(",")}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.warn("Failed to fetch latest prices");
    return {};
  }

  return res.json();
}

export function useDeck() {
  const [deck, setDeck] = useState<OnePieceDeck>({
    id: "",
    user: "",
    name: "Untitled Deck",
    leader: null,
    cards: [],
    total_price: 0,
    cost_map: new Map(BASE_COST_MAP),
    rarity_map: new Map(BASE_RARITY_MAP),
    counter_map: new Map(BASE_COUNTER_MAP),
  });

  // ---------------------------------------------------------------------------
  // ✅ Internal helper: recompute deck derived values
  // ---------------------------------------------------------------------------
  const recalcDeck = useCallback(
    async (cards: OnePieceCard[], leader: OnePieceCard | null, name: string, id: string, user: string) => {
      const costMap = new Map(BASE_COST_MAP);
      const rarityMap = new Map(BASE_RARITY_MAP);
      const counterMap = new Map(BASE_COUNTER_MAP);

      const cardIds = cards.map((c) => c.id);
      const latestPrices = await fetchLatestPrices(cardIds);

      let total = 0;

      const updatedCards = cards.map((card) => {
        const latestPrice = latestPrices[card.id] ?? card.market_price ?? 0;
        total += Number(latestPrice);

        // Cost
        const costKey = String(card.cost ?? "0");
        costMap.set(costKey, (costMap.get(costKey) ?? 0) + 1);

        // Counter
        const counterKey = String(card.counter ?? "0");
        counterMap.set(counterKey, (counterMap.get(counterKey) ?? 0) + 1);

        // Rarity
        const rarityKey = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0");
        rarityMap.set(rarityKey, (rarityMap.get(rarityKey) ?? 0) + 1);

        return { ...card, market_price: latestPrice };
      });

      return {
        id,
        user,
        name,
        leader,
        cards: updatedCards,
        total_price: total,
        cost_map: costMap,
        rarity_map: rarityMap,
        counter_map: counterMap,
      };
    },
    []
  );

  // ---------------------------------------------------------------------------
  // ✅ Restore deck from localStorage
  // ---------------------------------------------------------------------------
  const loadDeck = useCallback(async () => {
    const saved = localStorage.getItem("activeDeck");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      const restored = await recalcDeck(
        parsed.cards ?? [],
        parsed.leader ?? null,
        parsed.name ?? "Untitled Deck",
        parsed.id ?? "",
        parsed.user ?? ""
      );

      setDeck(restored);
    } catch (err) {
      console.warn("Failed to restore deck:", err);
      localStorage.removeItem("activeDeck");
    }
  }, [recalcDeck]);

  // Load saved deck on first mount
  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  // ---------------------------------------------------------------------------
  // ✅ Save deck to localStorage
  // ---------------------------------------------------------------------------
  const saveDeck = useCallback(() => {
    try {
      const minimized = {
        ...deck,
        cost_map: Array.from(deck.cost_map.entries()),
        rarity_map: Array.from(deck.rarity_map.entries()),
        counter_map: Array.from(deck.counter_map.entries()),
      };

      localStorage.setItem("activeDeck", JSON.stringify(minimized));
    } catch (err) {
      console.error("Failed to save deck:", err);
    }
  }, [deck]);

  // ---------------------------------------------------------------------------
  // ✅ Rename deck
  // ---------------------------------------------------------------------------
  const renameDeck = useCallback((newName: string) => {
    setDeck((prev) => ({ ...prev, name: newName }));
  }, []);

  // ---------------------------------------------------------------------------
  // ✅ Add card
  // ---------------------------------------------------------------------------
  const addCard = useCallback(
    async (card: OnePieceCard) => {
      const card_count = deck.cards.filter(c => c.product_id === card.product_id).length;
      if (card_count >= 4){
        return
      }

      // Leader logic — only 1 allowed
      let newLeader = deck.leader;
      let newCards = deck.cards;

      if (card.card_type === "Leader") {
        if (deck.leader){
          newCards.splice(deck.cards.findLastIndex(c => c.id === card.id), 1);
        }
        newLeader = card;
      }
      newCards = [...newCards, card]

      const updated = await recalcDeck(
        newCards,
        newLeader,
        deck.name,
        deck.id,
        deck.user
      );

      setDeck(updated);
    },
    [deck, recalcDeck]
  );

  // ---------------------------------------------------------------------------
  // ✅ Remove card
  // ---------------------------------------------------------------------------
  const removeCard = useCallback(
    async (card: OnePieceCard) => {
      let newLeader = deck.leader;
      let newCards = deck.cards;

      if (card.card_type === "Leader") {
        newLeader = null;
      }
      // newCards = deck.cards.filter((c) => c.id !== card.id);
      newCards.splice(deck.cards.findLastIndex(c => c.id === card.id), 1);
      

      const updated = await recalcDeck(
        newCards,
        newLeader,
        deck.name,
        deck.id,
        deck.user
      );

      setDeck(updated);
    },
    [deck, recalcDeck]
  );

  // ---------------------------------------------------------------------------
  // ✅ Clear deck (keeps name/id but wipes everything else)
  // ---------------------------------------------------------------------------
  const clearDeck = useCallback(() => {
    setDeck((prev) => ({
      ...prev,
      leader: null,
      cards: [],
      total_price: 0,
      cost_map: new Map(BASE_COST_MAP),
      rarity_map: new Map(BASE_RARITY_MAP),
      counter_map: new Map(BASE_COUNTER_MAP),
    }));
  }, []);

  return {
    deck,
    loadDeck,
    saveDeck,
    renameDeck,
    addCard,
    removeCard,
    clearDeck,
  };
}
