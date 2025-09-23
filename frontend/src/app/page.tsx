"use client"
import ActiveDeck from "@/components/ActiveDeck";
import CardList from "@/components/CardList";
import DetailsPanel from "@/components/DetailsPanel";
import {useState, useRef, useEffect, useMemo} from "react";
import { useCards } from "@/hooks/useCards";
import { OnePieceCard } from "@/lib/types";


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
  const [selectedCard, setSelectedCard] = useState<OnePieceCard | null>(null);

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

  // The active search string that actually filters cards
  const [activeSearch, setActiveSearch] = useState<string>("");

  // Filter using the active search (only updated on Filter/Enter)
  const filteredCards = allCards.filter((card) =>
    card.name.toLowerCase().includes(activeSearch.toLowerCase())
  );
  
  // Actions
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
      });
      setRarityMap(prev => {
        const newMap = new Map(prev);
        const key = String(card.rarity ?? "0"); // normalize nulls
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
    setRarityMap(prev => {
      const newMap = new Map(prev);
      const key = String(card.rarity ?? "0");
      const current = newMap.get(key) ?? 0;
      newMap.set(key, Math.max(0, current - 1)); // avoid negatives
      return newMap;
    });
  };

  const clearDeck = () => {
    setDeck([])
    setDeckPrice(0)
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
  // #endregion

  if (loading) return <p>Loading cards…</p>;

  return (
      <div className="h-full px-10 py-6 flex flex-1 gap-4">
        {/* Left Column (Active Deck + Available Cards) */}
        <div className="flex flex-col gap-4"
        style={{ width: `${leftWidth}%` }}>
          {/* #1 Active Deck */}
          <ActiveDeck
            deck={deck}
            onClear={clearDeck}
            onRemove={removeFromDeck}
            onHover={setSelectedCard}
          />
          {/* #2 Available Cards + Filters */}
          <CardList
            allCards={filteredCards}
            deck={deck}
            search={activeSearch}
            setSearch={setActiveSearch}
            onAdd={addToDeck}
            onHover={setSelectedCard}
          />
        </div>

        {/* Divider */}
        <div
          className="w-2 cursor-col-resize bg-gray-300 hover:bg-gray-400"
          onMouseDown={handleMouseDown}
        />

        {/* Right Column (#3 Card/Deck Details) */}
        <div className="flex-[3] flex"
        style={{ width: `${100 - leftWidth}%` }}>
          <DetailsPanel
            card={selectedCard}
            deck={deck}
            deckPrice={deckPrice}
            // costData={costData}
            costMap={costMap}
            rarityMap={rarityMap}
          />
        </div>
      </div>
  );
}
