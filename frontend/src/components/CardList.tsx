"use client";
import { OnePieceCard } from "@/lib/types";
import { useState, useEffect } from "react";

type Props = {
  allCards: OnePieceCard[];
  deck: OnePieceCard[];
  search: string;
  setSearch: (value: string) => void;
  onAdd: (card: OnePieceCard) => void;
  onHover: (card: OnePieceCard) => void;
};

export default function CardList({ allCards, deck, search, setSearch, onAdd, onHover }: Props) {
    // draftSearch updates on every keystroke locally
    const [draftSearch, setDraftSearch] = useState<string>(search ?? "");

    // If parent search changes (e.g. reset from elsewhere), sync it into draft
    useEffect(() => {
        setDraftSearch(search ?? "");
    }, [search]);

    // Called when the user presses the Filter button or submits the form (Enter)
    const applySearch = () => {
        setSearch(draftSearch.trim());
    };

    return (
        <section className="basis-[65%] rounded-lg bg-lapis 
                            overflow-x-auto shadow p-4 flex flex-col">
            <h2 className="mb-2 font-semibold text-tangerine">Card List</h2>

            {/* 2a Filter + Search */}
            <form
                className="mb-4 flex items-center gap-2"
                onSubmit={(e) => {
                e.preventDefault();
                applySearch();
                }}
            >
                <input
                type="text"
                placeholder="Search cards..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                className="flex-grow bg-white text-black rounded border px-2 py-1"
                />
                <button
                type="submit"
                className="rounded bg-rosso text-white px-3 py-1 font-medium hover:text-maya"
                >
                Filter
                </button>
            </form>

            {/* Card pool goes here */}
            <div className="flex-1 rounded-lg overflow-auto bg-maya shadow p-4">
                <div className="grid grid-cols-4 gap-2">
                    {allCards.map((card) => (
                    <img
                        key={card.id}
                        src={card.tcgplayer_url || ''}
                        alt={card.name}
                        className="cursor-pointer rounded hover:ring-2 hover:ring-green-400"
                        onClick={() => onAdd(card)}
                        onMouseEnter={() => onHover(card)}
                    />
                    ))}
                </div>
            </div>
        </section>
    );
}