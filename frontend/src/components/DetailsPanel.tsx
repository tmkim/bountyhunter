"use client";
import { OnePieceCard, HistoryData } from "@/bh_lib/types";
import Image from "next/image";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import PreviewCardModal from "@/components/PreviewCardModal";

type Props = {
  card: OnePieceCard | null;
  deck: OnePieceCard[];
  deckPrice: number;
  costData: { cost: string; count: number; }[]
  counterData: { counter: string; count: number; }[]
  rarityData: { rarity: string; count: number; }[]
  onCloseModal: (card: OnePieceCard) => void;
  // cardPriceHistoryData?: HistoryData[]
  // isLoading: boolean;
};

export default function DetailsPanel({ card, deck, deckPrice, costData, counterData, rarityData, onCloseModal
  //  cardPriceHistoryData, isLoading 
  }: Props) {

  return (
    <section className="flex-1 flex flex-col row-span-2 rounded-lg bg-lapis shadow p-4 min-w-[320px] min-h-[865px] overflow-x-auto">
      <h2 className="mb-2 font-semibold text-tangerine">Details</h2>
      {/* Details view content */}
      <div className="flex-1 rounded-lg bg-maya shadow p-4 max-h-full overflow-auto relative">
        {/* Top half: selected image */}
        <p className="text-2xl text-black text-center">
          Right-click a card to preview
        </p>
        {card && (
          <PreviewCardModal 
          onClose={() => onCloseModal(card)} 
          card={card}/>
        )
      }

        {/* Bottom half: selected image */}
        <div className="flex-1 border rounded p-2 mt-2 text-black">
          <h2 className="font-bold mb-2">Deck Details</h2>
          <p>Total cards: {deck.length}</p>
          <p>Total price: ${deckPrice.toFixed(2)}</p>
          <div className="w-full h-64 py-4">
            <ResponsiveContainer>
              <BarChart data={costData}
                margin={{ top: 0, right: 0, left: -30, bottom: 10 }}>
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
          <div className="w-full h-64 py-4">
            <ResponsiveContainer>
              <BarChart data={counterData}
                margin={{ top: 0, right: 0, left: -30, bottom: 10 }}>
                {/* Grid lines */}
                <CartesianGrid stroke="#ffffff22" strokeDasharray="3 3" />

                {/* X Axis */}
                <XAxis
                  dataKey="counter"
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
                margin={{ top: 0, right: 0, left: -30, bottom: 10 }}>
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
    </section>
  );
}