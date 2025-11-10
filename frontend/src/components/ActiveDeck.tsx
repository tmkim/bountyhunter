"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { OnePieceCard, OnePieceDeck } from "@/bh_lib/types";

type Props = {
  deck: OnePieceDeck;
  onRename: (name: string) => void;
  onClear: () => void;
  onSave: () => void;
  onRemove: (card: OnePieceCard) => void;
  onRightClick: (c: OnePieceCard) => void;
  onLoadDeck: (deck: OnePieceDeck) => void;  // ✅ new: trigger load through deck manager
};

type GroupedDeck = {
  card: OnePieceCard;
  count: number;
};

/** Group stacked cards */
function groupDeck(cards: OnePieceCard[]): GroupedDeck[] {
  const map = new Map<string, GroupedDeck>();
  for (const card of cards) {
    const key = String(card.product_id);
    if (!map.has(key)) map.set(key, { card, count: 0 });
    map.get(key)!.count += 1;
  }
  return Array.from(map.values());
}

export default function ActiveDeck({
  deck,
  onRename,
  onClear,
  onSave,
  onRemove,
  onRightClick,
  onLoadDeck,
}: Props) {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(deck.name || "");

  const [deckList, setDeckList] = useState<OnePieceDeck[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [deckHovered, setDeckHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  /** When user finishes renaming */
  const handleBlur = () => {
    setIsEditing(false);
    onRename(tempName.trim() || "Untitled Deck");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setTempName(deck.name);
      setIsEditing(false);
    }
  };

  /** Fetch list of user's saved decks */
  const fetchDecks = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bounty_api/onepiece_deck/`,
        { method: "GET", credentials: "include" }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDeckList(data);
    } catch (err) {
      toast.error("Error loading decks");
    }
  };

  /** Load deck (delegate to deck manager) */
  const handleSelectDeck = async (newDeck: OnePieceDeck) => {
    onLoadDeck(newDeck);
    setShowDropdown(false);
    toast.success(`Loaded "${newDeck.name}"`);
  };

  return (
    <section className="basis-[35%] flex flex-col rounded-lg 
    overflow-auto bg-lapis shadow p-4 min-h-[350px]">

      <div className="relative mb-2 flex items-center justify-between px-4 py-2 
      bg-charcoal rounded-md shadow-sm">

        {/* Load Button & Dropdown */}
        <div className="flex items-center relative">
          <button
            disabled={!user}
            onClick={() => {
              if (!user) return;
              if (!showDropdown) fetchDecks();
              setShowDropdown((prev) => !prev);
            }}
            className={`px-3 py-1 rounded border ${user
              ? "border-tangerine text-tangerine hover:bg-tangerine/10"
              : "border-white text-white cursor-not-allowed"
              } transition`}
          >
            {user ? "Load Deck ▼" : "Log in to save/load decks"}
          </button>

          {showDropdown && (
            <div>
              <ul
                className="absolute left-0 top-full mt-1 w-69 bg-charcoal border border-tangerine 
                rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
              >
                {deckList.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-white/70">
                    No decks found
                  </li>
                ) : (
                  deckList.map((d) => (
                    <li
                      key={d.id}
                      onClick={() => handleSelectDeck(d)}
                      onMouseEnter={() =>
                        setDeckHovered(String(d.id))
                      }
                      onMouseLeave={() =>
                        setDeckHovered(null)
                      }
                      onMouseMove={(e) =>
                        setTooltipPos({
                          x: e.clientX,
                          y: e.clientY,
                        })
                      }
                      className="px-3 py-2 text-sm text-white bg-opbrown hover:bg-opbrown-700
                      cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {d.name} ({d.leader?.color}{" "}
                      {d.leader?.name})
                    </li>
                  ))
                )}
              </ul>

              {/* Hover Tooltip */}
              {deckHovered && (
                <div
                  className="fixed px-2 py-1 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none"
                  style={{
                    top: tooltipPos.y + 15,
                    left: tooltipPos.x + 15,
                    zIndex: 9999,
                  }}
                >
                  {(() => {
                    const d = deckList.find(
                      (x) => String(x.id) === deckHovered
                    );
                    return d
                      ? `${d.name} (${d.leader?.color ?? ""} ${d.leader?.name ?? ""})`
                      : "";
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deck Title (Editable) */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="border-b-2 border-tangerine bg-transparent text-lg 
                        font-bold text-tangerine focus:outline-none text-center"
            />
          ) : (
            <span
              className="cursor-pointer font-bold text-lg text-tangerine hover:opacity-80"
              onClick={() => setIsEditing(true)}
            >
              {deck.name || "Untitled Deck"}
            </span>
          )}
        </div>

        {/* Save / Clear Buttons */}
        <div className="flex items-center gap-2">
          <button
            disabled={!user}
            onClick={onSave}
            className={`px-3 py-1 font-medium rounded transition ${user
              ? "bg-rosso text-white hover:bg-rosso-700"
              : "bg-rosso-300 text-white cursor-not-allowed"
              }`}
          >
            Save
          </button>
          <div className="w-px bg-tangerine h-6 mx-2" />
          <button
            onClick={onClear}
            className="px-3 py-1 font-medium bg-rosso text-white rounded 
            hover:bg-rosso-700 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ---------------------------------------- */}
      {/* Deck Grid */}
      {/* ---------------------------------------- */}
      <div
        className={`flex-1 rounded-lg overflow-y-auto bg-maya shadow pt-4 pb-8 px-4 ${deck.cards.length === 0
          ? "flex items-center justify-center"
          : ""
          }`}
      >
        {deck.cards.length === 0 ? (
          <span className="text-2xl text-black text-center">
            Left-Click card to add to active deck
          </span>
        ) : (
          <div
            className="grid gap-x-2 gap-y-6
            grid-cols-[repeat(auto-fill,minmax(90px,1fr))]
            md:grid-cols-[repeat(auto-fill,minmax(110px,1fr))]
            lg:grid-cols-[repeat(auto-fill,minmax(130px,1fr))]
            xl:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]"
          >
            {groupDeck(deck.cards).map(({ card, count }) => {
              const stagger = 3;

              return (
                <div
                  key={card.product_id}
                  className="relative cursor-pointer
                  w-[90px] md:w-[110px] lg:w-[130px]
                  h-[135px] md:h-[165px] lg:h-[195px]"
                  onClick={() => onRemove(card)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onRightClick(card);
                  }}
                >
                  {count > 1 && (
                    <span
                      className="absolute -top-3 left-0 bg-black text-white text-xs px-1 rounded"
                      style={{ zIndex: count + 1 }}
                    >
                      ×{count}
                    </span>
                  )}

                  {Array.from({ length: count }).map(
                    (_, i) => (
                      <Image
                        key={i}
                        src={card.image_url || ""}
                        alt={card.name}
                        fill
                        className="absolute rounded hover:ring-2 hover:ring-rosso"
                        style={{
                          top: `${i * stagger}px`,
                          left: `${i * stagger}px`,
                          zIndex: i,
                        }}
                        loading="lazy"
                        unoptimized
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
