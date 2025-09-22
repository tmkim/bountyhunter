"use client"
import ActiveDeck from "@/components/ActiveDeck";
import CardList from "@/components/CardList";
import DetailsPanel from "@/components/DetailsPanel";
import {useState, useRef, useEffect} from "react";
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
    } else {
      console.warn(`${card.name} is already at the max of 4 copies.`);
    }
  };
  
  const removeFromDeck = (card: OnePieceCard) => {
    setDeck(deck => deck.filter((c, idx) => !(c.id === card.id && idx === deck.findLastIndex(d => d.id === card.id))));
  };

  const clearDeck = () => {
    setDeck([])
  }
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
            image={selectedCard}
            deck={deck} 
          />
        </div>
      </div>
  );
}
