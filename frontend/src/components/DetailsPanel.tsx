"use client";
import { Card } from "@/app/page";

type Props = {
  image: Card | null;
  deck: Card[];
};

export default function ActiveDeck({ image, deck }: Props) {
    return (
        <section className="flex-1 flex flex-col row-span-2 rounded-lg bg-lapis shadow p-4">
            <h2 className="mb-2 font-semibold text-tangerine">Details</h2>
            {/* Details view content */}
            <div className="flex-1 rounded-lg bg-maya shadow p-4">
            {/* Top half: selected image */}
            <div className="flex-1 flex items-center justify-center border rounded">
                {image ? (
                <img
                    src={image.imageUrl}
                    alt={image.name}
                    className="max-h-full max-w-full"
                />
                ) : (
                <span className="text-gray-400">Hover or select a card</span>
                )}
            </div>

            {/* Bottom half: deck details */}
            <div className="flex-1 border rounded p-2">
                <h2 className="font-bold mb-2">Deck Details</h2>
                <p>Total cards: {deck.length}</p>
                {/* Add stats or metadata here */}
            </div>
            </div>
        </section>
    );
}