"use client";

import { useState, useEffect, useCallback } from "react";
import { OnePieceCard, OnePieceDeck } from "@/bh_lib/types"; // adjust import paths
import {
  BASE_COST_MAP,
  BASE_RARITY_MAP,
  BASE_COUNTER_MAP,
  EMPTY_DECK,
} from "@/bh_lib/constants";
import toast from "react-hot-toast";

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
  const [deck, setDeck] = useState<OnePieceDeck>(EMPTY_DECK);

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
  // ✅ Load a deck
  // ---------------------------------------------------------------------------
  const loadDeck = useCallback(
    async (deck: OnePieceDeck) => {
      if (!deck) return;

      // Normalize missing arrays
      const cards = deck.cards ?? [];
      const leader = deck.leader ?? null;

      const updated = await recalcDeck(
        cards,
        leader,
        deck.name,
        deck.id,
        deck.user
      );
      setDeck(updated);
    },
  []
);

  // ---------------------------------------------------------------------------
  // ✅ Save deck to localStorage
  // ---------------------------------------------------------------------------
  const saveDeck = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/bounty_api/onepiece_deck/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: deck.name,
          leader: deck.leader?.id ?? null,
          cards: deck.cards.map(c => c.id),
        }),
      });

      const text = await res.text();
      console.log("Raw response:", text);

      if (!res.ok) {
        console.error("Failed to save deck:", res.status);
        try {
          console.error("Error JSON:", JSON.parse(text));
        } catch {
          console.error("Non-JSON error:", text);
        }
        toast.error("Failed to save deck");
        return;
      }

      const data = JSON.parse(text);

      setDeck(prev => ({
        ...prev,
        id: data.id,
        user: data.user,
      }));

      console.log("Deck saved successfully:", data);
      toast.success(`Saved "${deck.name}"!`);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Error saving deck");
    }
  }, [deck]);

  const renameDeck = useCallback((newName: string) => {
    setDeck((prev) => ({ ...prev, name: newName }));
  }, []);

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
