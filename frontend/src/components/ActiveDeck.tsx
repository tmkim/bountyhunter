"use client";
import { OnePieceCard, OnePieceDeck } from "@/bh_lib/types";
import Image from "next/image";

type Props = {
  deck: OnePieceDeck;
  onClear: () => void;
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

export default function ActiveDeck({ deck, onRightClick, onClear, onRemove }: Props) {
    return (
        <section className="basis-[35%] flex flex-col rounded-lg 
                            overflow-auto bg-lapis shadow p-4 min-h-[350px]">
            <div className="mb-2 flex items-center justify-between">
                <button
                    // onClick={onClear}
                    className="px-2 py-1 font-medium bg-rosso text-white rounded 
                    hover:text-tangerine hover:cursor-pointer"
                >
                    Save
                </button>
                
                <span className="font-bold text-lg text-tangerine">Active Deck</span>
                
                <button
                    onClick={onClear}
                    className="px-2 py-1 font-medium bg-rosso text-white rounded 
                    hover:text-tangerine hover:cursor-pointer"
                >
                    Clear
                </button>
            </div>
            <div className={
                `flex-1 rounded-lg overflow-y-auto 
                bg-maya shadow pt-4 pb-8 px-4
                ${deck.cards.length === 0 ? "flex items-center justify-center" : ""}`
            }>
                {deck.cards.length>0 ? (
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
                    ):(
                        <span className="text-2xl text-black text-center">
                            Left-Click card to add to active deck
                        </span>
                    )
                }
            </div>
        </section>
    );
}
