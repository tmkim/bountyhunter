"use client"
import ActiveDeck from "@/components/ActiveDeck";
import CardList from "@/components/CardList";
import DetailsPanel from "@/components/DetailsPanel";
import {useState, useRef, useEffect, useMemo} from "react";
import { useCards } from "@/hooks/useCards";
import { OnePieceCard, OnePieceCardHistory, FilterValue } from "@/bh_lib/types";

export default function Page() {

  // #region -- resizable column layout
  const isDragging = useRef(false);
  const [leftWidth, setLeftWidth] = useState(70);

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
  const { cards: allCards, loading } = useCards();
  const [search, setSearch] = useState("");

  const [deck, setDeck] = useState<OnePieceCard[]>([]);
  const [previewCard, setPreviewCard] = useState<OnePieceCard | null>(null);

  const previewTarget = previewCard;

  const handleRightClick = (card: OnePieceCard) => {
    setPreviewCard((prev) => (prev?.id === card.id ? null : card));
    // console.log(history)
  };

  const [deckPrice, setDeckPrice] = useState<number>(0);
  const [costMap, setCostMap] = useState<Map<string, number>>(
    new Map([
    ['0',0],
    ['1',0],
    ['2',0],
    ['3',0],
    ['4',0],
    ['5',0],
    ['6',0],
    ['7',0],
    ['8',0],
    ['9',0],
    ['10',0],
    ])
  );
  const [rarityMap, setRarityMap] = useState<Map<string, number>>(
    new Map([
      ['L', 0],
      ['C', 0],
      ['UC', 0],
      ['R', 0],
      ['SR', 0],
      ['SEC', 0],
      ['PR', 0],
      ['TR', 0],
      ['DON', 0],
    ])
  );

  const [counterMap, setCounterMap] = useState<Map<string, number>>(
    new Map([
      ['0', 0],
      ['1000', 0],
      ['2000', 0]
    ])
  )

  // The active search string that actually filters cards
  const [activeSearch, setActiveSearch] = useState<string>("");

  const [filters, setFilters] = useState<Record<string, FilterValue>>({
    // colors: new Set(),
    // types: new Set(),
    // rarity: new Set(), etc
  });

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
    // const matchesID = card.card_id
    //   .toLowerCase()
    //   .includes(activeSearch.toLowerCase());

    // Read filter values into locals (so narrowing works reliably)
    const colorVal = filters.color;
    const typeVal = filters.type;
    const rarityVal = filters.rarity;
    const counterVal = filters.counter;
    const priceVal = filters.price;
    const powerVal = filters.power;

    // --- Check if any filters are active ---
    // const hasAnyFilters = Object.values(filters).some((value) => {
    //   if (value instanceof Set) return value.size > 0;
    //   if (Array.isArray(value)) return value.length === 2; // a range is active
    //   return false;
    // });

    // if (!hasAnyFilters) return false;

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
      matchesName
      // && matchesID
    );
  }).sort((a, b) => {
    // --- 1️⃣ Sort by color first ---
    const colorA = a.color?.toLowerCase() || "";
    const colorB = b.color?.toLowerCase() || "";

    if (colorA < colorB) return -1;
    if (colorA > colorB) return 1;

    // --- 2️⃣ If colors are equal, sort by cost ---
    const costA = a.cost ?? Infinity; // handle undefined
    const costB = b.cost ?? Infinity;

    return costA - costB;
  });

  useEffect(() => {
    console.log("Filtered Cards: ", filteredCards.length)
  }, [filteredCards]);

  useEffect(() => {
    console.log("Filters updated:", filters);
  }, [filters]);


  // Filter using the active search (only updated on Filter/Enter)
  // const filteredCards = allCards.filter((card: OnePieceCard) => {
  //   const matchesSearch = card.name.toLowerCase().includes(activeSearch.toLowerCase());

  //   const hasAnyFilters = Object.values(filters).some(set => set.size > 0);
  //   if (!hasAnyFilters) return false;

  //   const matchesColor =
  //   filters.colors.size > 0 && card.color
  //     ? card.color
  //         .split("/")
  //         .map(c => c.trim())
  //         .some(c => filters.colors.has(c))
  //     : false;

  //   const matchesType =
  //     filters.types.size > 0 && card.card_type
  //       ? filters.types.has(card.card_type)
  //       : false;

  //   // --- Special logic ---
  //   // If card has no color (like DON!!), ignore color and only check type
  //   if (!card.color) {
  //     return matchesType;
  //   }

  //   // If card has a color and also has a type that’s being filtered,
  //   // require BOTH to match (e.g. "red leaders only")
  //   if (filters.colors.size > 0 && filters.types.size > 0) {
  //     return matchesColor && matchesType && matchesSearch;
  //   }

  //   // Otherwise fall back to OR logic
  //   return (matchesColor || matchesType) && matchesSearch;
  // });

  // #endregion
  
  // #region Actions
  const addToDeck = (card: OnePieceCard) => {
    const count = deck.filter(c => c.product_id === card.product_id).length;

    if (count < 4) {
      setDeck([...deck, card]);
      setDeckPrice(prev => 
        Math.round((prev + Number(card.market_price)) * 100) / 100
      );
      setCostMap(prev => {
        const newMap = new Map(prev);
        const key = String(card.cost ?? "0"); // normalize nulls
        newMap.set(key, (newMap.get(key) ?? 0) + 1);
        return newMap;
      })
      setCounterMap(prev => {
        const newMap = new Map(prev);
        const key = String(card.counter ?? "0");
        newMap.set(key, (newMap.get(key) ?? 0) + 1);
        return newMap;
      })
      setRarityMap(prev => {
        const newMap = new Map(prev);
        const key = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0"); // normalize nulls
        newMap.set(key, (newMap.get(key) ?? 0) + 1);
        return newMap;
      });
    } else {
      console.warn(`${card.name} is already at the max of 4 copies.`);
    }
  };
  
  const removeFromDeck = (card: OnePieceCard) => {
    setDeck(deck => deck.filter((c, idx) => !(c.id === card.id && idx === deck.findLastIndex(d => d.id === card.id))));
    setDeckPrice(prev => 
      Math.round((prev - Number(card.market_price)) * 100) / 100
    );
    setCostMap(prev => {
      const newMap = new Map(prev);
      const key = String(card.cost ?? "0");
      const current = newMap.get(key) ?? 0;
      newMap.set(key, Math.max(0, current - 1)); // avoid negatives
      return newMap;
    });
    setCounterMap(prev => {
      const newMap = new Map(prev);
      const key = String(card.counter ?? "0");
      const current = newMap.get(key) ?? 0;
      newMap.set(key, Math.max(0, current - 1)); // avoid negatives
      return newMap;
    });
    setRarityMap(prev => {
      const newMap = new Map(prev);
      const key = card.rarity === "DON!!" ? "DON" : String(card.rarity ?? "0"); // normalize nulls
      const current = newMap.get(key) ?? 0;
      newMap.set(key, Math.max(0, current - 1)); // avoid negatives
      return newMap;
    });
  };

  const clearDeck = () => {
    setDeck([])
    setDeckPrice(0)
    setCostMap(new Map([
      ['0',0],
      ['1',0],
      ['2',0],
      ['3',0],
      ['4',0],
      ['5',0],
      ['6',0],
      ['7',0],
      ['8',0],
      ['9',0],
      ['10',0],
    ]))
    setCounterMap(new Map([
      ['0', 0],
      ['1000', 0],
      ['2000', 0]
    ]))
    setRarityMap(new Map([
      ['L', 0],
      ['C', 0],
      ['UC', 0],
      ['R', 0],
      ['SR', 0],
      ['SEC', 0],
      ['PR', 0],
      ['TR', 0],
      ['DON', 0],
    ]))
  }

  const costData = useMemo(() => {
    return Array.from(costMap.entries())
      .map(([cost, count]) => ({ cost, count }))
      .sort(
        (a, b) =>
          (a.cost === "none" ? 999 : +a.cost) -
          (b.cost === "none" ? 999 : +b.cost)
      );
  }, [costMap]);

  const rarityData = useMemo(() => {
    return Array.from(rarityMap.entries())
      .map(([rarity, count]) => ({ rarity, count }))
      .sort(
        (a, b) =>
          (a.rarity === "none" ? 999 : +a.rarity) -
          (b.rarity === "none" ? 999 : +b.rarity)
      );
  }, [rarityMap]);

  const counterData = useMemo(() => {
    return Array.from(counterMap.entries())
    .map(([counter, count]) => ({counter, count }))
    .sort(
      (a,b) =>
        (a.counter === "none" ? 999 : +a.counter) -
        (b.counter === "none" ? 999 : +b.counter)
    )
  }, [counterMap])
  // #endregion

  if (loading) return <p>Loading cards…</p>;

  return (
      <div className="h-full px-10 py-6 flex flex-1 gap-4 overflow-auto">
        {/* Left Column (Active Deck + Available Cards) */}
        <div className="flex flex-col gap-4"
        style={{ width: `${leftWidth}%` }}>
          {/* #1 Active Deck */}
          <ActiveDeck
            deck={deck}
            onClear={clearDeck}
            onRemove={removeFromDeck}
            onRightClick={handleRightClick}
          />
          {/* #2 Available Cards + Filters */}
          <CardList
            allCards={filteredCards}
            deck={deck}
            search={activeSearch}
            setSearch={setActiveSearch}
            filters={filters}
            updateFilter={updateFilter}
            onAdd={addToDeck}
            onRightClick={handleRightClick}
          />
        </div>

        {/* Divider */}
        <div
          className="w-2 cursor-col-resize bg-gray-300 hover:bg-gray-400"
          onMouseDown={handleMouseDown}
        />

        {/* Right Column (#3 Card/Deck Details) */}
        <div className="flex-[3] flex min-w-[420px]"
        style={{ width: `${100 - leftWidth}%` }}>
          <DetailsPanel
            onCloseModal={handleRightClick}
            card={previewTarget}
            deck={deck}
            deckPrice={deckPrice}
            costData={costData}
            counterData={counterData}
            rarityData={rarityData}
          />
        </div>
      </div>
  );
}
