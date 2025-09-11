"use client";
import { Card } from "@/app/page";

type Props = {
  allCards: Card[];
  deck: Card[];
  onAdd: (card: Card) => void;
  onHover: (card: Card) => void;
};

export default function CardList({ allCards, deck, onAdd, onHover }: Props) {
    return (
        <section className="basis-[65%] rounded-lg bg-lapis 
                            overflow-x-auto shadow p-4 flex flex-col">
            <h2 className="mb-2 font-semibold text-tangerine">
                Card List
            </h2>
            {/* 2a Filter + Search */}
            <div className="mb-4 flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search cards..."
                    className="flex-grow bg-white text-black rounded border px-2 py-1"
                />
                <button className="rounded bg-rosso text-white px-3 py-1 font-medium">
                    Filter
                </button>
            </div>
            <div className="mb-4">
                Going to put some filter options here --
                some basic options and a modal for advanced filters
            </div>
            {/* Card pool goes here */}
            <div className="flex-1 rounded-lg overflow-auto bg-maya shadow p-4">
                <div className="grid grid-cols-4 gap-2">
                    {allCards.map((card) => (
                    <img
                        key={card.id}
                        src={card.imageUrl}
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