"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

const addCard = useCallback((card: OnePieceCard) => {
  setDeck(prev => {
    const newCostMap = new Map(prev.cost_map);
    const newRarityMap = new Map(prev.rarity_map);
    const newCounterMap = new Map(prev.counter_map);

    // Update maps
    const costKey = String(card.cost ?? "0");
    newCostMap.set(costKey, (newCostMap.get(costKey) ?? 0) + 1);

    const counterKey = String(card.counter ?? "0");
    newCounterMap.set(counterKey, (newCounterMap.get(counterKey) ?? 0) + 1);

    const rarityKey = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0");
    newRarityMap.set(rarityKey, (newRarityMap.get(rarityKey) ?? 0) + 1);

    return {
      ...prev,
      cards: [...prev.cards, card],
      cost_map: newCostMap,
      rarity_map: newRarityMap,
      counter_map: newCounterMap,
      total_price: Math.round((prev.total_price + Number(card.market_price ?? 0)) * 100) / 100,
    };
  });
}, []);

  
const removeCard = useCallback((card: OnePieceCard) => {
  setDeck(prev => {
    const idx = prev.cards.findLastIndex(c => c.id === card.id);
    if (idx === -1) return prev;

    const newCards = [...prev.cards];
    newCards.splice(idx, 1);

    const newCostMap = new Map(prev.cost_map);
    const newRarityMap = new Map(prev.rarity_map);
    const newCounterMap = new Map(prev.counter_map);

    // decrement maps
    const costKey = String(card.cost ?? "0");
    newCostMap.set(costKey, (newCostMap.get(costKey) ?? 0) - 1);

    const counterKey = String(card.counter ?? "0");
    newCounterMap.set(counterKey, (newCounterMap.get(counterKey) ?? 0) - 1);

    const rarityKey = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0");
    newRarityMap.set(rarityKey, (newRarityMap.get(rarityKey) ?? 0) - 1);
    
    return {
      ...prev,
      cards: newCards,
      cost_map: newCostMap,
      rarity_map: newRarityMap,
      counter_map: newCounterMap,
      total_price: Math.round((prev.total_price - Number(card.market_price ?? 0)) * 100) / 100,
    };
  });
}, []);

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
  
  const costData = useMemo(() => {
    return Array.from(deck.cost_map?.entries() ?? new Map(BASE_COST_MAP).entries())
      .map(([cost, count]) => ({ cost, count }))
      .sort((a, b) =>
        (a.cost === "none" ? 999 : +a.cost) -
        (b.cost === "none" ? 999 : +b.cost)
      );
  }, [deck.cost_map]);

  const rarityData = useMemo(() => {
    return Array.from(deck.rarity_map?.entries() ?? new Map(BASE_RARITY_MAP).entries())
      .map(([rarity, count]) => ({ rarity, count }));
  }, [deck.rarity_map]);

  const counterData = useMemo(() => {
    return Array.from(deck.counter_map?.entries() ?? new Map(BASE_COUNTER_MAP).entries())
      .map(([counter, count]) => ({ counter, count }));
  }, [deck.counter_map]);
  
  return {
    deck,
    loadDeck,
    saveDeck,
    renameDeck,
    addCard,
    removeCard,
    clearDeck,
    costData,
    rarityData,
    counterData
  };
}
