"use client";
import { OnePieceCard, HistoryData } from "@/bh_lib/types";
import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

type Props = {
  card: OnePieceCard | null;
  deck: OnePieceCard[];
  deckPrice: number;
  costData: {cost: string; count: number;}[]
  rarityData: {rarity: string; count: number;}[]
  cardPriceHistoryData?: HistoryData[]
  isLoading: boolean;
};

export default function ActiveDeck({ card, deck, deckPrice, costData, rarityData, cardPriceHistoryData, isLoading }: Props) {
    return (
        <section className="flex-1 flex flex-col row-span-2 rounded-lg bg-lapis shadow p-4">
            <h2 className="mb-2 font-semibold text-tangerine">Details</h2>
            {/* Details view content */}
            <div className="flex-1 rounded-lg bg-maya shadow p-4 max-h-full overflow-auto">
                {/* Top half: selected image */}
                <div className="relative max-h-1/2 aspect-[2/3] flex mx-auto">
                    <div className="flex w-full h-full items-center justify-center">
                        {card ? (
                        <Image
                            src={card.image_url || ""}
                            alt={card.name}
                            fill
                            className="object-contain"
                            loading="lazy"
                            unoptimized
                        />
                        ) : (
                        <span className="text-2xl text-black text-center">
                            Right-Click card to preview
                        </span>
                        )}
                    </div>
                </div>
                {/* Bottom half: split card/deck details */}
                <div className="flex-col flex-1 overflow-y-auto text-black">
                    <div className="flex-1 border rounded p-2 mt-2">
                        <h2 className="font-bold mb-2">Card Details</h2>
                        {card ? (
                            <div>
                                <p>Market Price: {card.market_price}</p>
                                <p>{card.color} {card.name}</p>
                                <p>Rarity: {card.rarity}</p>
                                <p>Foil: {card.foil_type}</p>
                                <p>{card.description}</p>
                                <ResponsiveContainer>
                                    {isLoading ? (
                                        <p>Loading price history...</p>
                                    ) : history && history.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={cardPriceHistoryData}>
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
                                        </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p>No price history available.</p>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        ):(
                            <span className="text-2xl text-black">Hover card to preview</span>
                        )
                        }
                    </div>

                    <div className="flex-1 border rounded p-2 mt-2">
                        <h2 className="font-bold mb-2">Deck Details</h2>
                        <p>Total cards: {deck.length}</p>
                        <p>Total cost: ${deckPrice.toFixed(2)}</p>
                        <div className="w-full h-64 py-2">
                            <ResponsiveContainer>
                                <BarChart data={costData}
                                margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                                    {/* Grid lines */}
                                    <CartesianGrid stroke="#ffffff22" strokeDasharray="3 3" />

                                    {/* X Axis */}
                                    <XAxis
                                    dataKey="cost"
                                    tick={{ fill: "black", fontSize: 12 }}
                                    label={{
                                        value: "Cost",
                                        position: "insideBottom",
                                        offset: -5,
                                        fill: "black",
                                        fontSize: 14,
                                    }}
                                    axisLine={{ stroke: "black" }}
                                    tickLine={{ stroke: "black" }}
                                    />

                                    {/* Y Axis */}
                                    <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: "black", fontSize: 12 }}
                                    axisLine={{ stroke: "black" }}
                                    tickLine={{ stroke: "black" }}
                                    />

                                    {/* Bars */}
                                    <Bar
                                    dataKey="count"
                                    fill="#D70000"
                                    radius={[6, 6, 0, 0]} // rounded tops
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full h-64 py-2">
                            <ResponsiveContainer>
                                <BarChart data={rarityData}
                                margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                                    {/* Grid lines */}
                                    <CartesianGrid stroke="#ffffff22" strokeDasharray="3 3" />

                                    {/* X Axis */}
                                    <XAxis
                                    dataKey="rarity"
                                    tick={{ fill: "black", fontSize: 12 }}
                                    label={{
                                        value: "Rarity",
                                        position: "insideBottom",
                                        offset: -5,
                                        fill: "black",
                                        fontSize: 14,
                                    }}
                                    axisLine={{ stroke: "black" }}
                                    tickLine={{ stroke: "black" }}
                                    />

                                    {/* Y Axis */}
                                    <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: "black", fontSize: 12 }}
                                    axisLine={{ stroke: "black" }}
                                    tickLine={{ stroke: "black" }}
                                    />

                                    {/* Bars */}
                                    <Bar
                                    dataKey="count"
                                    fill="#D70000"
                                    radius={[6, 6, 0, 0]} // rounded tops
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}