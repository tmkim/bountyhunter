import React from 'react';
import { HistoryData, OnePieceCard } from '@/bh_lib/types';
import Image from "next/image";
import { XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";
import { useCardHistory } from "@/hooks/useCardHistory";
import DOMPurify from "dompurify";
import Link from 'next/link';

interface PreviewCardModalProps {
  onClose: () => void;
  card: OnePieceCard | null;
}

const PreviewCardModal: React.FC<PreviewCardModalProps> = ({ card, onClose }) => {
  const { priceHistory, isLoading } = useCardHistory(card?.id);
  const prices = priceHistory?.map(p => p.price) ?? [];
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  const info = [
    { label: "Card ID", value: card?.card_id },
    { label: "Color", value: card?.color },
    { label: "Type", value: card?.card_type },
    { label: "Subtype", value: card?.subtype },
    { label: "Rarity", value: card?.rarity },
    { label: "Foil", value: card?.foil_type },
    { label: "Counter", value: card?.counter }
  ].filter(d => d.value && d.value !== "<NA>");
  
  const chunkSize = 3;
  const infoChunks = [];
  for (let i = 0; i < info.length; i += chunkSize) {
    infoChunks.push(info.slice(i, i + chunkSize));
  }

  const getLeftMargin = (data: HistoryData[]) => {
    if (!data || data.length === 0) return 30;
    const maxPrice = Math.max(...data.map((d) => d.price));
    const digitCount = maxPrice.toFixed(2).length;
    return (digitCount * 3) - 10;
  };

  return (
    <div
      className="absolute inset-0 z-10 flex justify-center items-center"
      style={{ backgroundColor: 'rgba(31, 41, 55, 0.7)' }}
    >
      {/* Modal container */}
      <div className="flex flex-col items-center bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-3xl max-h-[90%] overflow-y-auto relative">
        
        {/* Close button (optional) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          ×
        </button>

        {/* Card image */}
        <div className="relative w-[70%] aspect-[2/3] mb-4">
          {card ? (
            <Image
              src={card.image_url || ""}
              onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/CardFallback.png";
              }}
              alt={card.name}
              fill
              className="object-contain rounded-md shadow-md"
              loading="lazy"
              unoptimized
            />
          ) : (
            <span className="text-2xl text-gray-700 text-center">
              Right-click a card to preview
            </span>
          )}
        </div>

        {/* Card details */}
        <div className="w-full flex flex-col text-black bg-white rounded-lg border border-gray-200 p-4 shadow-inner">
          {card ? (
            <>
              {/* Header */}
              <div className="mb-4 text-center">
                <Link href={card.tcgplayer_url || ""} className="text-2xl font-semibold">{card.name}</Link>
                {infoChunks.map((chunk, i) => (
                  <p key={i} className="text-sm">
                    {chunk.map(d => d.value).join(" • ")}
                  </p>
                ))}
              </div>

              {/* Description */}
              {card.description && (
                <p
                  className="mb-6 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(card.description) }}
                />
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-sm text-center">
                <div>
                  <p className="text-black">Market Price</p>
                  <p className="font-medium">${card.market_price ?? "—"}</p>
                </div>
                <div>
                  <p className="text-black">1 Month Low</p>
                  <p className="font-medium">${minPrice?.toFixed(2) ?? "—"}</p>
                </div>
                <div>
                  <p className="text-black">1 Month High</p>
                  <p className="font-medium">${maxPrice?.toFixed(2) ?? "—"}</p>
                </div>
              </div>


              {/* Chart */}
              <div className="bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-inner h-[320px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">Loading price history...</div>
                ) : priceHistory && priceHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={priceHistory}
                      margin={{ top: 10, right: 10, left: getLeftMargin(priceHistory), bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        scale="point"
                        // interval={2}
                        tickFormatter={(d) => {
                          const date = new Date(d);
                          return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
                        }}
                        tick={{ fill: "#000", fontSize: 14 }}
                        ticks={priceHistory
                              .map(d => d.date)
                              .filter((_, i) => i % Math.ceil(priceHistory.length / 7) === 0)
                            }
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        padding={{ top: 10, bottom: 10 }}
                        tick={{ fill: "#000", fontSize: 14 }}
                        tickFormatter={(val) => "$" + val.toFixed(2)}
                        tickMargin={5}
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
                        // stroke="url(#priceLine)"
                        strokeWidth={3}
                        dot={true}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No price history available.
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-2xl text-black text-center">Right-click card to preview</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewCardModal;
