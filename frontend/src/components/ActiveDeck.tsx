"use client";
import { OnePieceCard } from "@/lib/types";
import Image from "next/image";

type Props = {
  deck: OnePieceCard[];
  onRemove: (card: OnePieceCard) => void;
  onHover: (card: OnePieceCard) => void;
};

export default function ActiveDeck({ deck, onRemove, onHover }: Props) {
    return (
        <section className="basis-[35%] flex flex-col rounded-lg 
                            overflow-x bg-lapis shadow p-4">
            <h2 className="mb-2 font-bold text-tangerine">Active Deck</h2>
                <div className="flex-1 rounded-lg overflow-auto bg-maya shadow p-4">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                        {deck.map((card,idx) => (
                            <Image
                                key={idx}
                                src={card.image_url || ""}
                                alt={card.name}
                                width={150}       // expected display width (px)
                                height={210}      // keep aspect ratio close to real card proportions
                                className="cursor-pointer rounded hover:ring-2 hover:ring-green-400"
                                onClick={() => onRemove(card)}
                                onMouseEnter={() => onHover(card)}
                                loading="lazy"    // optional (Next does this automatically)
                                unoptimized // optional to skip Next’s proxy and just get lazy loading
                            />
                        ))}
                    </div>
                </div>
            {/* Active deck cards go here */}
        </section>
    );
}
