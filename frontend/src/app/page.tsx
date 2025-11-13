"use client"
import ActiveDeck from "@/components/ActiveDeck";
import CardList from "@/components/CardList";
import DetailsPanel from "@/components/DetailsPanel";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useCards } from "@/hooks/useCards";
import { OnePieceCard, OnePieceCardHistory, FilterValue, Filters } from "@/bh_lib/types";
import { OnePieceDeck } from "@/bh_lib/types";
import { BASE_COST_MAP, BASE_RARITY_MAP, BASE_COUNTER_MAP } from "@/bh_lib/constants";
import { serialize } from "v8";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { restoreDeck } from "@/hooks/restoreDeck";
import { useDeck } from "@/hooks/useDeck";

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

// #region -- variable layout
const [leftWidth, setLeftWidth] = useState(60);
const [leftHeight, setLeftHeight] = useState(30);

// Refs to track which resizer is active
const isResizingWidth = useRef(false);
const isResizingHeight = useRef(false);

// Load from localStorage
useEffect(() => {
  const savedWidth = localStorage.getItem("leftPanelWidth");
  const savedHeight = localStorage.getItem("leftPanelHeight");
  if (savedWidth) setLeftWidth(parseFloat(savedWidth));
  if (savedHeight) setLeftHeight(parseFloat(savedHeight));
}, []);

// Save changes
useEffect(() => {
  localStorage.setItem("leftPanelWidth", leftWidth.toString());
}, [leftWidth]);
useEffect(() => {
  localStorage.setItem("leftPanelHeight", leftHeight.toString());
}, [leftHeight]);

// Mouse down handlers
const handleWidthMouseDown = () => {
  isResizingWidth.current = true;
  document.body.style.userSelect = "none";
  document.body.style.cursor = "row-resize"; 
};
const handleHeightMouseDown = () => {
  isResizingHeight.current = true;
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize"; 
};

// Global listeners
  useEffect(() => {
  const handleMouseUp = () => {
    isResizingWidth.current = false;
    isResizingHeight.current = false;
    document.body.style.userSelect = ""; // ✅ re-enable text selection
    document.body.style.cursor = "";
  };

  const handleMouseMove = (e: MouseEvent) => {
    // Resize width
    if (isResizingWidth.current) {
      const containerWidth = window.innerWidth;
      let newLeftWidth = (e.clientX / containerWidth) * 100;
      newLeftWidth = Math.max(20, Math.min(newLeftWidth, 80));
      setLeftWidth(newLeftWidth);
    }

    // Resize height
    if (isResizingHeight.current) {
      const containerHeight = window.innerHeight;
      let newLeftHeight = (e.clientY / containerHeight) * 100;
      newLeftHeight = Math.max(20, Math.min(newLeftHeight, 70));
      setLeftHeight(newLeftHeight);
    }
  };

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
  const {
    deck,
    newDeck,
    deleteDeck,
    addCard,
    removeCard,
    renameDeck,
    saveDeck,
    clearDeck,
    loadDeck,
    costData,
    rarityData,
    counterData
  } = useDeck();

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
    const matchesSubtype = 
      (card.subtype?.toLowerCase() || "")
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
      (matchesName || matchesID || matchesSubtype)
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

  const memoizedFilteredCards = useMemo(() => filteredCards, [filteredCards]);
  const memoizedFilters = useMemo(() => filters, [filters]);
  const memoizedUpdateFilter = useCallback(updateFilter, [updateFilter]);
  const memoizedClearAllFilters = useCallback(clearAllFilters, [clearAllFilters]);

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
        <div
          className="flex flex-col overflow-hidden" 
          style={{ height: `${leftHeight}%` }}
        >
            <ActiveDeck
              deck={deck}
              onNew={newDeck}
              onDelete={deleteDeck}
              onRename={renameDeck}
              onClear={clearDeck}
              onSave={saveDeck}
              onRemove={removeCard}
              onRightClick={handleRightClick}
              onLoadDeck={loadDeck}
            />
        </div>
        {/* Divider */}
        <div
        className="w-full h-1 flex-shrink-0 cursor-row-resize bg-gray-300 hover:bg-gray-400"
        onMouseDown={handleHeightMouseDown}
      />
      <div className="flex flex-col flex-1 overflow-hidden"
      >
          <CardList
  allCards={memoizedFilteredCards}
  search={activeSearch}
  setSearch={setActiveSearch}
  filters={memoizedFilters}
  clearFilter={memoizedClearAllFilters}
  updateFilter={memoizedUpdateFilter}
  onAdd={addCard}
  onRightClick={handleRightClick}
/>

      </div>
      </div>

      {/* Divider */}
      <div
        className="mx-5 flex-shrink-0 w-1 min-h-[865px]
                   cursor-col-resize bg-gray-300 hover:bg-gray-400"
        onMouseDown={handleWidthMouseDown}
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
