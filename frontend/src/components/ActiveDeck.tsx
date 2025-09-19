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
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                        {groupDeck(deck).map(({ card, count }) => {
                            const cardWidth = 150;
                            const cardHeight = 210;
                            const stagger = 6; // px offset between stacked cards
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

                                {count > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black text-white text-xs px-1 rounded">
                                    ×{count}
                                </span>
                                )}
                            </div>
                            );
                        })}
                    </div>

                    {/* <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
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
                                onMouseLeave={() => onHover(null)}
                                loading="lazy"    // optional (Next does this automatically)
                                unoptimized // optional to skip Next’s proxy and just get lazy loading
                            />
                        ))}
                    </div> */}
                </div>
        </section>
    );
}
