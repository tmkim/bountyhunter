"use client";
import { Card } from "@/app/page";

type Props = {
  deck: Card[];
  onRemove: (card: Card) => void;
  onHover: (card: Card) => void;
};

export default function ActiveDeck({ deck, onRemove, onHover }: Props) {
    return (
        <section className="basis-[35%] flex flex-col rounded-lg 
                            overflow-x bg-lapis shadow p-4">
            <h2 className="mb-2 font-bold text-tangerine">Active Deck</h2>
            <div className="flex-1 rounded-lg overflow-auto bg-maya shadow p-4">
                {deck.map((card,idx) => (
                    <img
                        key={`${card.id}-${idx}`}
                        src={card.imageUrl}
                        alt={card.name}
                        className="cursor-pointer rounded hover:ring-2 hover:ring-blue-400"
                        onClick={() => onRemove(card)}
                        onMouseEnter={() => onHover(card)}
                    />
                ))}
            </div>
            {/* Active deck cards go here */}
        </section>
    );
}
