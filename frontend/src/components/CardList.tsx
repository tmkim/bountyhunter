"use client";
import { OnePieceCard } from "@/lib/types";
import { useState, useEffect } from "react";
import Image from "next/image";

type Props = {
  allCards: OnePieceCard[];
  deck: OnePieceCard[];
  search: string;
  setSearch: (value: string) => void;
  onAdd: (card: OnePieceCard) => void;
  onHover: (card: OnePieceCard | null) => void;
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
                    className="rounded bg-rosso text-white px-3 py-1 font-medium 
                    hover:text-tangerine hover:cursor-pointer"
                >
                    Filter
                </button>
            </form>

            {/* Card pool goes here */}
            <div className="flex-1 rounded-lg overflow-auto bg-maya shadow p-4">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                    {allCards.map((card) => (
                    <Image
                        key={card.id}
                        src={card.image_url || ""}
                        alt={card.name}
                        width={150}       // expected display width (px)
                        height={210}      // keep aspect ratio close to real card proportions
                        className="cursor-pointer rounded hover:ring-2 hover:ring-green-400"
                        onClick={() => onAdd(card)}
                        onMouseEnter={() => onHover(card)}
                        onMouseLeave={() => onHover(null)}
                        loading="lazy"    // optional (Next does this automatically)
                        unoptimized // optional to skip Next’s proxy and just get lazy loading
                    />
                    ))}
                </div>
            </div>
        </section>
    );
}