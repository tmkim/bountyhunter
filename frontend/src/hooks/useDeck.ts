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
      total += Number(leader?.market_price)

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
          leader: deck.leader,//?.id ?? null,
          cards: deck.cards,
          // cards: deck.cards.map(c => c.id),
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

  type Delta = {
    add?: OnePieceCard[];
    remove?: OnePieceCard[];
    leader?: OnePieceCard | null; // direct leader replacement
  };

  const applyDelta = useCallback((delta: Delta) => {
    setDeck(prev => {
      let next = {
        ...prev,
        cards: [...prev.cards],   // ✅ deep clone the cards array
      };

      // ----- LEADER UPDATE ----------------------------------------------------
      if (delta.leader !== undefined) {
        const newLeader = delta.leader;

        if (prev.leader && !newLeader) {
          // removing leader
          next.total_price -= Number(prev.leader.market_price ?? 0);
          next.leader = null;
        } 
        else if (!prev.leader && newLeader) {
          // adding leader
          next.total_price += Number(newLeader.market_price ?? 0);
          next.leader = newLeader;
        }
        else if (prev.leader && newLeader && prev.leader.id !== newLeader.id) {
          // replacing leader
          next.total_price -= Number(prev.leader.market_price ?? 0);
          next.total_price += Number(newLeader.market_price ?? 0);
          next.leader = newLeader;
        }
      }

      // ----- NORMAL CARD ADD/REMOVE -----------------------------------------
      const costMap = new Map(next.cost_map);
      const rarityMap = new Map(next.rarity_map);
      const counterMap = new Map(next.counter_map);
      let price = next.total_price;

      // REMOVE
      delta.remove?.forEach(card => {
        const idx = next.cards.findLastIndex(c => c.id === card.id);
        if (idx !== -1) next.cards.splice(idx, 1);

        // decrement maps
        const costKey = String(card.cost ?? "0");
        costMap.set(costKey, (costMap.get(costKey) ?? 0) - 1);

        const counterKey = String(card.counter ?? "0");
        counterMap.set(counterKey, (counterMap.get(counterKey) ?? 0) - 1);

        const rarityKey = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0");
        rarityMap.set(rarityKey, (rarityMap.get(rarityKey) ?? 0) - 1);

        price -= Number(card.market_price ?? 0);
      });

      // ADD
      delta.add?.forEach(card => {
        next.cards.push(card);

        const costKey = String(card.cost ?? "0");
        costMap.set(costKey, (costMap.get(costKey) ?? 0) + 1);

        const counterKey = String(card.counter ?? "0");
        counterMap.set(counterKey, (counterMap.get(counterKey) ?? 0) + 1);

        const rarityKey = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0");
        rarityMap.set(rarityKey, (rarityMap.get(rarityKey) ?? 0) + 1);

        price += Number(card.market_price ?? 0);
      });

      return {
        ...next,
        cost_map: costMap,
        rarity_map: rarityMap,
        counter_map: counterMap,
        total_price: Math.round(price * 100) / 100,
      };
    });
  }, []);

  const addCard = useCallback((card: OnePieceCard) => {
    applyDelta(
    (card.card_type === "Leader")
      ? { leader: card }
      : { add: [card] }
  );
  }, [applyDelta]);

  const removeCard = useCallback((card: OnePieceCard) => {
    applyDelta(
    (card.card_type === "Leader")
      ? { leader: null }
      : { remove: [card] }
  );
  }, [applyDelta]);


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

  const newDeck = useCallback(() => {
    setDeck(EMPTY_DECK)
  }, []);

const deleteDeck = useCallback(async () => {
  if (!deck.id) {
    toast.error("No deck selected");
    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/bounty_api/onepiece_deck/${deck.id}/`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!res.ok) {
      toast.error("Failed to delete deck");
      return;
    }

    toast.success(`Deleted "${deck.name}"`);

    setDeck(EMPTY_DECK);

  } catch (err) {
    console.error("Unexpected error:", err);
    toast.error("Error deleting deck");
  }
}, [deck.id, deck.name, setDeck]);

  
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
    newDeck,
    deleteDeck,
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
