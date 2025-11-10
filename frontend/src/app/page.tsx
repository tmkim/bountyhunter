"use client"
import ActiveDeck from "@/components/ActiveDeck";
import CardList from "@/components/CardList";
import DetailsPanel from "@/components/DetailsPanel";
import { useState, useRef, useEffect, useMemo } from "react";
import { useCards } from "@/hooks/useCards";
import { OnePieceCard, OnePieceCardHistory, FilterValue, Filters } from "@/bh_lib/types";
import { OnePieceDeck } from "@/bh_lib/types";
import { BASE_COST_MAP, BASE_RARITY_MAP, BASE_COUNTER_MAP } from "@/bh_lib/constants";
import { serialize } from "v8";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { restoreDeck } from "@/hooks/restoreDeck";

function serializeFilters(filters: Filters): Record<string, any>{
  const obj: Record<string, any> = {};
  for (const key in filters) {
    const value = filters[key];
    if (value instanceof Set) {
      obj[key] = Array.from(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

function deserializeFilters(obj: Record<string, any>): Filters {
  const filters: Filters = {};
  for (const key in obj) {
    const value = obj[key];
    // heuristic: arrays of numbers are [number, number], arrays of strings are Sets
    if (Array.isArray(value)) {
      if (value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number") {
        filters[key] = value as [number, number];
      } else {
        filters[key] = new Set(value as string[]);
      }
    }
  }
  return filters;
}

export default function Page() {
  // #region -- Resizable column layout
  const isDragging = useRef(false);
  const [leftWidth, setLeftWidth] = useState(60);

  // Load from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem("leftPanelWidth");
    if (savedWidth) {
      setLeftWidth(parseFloat(savedWidth));
    }
  }, []);

  // Save to localStorage whenever leftWidth changes
  useEffect(() => {
    localStorage.setItem("leftPanelWidth", leftWidth.toString());
  }, [leftWidth]);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const containerWidth = window.innerWidth;
    let newLeftWidth = (e.clientX / containerWidth) * 100;

    // clamp values
    newLeftWidth = Math.max(20, Math.min(newLeftWidth, 80));
    setLeftWidth(newLeftWidth);
  };

  // Attach global listeners once
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  // #endregion

  // #region -- Set up card/deck management state
  const { user } = useAuth();
  const { cards: allCards, loading } = useCards();
  const [deck, setDeck] = useState<OnePieceDeck>({ 
    id: "",
    user: "",
    name: "Untitled Deck", 
    leader: null, 
    cards: [],
    total_price: 0,
    cost_map: new Map(BASE_COST_MAP),
    rarity_map: new Map(BASE_RARITY_MAP),
    counter_map: new Map(BASE_COUNTER_MAP)
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      // Convert Maps to arrays
      const deckToSave = {
        ...deck,
        total_price: 0,
        cost_map: [],
        rarity_map: [],
        counter_map: [],
      };

      localStorage.setItem("activeDeck", JSON.stringify(deckToSave));
      }, 1000);

    return () => clearTimeout(handler); // cancel timeout on re-render
  }, [deck]);

  // useEffect(() => {
  //   const loadDeck = async () => {
  //     const saved = localStorage.getItem("activeDeck");
  //     if (!saved) return;

  //     try {
  //       const parsed = JSON.parse(saved);

  //       // Recreate maps
  //       const costMap = new Map(BASE_COST_MAP);
  //       const rarityMap = new Map(BASE_RARITY_MAP);
  //       const counterMap = new Map(BASE_COUNTER_MAP);

  //       // fetch prices
  //       const cardIds = parsed.cards.map((c: OnePieceCard) => c.id);
  //       if (!cardIds) return;
  //       const res = await fetch(
  //         `${process.env.NEXT_PUBLIC_API_URL}/bounty_api/onepiece_card/latest-prices/?ids=${cardIds.join(',')}`
  //       );
  //       const latestPrices: Record<number, number> = await res.json();
  //       console.log(saved)

  //       let total_price = 0;

  //       // build new cards + maps from scratch
  //       const updatedCards = parsed.cards.map((card: OnePieceCard) => {
  //         const latestPrice = latestPrices[card.id] ?? card.market_price ?? 0;
  //         total_price += Number(latestPrice);

  //         const costKey = String(card.cost ?? "0");
  //         costMap.set(costKey, (costMap.get(costKey) ?? 0) + 1);

  //         const counterKey = String(card.counter ?? "0");
  //         counterMap.set(counterKey, (counterMap.get(counterKey) ?? 0) + 1);

  //         const rarityKey = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0");
  //         rarityMap.set(rarityKey, (rarityMap.get(rarityKey) ?? 0) + 1);

  //         return { ...card, market_price: latestPrice };
  //       });

  //       // build final deck object
  //       const newDeck = {
  //         ...parsed,
  //         cards: updatedCards,
  //         total_price,
  //         cost_map: costMap,
  //         counter_map: counterMap,
  //         rarity_map: rarityMap,
  //       };

  //       setDeck(newDeck);

  //     } catch (err) {
  //       console.warn("Failed to parse saved deck, clearing storage");
  //       localStorage.removeItem("activeDeck");
  //     }
  //   };

  //   loadDeck();
  // }, []);

  useEffect(() => {
    (async () => {
      const deck = await restoreDeck();
      if (deck) setDeck(deck);
    })();
  }, []);


  const [previewCard, setPreviewCard] = useState<OnePieceCard | null>(null);

  const previewTarget = previewCard;

  const handleRightClick = (card: OnePieceCard) => {
    setPreviewCard((prev) => (prev?.id === card.id ? null : card));
  };

  // #endregion

  // #region -- Filters

  // The active search string that actually filters cards
  const [activeSearch, setActiveSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});

  const clearAllFilters = () => {
    localStorage.removeItem("activeFilters");
    setFilters({});
  };

  const updateFilter = (
    group: string,
    valueOrUpdater: FilterValue | ((prev: FilterValue | undefined) => FilterValue)
  ) => {
    setFilters((prev) => ({
      ...prev,
      [group]:
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(prev[group])
          : valueOrUpdater,
    }));
  };

  const filteredCards = allCards.filter((card: OnePieceCard) => {
    const matchesName = card.name
      .toLowerCase()
      .includes(activeSearch.toLowerCase());
    const matchesID =
      (card.card_id?.toLowerCase() || "")
        .includes(activeSearch.toLowerCase());


    // Read filter values into locals (so narrowing works reliably)
    const colorVal = filters.color;
    const typeVal = filters.type;
    const rarityVal = filters.rarity;
    const counterVal = filters.counter;
    const priceVal = filters.price;
    const powerVal = filters.power;

    // --- Colors ---
    const matchesColor =
      colorVal instanceof Set &&
        colorVal.size > 0 &&
        card.color
        ? card.color
          .split("/")
          .map((c) => c.trim())
          .some((c) => colorVal.has(c)) // use the local var we narrowed
        : false;

    // --- Types ---
    const matchesType =
      typeVal instanceof Set &&
        typeVal.size > 0 &&
        card.card_type
        ? (
          typeVal.has(card.card_type)
          // normalize card type and handle "Packs" special case
          || (typeVal.has("Packs") && card.card_type === "<NA>")
        )
        : false;

    // Check for Primary Filters
    const primaryMatch =
      (colorVal instanceof Set && colorVal.size > 0)
        && (typeVal instanceof Set && typeVal.size > 0)
        ? matchesColor && matchesType
        : matchesColor || matchesType;

    if (!primaryMatch) return false;

    // --- Rarity ---
    const matchesRarity =
      rarityVal instanceof Set &&
        rarityVal.size > 0 &&
        card.rarity
        ? rarityVal.has(card.rarity)
        : true; // no filter => don't block results

    // --- Counter ---
    const matchesCounter =
      counterVal instanceof Set && counterVal.size > 0
        ? counterVal.has(card.counter?.toString() ?? "")
        : true;

    // --- Price range ---
    const matchesPrice =
      Array.isArray(priceVal) && priceVal.length === 2
        ? (() => {
          const price = typeof card.market_price === "number"
            ? card.market_price
            : Number(card.market_price ?? NaN);

          if (isNaN(price)) return false;

          const [minVal, maxVal] = priceVal;
          return (
            price >= minVal &&
            (maxVal === 500 ? true : price <= maxVal)
          );
        })()
        : true;

    // --- Power range ---
    const matchesPower =
      Array.isArray(powerVal) && powerVal.length === 2
        ? card.power != null &&
        typeof card.power === "number" &&
        card.power >= powerVal[0] &&
        card.power <= powerVal[1]
        : true; // no filter => don't block results

    return (
      primaryMatch &&
      matchesRarity &&
      matchesCounter &&
      matchesPower &&
      matchesPrice &&
      (matchesName || matchesID)
      // && matchesID
    );
  }).sort((a, b) => {
    // --- Sort by color first ---
    const colorA = a.color?.toLowerCase() || "";
    const colorB = b.color?.toLowerCase() || "";

    if (colorA < colorB) return -1;
    if (colorA > colorB) return 1;

    // --- If colors are equal, sort by cost ---
    const costA = a.cost ?? Infinity; // handle undefined
    const costB = b.cost ?? Infinity;

    if (costA < costB) return -1;
    if (costA > costB) return 1;

    // --- If costs are equal, sort by name ---
    const nameA = a.name?.toLowerCase() || "";
    const nameB = b.name?.toLowerCase() || "";

    if (nameA < nameB) return -1;
    else return 1;
  });

  // useEffect(() => {
  //   console.log("Filtered Cards: ", filteredCards.length)
  // }, [filteredCards]);

  useEffect(() => {
    console.log("Filters updated:", filters);
    const handler = setTimeout(() => {
      localStorage.setItem("activeFilters", JSON.stringify(serializeFilters(filters)));
      }, 1000); 

    return () => clearTimeout(handler); // cancel timeout on re-render
  }, [filters]);

  useEffect(() => {
    const saved = localStorage.getItem("activeFilters");
    if (saved) {
      try {
        setFilters(deserializeFilters(JSON.parse(saved)));
      } catch {
        console.warn("Failed to parse saved filters, clearing storage");
        localStorage.removeItem("activeFilters");
      }
    }
  }, []);
  // #endregion

  // #region Deck Actions
  const renameDeck = (newName: string) => {
    setDeck(prev => ({
      ...prev,
      name: newName
    }))
  }

  const addToDeck = (card: OnePieceCard) => {
    setDeck(prev => {
      const { cards, leader, cost_map, rarity_map, counter_map, total_price } = prev;

      // ===== Validity Checks =====
      const count = cards.filter(c => c.product_id === card.product_id).length;
      const leaderCount = leader ? 1 : 0;
      const validLeader = card.card_type === "Leader" ? (leaderCount < 1) : true;

      if (count >= 4) {
        console.warn(`${card.name} is already at the max of 4 copies.`);
        return prev;
      }

      if (!validLeader) {
        // alert("You can only have one Leader card in your deck.");
        return prev;
      }

      // ===== Leader Case =====
      if (card.card_type === "Leader") {
        // Leader should affect total_price but not other stats
        const newCards = [card, ...cards];
        const newPrice = Math.round((total_price + Number(card.market_price ?? 0)) * 100) / 100;
        return { ...prev, 
          leader: card, 
          cards: newCards,
          total_price: newPrice };
      }

      // ===== Normal Card Case =====
      const newCards = [...cards, card];
      const newPrice = Math.round((total_price + Number(card.market_price ?? 0)) * 100) / 100;

      // Copy Maps
      const newCostMap = new Map(cost_map);
      const newRarityMap = new Map(rarity_map);
      const newCounterMap = new Map(counter_map);

      // Normalize and increment keys
      const costKey = String(card.cost ?? "0");
      newCostMap.set(costKey, (newCostMap.get(costKey) ?? 0) + 1);

      const counterKey = String(card.counter ?? "0");
      newCounterMap.set(counterKey, (newCounterMap.get(counterKey) ?? 0) + 1);

      const rarityKey = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0");
      newRarityMap.set(rarityKey, (newRarityMap.get(rarityKey) ?? 0) + 1);

      // ===== Return New Deck Object =====
      return {
        ...prev,
        cards: newCards,
        total_price: newPrice,
        cost_map: newCostMap,
        rarity_map: newRarityMap,
        counter_map: newCounterMap,
      };
    });
  };
  const removeFromDeck = (card: OnePieceCard) => {
    setDeck(prev => {
      const { leader, cards, total_price, cost_map, rarity_map, counter_map } = prev;

      // ===== Leader Case =====
      if (card.card_type === "Leader" && leader?.id === card.id) {
        const indexToRemove = cards.findLastIndex(c => c.id === card.id);
        if (indexToRemove === -1) return prev;
        const newCards = [...cards];
        const removedCard = newCards.splice(indexToRemove, 1)[0];
        
        const newPrice = Math.round((total_price - Number(card.market_price ?? 0)) * 100) / 100;
        return {
           ...prev, 
           leader: null, 
           cards: newCards,
           total_price: Math.max(newPrice, 0) 
          };
      }

      // ===== Normal Card Case =====
      const indexToRemove = cards.findLastIndex(c => c.id === card.id);
      if (indexToRemove === -1) return prev;

      const newCards = [...cards];
      const removedCard = newCards.splice(indexToRemove, 1)[0];

      // Update total price
      const newPrice = Math.round((total_price - Number(removedCard.market_price ?? 0)) * 100) / 100;

      // Copy Maps
      const newCostMap = new Map(cost_map);
      const newRarityMap = new Map(rarity_map);
      const newCounterMap = new Map(counter_map);

      // Normalize and decrement keys
      const costKey = String(removedCard.cost ?? "0");
      newCostMap.set(costKey, Math.max((newCostMap.get(costKey) ?? 0) - 1, 0));

      const counterKey = String(removedCard.counter ?? "0");
      newCounterMap.set(counterKey, Math.max((newCounterMap.get(counterKey) ?? 0) - 1, 0));

      const rarityKey =
        removedCard.rarity === "DON!!" ? "DON" : String(removedCard.rarity ?? "0");
      newRarityMap.set(rarityKey, Math.max((newRarityMap.get(rarityKey) ?? 0) - 1, 0));

      // ===== Return Updated Deck =====
      return {
        ...prev,
        cards: newCards,
        total_price: Math.max(newPrice, 0),
        cost_map: newCostMap,
        rarity_map: newRarityMap,
        counter_map: newCounterMap,
      };
    });
  };

  const clearDeck = () => {
    localStorage.removeItem("activeDeck");
    setDeck(prev => ({
      id: "",
      user: "",
      name: prev.name,
      leader: null,
      cards: [],
      total_price: 0,
      cost_map: new Map(BASE_COST_MAP),
      rarity_map: new Map(BASE_RARITY_MAP),
      counter_map: new Map(BASE_COUNTER_MAP),
    }));
    console.log(deck)
  };

  const saveDeck = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bounty_api/onepiece_deck/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: deck.name,
          leader: deck.leader,
          cards: deck.cards,
        }),
      }); 

      const text = await res.text(); // ✅ read as text first
      console.log("Raw response:", text);

      if (!res.ok) {
        console.error("Failed to save deck. Status:", res.status);
        try {
          const errorData = JSON.parse(text);
          console.error("Error JSON:", errorData);
        } catch {
          console.error("Error response was not JSON:", text);
        }
        toast.error("Failed to save deck");
        return;
      }

      const data = JSON.parse(text);
      console.log("Deck saved successfully:", data);
      toast.success(`Saved "${deck.name}"!`);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Error saving deck");
    }
  };

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
  // #endregion

  // #region -- Render
  if (loading) return <p>Loading cards…</p>;

  return (
    <div className="py-5 h-[calc(100vh-60px)] min-h-full w-full flex flex-1 overflow-auto">
      {/* Left Column */}
      <div
        className="pl-5 flex flex-col min-w-[710px] gap-4"
        style={{ flexBasis: `${leftWidth}%`, flexGrow: 1, flexShrink: 1 }}
      >
        <ActiveDeck
          deck={deck}
          setDeck={setDeck}
          onRename={renameDeck}
          onClear={clearDeck}
          onSave={saveDeck}
          onRemove={removeFromDeck}
          onRightClick={handleRightClick}
        />
        <CardList
          allCards={filteredCards}
          search={activeSearch}
          setSearch={setActiveSearch}
          filters={filters}
          clearFilter={clearAllFilters}
          updateFilter={updateFilter}
          onAdd={addToDeck}
          onRightClick={handleRightClick}
        />
      </div>

      {/* Divider */}
      <div
        className="mx-5 flex-shrink-0 w-2 min-h-[865px]
                   cursor-col-resize bg-gray-300 hover:bg-gray-400"
        onMouseDown={handleMouseDown}
      />

      {/* Right Column */}
      <div
        className="pr-5 flex flex-col flex-shrink min-w-[420px]"
        style={{ flexBasis: `${100 - leftWidth}%`, flexGrow: 1, flexShrink: 1 }}
      >
        <DetailsPanel
          onCloseModal={handleRightClick}
          card={previewTarget}
          deck={deck}
          costData={costData}
          counterData={counterData}
          rarityData={rarityData}
        />
      </div>
    </div>

  );
  // #endregion
}
