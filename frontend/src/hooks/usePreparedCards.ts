"use client";
import { useEffect, useState } from "react";
import { OnePieceCard } from "@/bh_lib/types";

function getFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").pop() || "";
  } catch {
    return "";
  }
}

function useFingerprintEffect(effect: React.EffectCallback, deps: any[]) {
  const fingerprint = JSON.stringify(deps);
  return useEffect(effect, [fingerprint]);
}

// 🔹 simple global cache to skip reloading same image again
const preloadCache = new Map<string, string>();

async function preloadImage(localSrc: string): Promise<string> {
  if (preloadCache.has(localSrc)) return preloadCache.get(localSrc)!;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = localSrc;
    img.onload = () => {
      preloadCache.set(localSrc, localSrc);
      resolve(localSrc);
    };
    img.onerror = () => {
      preloadCache.set(localSrc, "/cards/fallback.png");
      resolve("/cards/fallback.png");
    };
  });
}

export function usePreparedCards(cards: OnePieceCard[])  {
  const [processedCards, setProcessedCards] = useState<OnePieceCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFingerprintEffect(() => {
    if (!cards.length) {
      setProcessedCards([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const preloadAll = async () => {
      const results = await Promise.all(
        cards.map(async (card) => {
          const filename = card.image_url ? getFilenameFromUrl(card.image_url) : "";
          const localSrc = filename
            ? `/cards/small_60/${filename}`
            : "/cards/fallback.png";
          const validSrc = await preloadImage(localSrc);
          return { ...card, image_url: validSrc };
        })
      );

      if (!cancelled) {
        setProcessedCards(results);
        setIsLoading(false);
      }
    };

    preloadAll();

    return () => {
      cancelled = true;
    };
  }, [cards]);

  return { processedCards, isLoading };
}
