"use client";
import { OnePieceCard } from "@/lib/types";
import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

type Props = {
  card: OnePieceCard | null;
  deck: OnePieceCard[];
};

export default function ActiveDeck({ card, deck }: Props) {
    const cost_map = new Map<string, number>()
    const rarity_map = new Map<string, number>()

    let deck_price = 0
    for (const card of deck){
        // Calculate Deck Total Cost
        deck_price += card.market_price

        // Map Deck Cost Distribution
        if (card.cost != null) {
            cost_map.set(String(card.cost), (cost_map.get(String(card.cost)) ?? 0) + 1);
        }

        // Map Deck Rarity Distribution
        if (card.cost != null) {
            rarity_map.set(String(card.rarity), (rarity_map.get(String(card.rarity)) ?? 0) + 1);
        }
    }

    // Map Deck Cost Distribution
    const cost_data = Array.from(cost_map.entries()).map(([cost, count]) => ({
        cost,
        count,
    }));
    cost_data.sort((a, b) => (a.cost === "none" ? 999 : +a.cost) - (b.cost === "none" ? 999 : +b.cost));

    // Map Deck Rarity Distribution
    const rarity_data = Array.from(cost_map.entries()).map(([rarity, count]) => ({
        rarity,
        count,
    }));
    rarity_data.sort((a, b) => (a.rarity === "none" ? 999 : +a.rarity) - (b.rarity === "none" ? 999 : +b.rarity));

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
                            <p>Market Price: {card.market_price}</p>
                            <p>{card.color} {card.name}</p>
                            <p>Rarity: {card.rarity}</p>
                            <p>Foil: {card.foil_type}</p>
                            <p>{card.description}</p>
                        </div>
                    ):(
                        <span className="text-2xl text-black">Hover card to preview</span>
                    )
                    }
                </div>

                <div className="flex-1 border rounded p-2 mt-2">
                    <h2 className="font-bold mb-2">Deck Details</h2>
                    <p>Total cards: {deck.length}</p>
                    <p>Total cost: {deck_price}</p>
                    {/* <p>Cost Distribution: {cost_map}</p> */}
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <BarChart data={cost_data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="cost" label={{ value: "Cost", position: "insideBottom", offset: -5 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* <p>Rarity Distribution: {rarity_map}</p> */}
                    <div className="w-full h-64">
                        <ResponsiveContainer>
                            <BarChart data={rarity_data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="cost" label={{ value: "Cost", position: "insideBottom", offset: -5 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            </div>
        </section>
    );
}