"use client";
import { OnePieceCard, OnePieceDeck } from "@/bh_lib/types";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useState } from "react";

type Props = {
    deck: OnePieceDeck;
    deckList: String[];
    onRename: (name: string) => void;
    onClear: () => void;
    onSave: () => void;
    onRemove: (card: OnePieceCard) => void;
    onRightClick: (c: OnePieceCard) => void;
};
type GroupedDeck = {
    card: OnePieceCard;
    count: number;
};

function groupDeck(deck: OnePieceDeck): GroupedDeck[] {
    const map = new Map<string, GroupedDeck>();
    for (const card of deck.cards) {
        const key = card.product_id.toString(); // or some unique ID
        if (!map.has(key)) {
            map.set(key, { card, count: 0 });
        }
        map.get(key)!.count += 1;
    }
    return Array.from(map.values());
}

export default function ActiveDeck({ deck, deckList, onRename, 
    onRightClick, onClear, onSave, onRemove }: Props) {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(deck.name || "");

    const handleBlur = () => {
        setIsEditing(false);
        onRename(tempName.trim() || "Untitled Deck")
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur(); // trigger blur to save
        } else if (e.key === "Escape") {
            setTempName(deck.name); // revert changes
            setIsEditing(false);
        }
    };

    return (
        <section className="basis-[35%] flex flex-col rounded-lg 
                            overflow-auto bg-lapis shadow p-4 min-h-[350px]">
            <div className="relative mb-2 flex items-center justify-between px-4 py-2 bg-charcoal rounded-md shadow-sm">
                {/* Left: Dropdown */}
                <div className="flex items-center">
                    <button
                        disabled={!user}
                        className={`px-3 py-1 rounded border ${user
                                ? "border-tangerine text-tangerine hover:bg-tangerine/10"
                                : "border-white text-white cursor-not-allowed"
                            } transition`}
                    >
                        {user ? "Load Deck ▼" : "Log in to save/load decks"}
                    </button>
                </div>

                {/* Center: Editable Title */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    {isEditing ? (
                        <input
                            type="text"
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="border-b-2 border-tangerine bg-transparent text-lg font-bold text-tangerine focus:outline-none focus:border-orange-500 text-center"
                        />
                    ) : (
                        <span
                            className="cursor-pointer font-bold text-lg text-tangerine hover:opacity-80"
                            onClick={() => setIsEditing(true)}
                            title="Click to rename deck"
                        >
                            {deck.name || "Untitled Deck"}
                        </span>
                    )}
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        disabled={!user}
                        onClick={onSave}
                        className={`px-3 py-1 font-medium rounded transition ${user 
                            ? "bg-rosso text-white hover:bg-rosso-700 hover:cursor-pointer"
                            : "bg-rosso-300 text-white cursor-not-allowed"
                        }`}
                    >
                        Save
                    </button>
                    <div className="w-px bg-tangerine h-6 mx-2 flex-shrink-0" />
                    <button
                        onClick={onClear}
                        className="px-3 py-1 font-medium bg-rosso text-white rounded 
                        hover:bg-rosso-700 hover:cursor-pointer transition"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className={
                `flex-1 rounded-lg overflow-y-auto 
                bg-maya shadow pt-4 pb-8 px-4
                ${deck.cards.length === 0 ? "flex items-center justify-center" : ""}`
            }>
                {deck.cards.length > 0 ? (
                    <div className="grid gap-x-2 gap-y-6
                        grid-cols-[repeat(auto-fill,minmax(90px,1fr))]
                        md:grid-cols-[repeat(auto-fill,minmax(110px,1fr))]          
                        lg:grid-cols-[repeat(auto-fill,minmax(130px,1fr))]          
                        xl:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] 
                        ">
                        {groupDeck(deck).map(({ card, count }) => {
                            const stagger = 3; // px offset between stacked cards

                            return (
                                <div
                                    key={card.product_id}
                                    className="relative cursor-pointer
                                       w-[90px] md:w-[110px] lg:w-[130px] 
                                       h-[135px] md:h-[165px] lg:h-[195px] "
                                    onClick={() => onRemove(card)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();        // stop browser context menu
                                        onRightClick(card);        // call the prop
                                    }}
                                >
                                    {/* Floating badge above top-right */}
                                    {count > 1 && (
                                        <span
                                            className="absolute -top-3 left-0 bg-black text-white text-xs px-1 rounded"
                                            style={{ zIndex: count + 1 }}
                                        >
                                            ×{count}
                                        </span>
                                    )}
                                    {Array.from({ length: count }).map((_, i) => (
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
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <span className="text-2xl text-black text-center">
                        Left-Click card to add to active deck
                    </span>
                )
                }
            </div>
        </section>
    );
}
