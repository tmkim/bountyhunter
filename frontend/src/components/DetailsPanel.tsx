"use client";
import { OnePieceCard } from "@/lib/types";
import Image from "next/image";

type Props = {
  card: OnePieceCard | null;
  deck: OnePieceCard[];
};

export default function ActiveDeck({ card, deck }: Props) {
    return (
        <section className="flex-1 flex flex-col row-span-2 rounded-lg bg-lapis shadow p-4">
            <h2 className="mb-2 font-semibold text-tangerine">Details</h2>
            {/* Details view content */}
            <div className="flex-1 rounded-lg bg-maya shadow p-4">
            {/* Top half: selected image */}
            {/* </div><div className="h-[630px] flex-1 flex items-center justify-center"> */}
            <div className="relative aspect-[2/3] items-center justify-center flex-1 flex">
                {card ? (
                <Image
                    src={card.image_url || ""}
                    alt={card.name}
                    fill
                    // className="max-h-full max-w-full"
                    loading="lazy"    // optional (Next does this automatically)
                    unoptimized // optional to skip Next’s proxy and just get lazy loading
                />
                ) : (
                <span className="text-2xl text-black">Hover card to preview</span>
                )}
            </div>

            {/* Bottom half: split card/deck details */}
            <div className="flex flex-1 border rounded p-2 mt-4">
                <div className="flex-1 border rounded p-2 mt-2">
                    <h2 className="font-bold mb-2">Card Details</h2>
                    {card ? (
                        <div>
                            <p> {card.rarity} - {card.name}</p>
                            <p> {card.market_price} </p>
                            <p> {card.description} </p>
                        </div>
                    ):(
                        <span className="text-2xl text-black">Hover card to preview</span>
                    )
                    }
                </div>

                <div className="flex-1 border rounded p-2 mt-2">
                    <h2 className="font-bold mb-2">Deck Details</h2>
                    <p>Total cards: {deck.length}</p>
                    <p>Total cost: {deck.length}</p>
                    <p>Cost Distribution: {deck.length}</p>
                    <p>Rarity Distribution: {deck.length}</p>
                </div>
            </div>
            </div>
        </section>
    );
}