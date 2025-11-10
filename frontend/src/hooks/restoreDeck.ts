// restoreDeck.ts or above your component
import { BASE_COST_MAP, BASE_RARITY_MAP, BASE_COUNTER_MAP } from "@/bh_lib/constants";
import { OnePieceDeck } from "@/bh_lib/types";

export async function restoreDeck(): Promise<OnePieceDeck | null> {
  const saved = localStorage.getItem("activeDeck");
  if (!saved) return null;

  try {
    const parsed: OnePieceDeck = JSON.parse(saved);

    // If no cards → no API call needed
    if (!parsed.cards || parsed.cards.length === 0) {
      return {
        ...parsed,
        total_price: 0,
        cost_map: new Map(BASE_COST_MAP),
        rarity_map: new Map(BASE_RARITY_MAP),
        counter_map: new Map(BASE_COUNTER_MAP),
      };
    }

    // Recreate base maps
    const costMap = new Map(BASE_COST_MAP);
    const rarityMap = new Map(BASE_RARITY_MAP);
    const counterMap = new Map(BASE_COUNTER_MAP);

    // Gather card IDs
    const cardIds = parsed.cards.map(card => card.id);

    // Only fetch if there are IDs
    let latestPrices: Record<number, number> = {};

    if (cardIds.length > 0) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bounty_api/onepiece_card/latest-prices/?ids=${cardIds.join(",")}`
      );

      if (res.ok) {
        latestPrices = await res.json();
      } else {
        console.warn("Failed to fetch latest prices:", res.status);
      }
    }

    let total_price = 0;

    // Rebuild cards + maps
    const updatedCards = parsed.cards.map(card => {
      const latestPrice = latestPrices[card.id] ?? card.market_price ?? 0;
      total_price += Number(latestPrice);

      costMap.set(String(card.cost ?? "0"), (costMap.get(String(card.cost ?? "0")) ?? 0) + 1);
      counterMap.set(String(card.counter ?? "0"), (counterMap.get(String(card.counter ?? "0")) ?? 0) + 1);

      const rarityKey = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0");
      rarityMap.set(rarityKey, (rarityMap.get(rarityKey) ?? 0) + 1);

      return { ...card, market_price: latestPrice };
    });

    return {
      ...parsed,
      cards: updatedCards,
      total_price,
      cost_map: costMap,
      rarity_map: rarityMap,
      counter_map: counterMap,
    };

  } catch (e) {
    console.warn("Failed to parse saved deck, clearing storage");
    localStorage.removeItem("activeDeck");
    return null;
  }
}
