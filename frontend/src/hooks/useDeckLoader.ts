"use client";

import { useEffect, useState, useCallback } from "react";
import { restoreDeck } from "./restoreDeck";
import type { OnePieceDeck } from "@/bh_lib/types";

export function useDeckLoader() {
  const [deck, setDeck] = useState<OnePieceDeck | null>(null);
  const [deck_loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const restored = await restoreDeck();
      setDeck(restored);
    } catch (e) {
      setError("Failed to restore deck");
      console.error(e);
      setDeck(null);
    }

    setLoading(false);
  }, []);

  // Load once on mount
  useEffect(() => {
    load();
  }, [load]);

  // Expose reload function to components
  const reloadDeck = useCallback(() => {
    load();
  }, [load]);

  return {
    deck,
    deck_loading,
    error,
    reloadDeck,
  };
}
