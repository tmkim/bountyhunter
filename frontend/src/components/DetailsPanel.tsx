"use client";
import { OnePieceCard, HistoryData, OnePieceDeck } from "@/bh_lib/types";
import Image from "next/image";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, TooltipProps } from "recharts";
import PreviewCardModal from "@/components/PreviewCardModal";

type Props = {
  card: OnePieceCard | null;
  deck: OnePieceDeck;
  costData: { cost: string; count: number; }[]
  counterData: { counter: string; count: number; }[]
  rarityData: { rarity: string; count: number; }[]
  onCloseModal: (card: OnePieceCard) => void;
  // cardPriceHistoryData?: HistoryData[]
  // isLoading: boolean;
};

export default function DetailsPanel({ card, deck, costData, counterData, rarityData, onCloseModal
  //  cardPriceHistoryData, isLoading 
  }: Props) {

  const CustomCursor = (props: TooltipProps<any, any>["cursor"]) => {
    const { x, y, width, height } = props as any;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="#FFCE00"
        strokeWidth={4}
        fill="none"
        rx={6}
        ry={6}
      />
    );
  };

  return (
    <section className="flex-1 flex flex-col row-span-2 rounded-lg bg-lapis shadow p-4 min-h-[865px] overflow-x-auto">
      <h2 className="mb-2 font-semibold text-tangerine">Details</h2>
      {/* Details view content */}
      <div className="flex-1 rounded-lg bg-maya shadow p-4 max-h-full overflow-auto relative">
        {/* Top half: selected image */}
        {card && (
          <PreviewCardModal 
          onClose={() => onCloseModal(card)} 
          card={card}/>
        )
      }

        {/* Bottom half: selected image */}
        <div className="flex-1 rounded text-black">
          <h2 className="font-bold mb-2">Deck Details</h2>
          <p>Leader: {deck.leader?.color} {deck.leader?.name}</p>
          <p>Total cards: {deck.cards.length + (deck.leader ? 1 : 0)}</p>
          <p>Total price: ${deck.total_price.toFixed(2)}</p>
          <div className="w-full h-64 py-4">
            <ResponsiveContainer>
              <BarChart data={costData}
                margin={{ top: 0, right: 5, left: -30, bottom: 10 }}>
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

                <Tooltip
                  cursor={<CustomCursor />}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                  formatter={(value) => [`${Number(value)}`, "Count"]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full h-64 py-4">
            <ResponsiveContainer>
              <BarChart data={counterData}
                margin={{ top: 0, right: 5, left: -30, bottom: 10 }}>
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

                <Tooltip
                  cursor={<CustomCursor />}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                  formatter={(value) => [`${Number(value)}`, "Count"]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full h-64 py-2">
            <ResponsiveContainer>
              <BarChart data={rarityData}
                margin={{ top: 0, right: 5, left: -30, bottom: 10 }}>
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
                  activeBar={false}
                />

                <Tooltip
                  cursor={<CustomCursor />}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                  formatter={(value) => [`${Number(value)}`, "Count"]}
                />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}