"use client";
import { OnePieceCard } from "@/lib/types";
import Image from "next/image";

type Props = {
  deck: OnePieceCard[];
  onRemove: (card: OnePieceCard) => void;
  onHover: (card: OnePieceCard | null) => void;
};
type GroupedDeck = {
  card: OnePieceCard;
  count: number;
};

function groupDeck(deck: OnePieceCard[]): GroupedDeck[] {
  const map = new Map<string, GroupedDeck>();
  for (const card of deck) {
    const key = card.product_id.toString(); // or some unique ID
    if (!map.has(key)) {
      map.set(key, { card, count: 0 });
    }
    map.get(key)!.count += 1;
  }
  return Array.from(map.values());
}

export default function ActiveDeck({ deck, onRemove, onHover }: Props) {
    return (
        <section className="basis-[35%] flex flex-col rounded-lg 
                            overflow-x bg-lapis shadow p-4">
            <h2 className="mb-2 font-bold text-tangerine">Active Deck</h2>
                <div className="flex-1 rounded-lg overflow-auto bg-maya shadow p-4">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-2 gap-y-4">
                        {groupDeck(deck).map(({ card, count }) => {
                            const cardWidth = 150;
                            const cardHeight = 210;
                            const stagger = 3; // px offset between stacked cards
                            const totalHeight = cardHeight + stagger * (count - 1);

                            return (
                            <div
                                key={card.product_id}
                                className="relative cursor-pointer"
                                style={{ width: cardWidth, height: totalHeight }}
                                onClick={() => onRemove(card)}
                                onMouseEnter={() => onHover(card)}
                                onMouseLeave={() => onHover(null)}
                            >
                                {/* Floating badge above top-right */}
                                {count > 1 && (
                                <span
                                    className="absolute bg-black text-white text-xs px-1 rounded"
                                    style={{
                                    top: "-12px",   // float above
                                    right: "0px",   // align with right edge
                                    zIndex: totalHeight + 1,
                                    }}
                                >
                                    ×{count}
                                </span>
                                )}
                                {Array.from({ length: count }).map((_, i) => (
                                <Image
                                    key={i}
                                    src={card.image_url || ""}
                                    alt={card.name}
                                    width={cardWidth}
                                    height={cardHeight}
                                    className="absolute rounded hover:ring-2 hover:ring-green-400"
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
                </div>
        </section>
    );
}
