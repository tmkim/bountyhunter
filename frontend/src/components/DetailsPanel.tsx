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
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{card.name}</h2>
        <p className="text-sm text-gray-500">
          {card.color} • {card.rarity} • {card.foil_type}
        </p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-sm">
        <div>
          <p className="text-gray-500">Market Price</p>
          <p className="font-medium">${card.market_price ?? "N/A"}</p>
        </div>
        <div>
          <p className="text-gray-500">Power</p>
          <p className="font-medium">{card.power ?? "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">Cost</p>
          <p className="font-medium">{card.cost ?? "—"}</p>
        </div>
      </div>

      {/* Description */}
      {card.description && (
        <p className="text-gray-700 mb-6 text-sm leading-relaxed">{card.description}</p>
      )}

      {/* Chart */}
      <div className="bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-inner h-[320px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading price history...</div>
        ) : cardPriceHistoryData && cardPriceHistoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cardPriceHistoryData}
                       margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
            
              <defs>
                <linearGradient id="priceLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.1}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                scale="point"
                interval={2}
                tickFormatter={(d) => {
                    const date = new Date(d);
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // e.g. "Oct 8"
                }}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
                labelFormatter={(d) => new Date(d).toLocaleDateString()}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="url(#priceLine)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No price history available.
          </div>
        )}
      </div>
    </div>
                            // <div>
                            // <p>Market Price: {card.market_price}</p>
                            // <p>{card.color} {card.name}</p>
                            // <p>Rarity: {card.rarity}</p>
                            // <p>Foil: {card.foil_type}</p>
                            // <p>{card.description}</p>

                            // {isLoading ? (
                            //     <p>Loading price history...</p>
                            // ) : cardPriceHistoryData && cardPriceHistoryData.length > 0 ? (
                            //     <ResponsiveContainer width="100%" height={300}>
                            //     <LineChart data={cardPriceHistoryData}
                            //     margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                            //         <XAxis dataKey="date" />
                            //         <YAxis />
                            //         <Tooltip />
                            //         <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
                            //     </LineChart>
                            //     </ResponsiveContainer>
                            // ) : (
                            //     <p>No price history available.</p>
                            // )}
                            // </div>
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