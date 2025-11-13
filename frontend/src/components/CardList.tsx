"use client";
import { OnePieceCard, FilterValue, OnePieceDeck } from "@/bh_lib/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import CheckboxFilter from "./CheckboxFilter";
import RangeFilter from "./RangeFilter";
import { usePreparedCards } from "@/hooks/usePreparedCards";

type Props = {
  allCards: OnePieceCard[];
  search: string;
  filters: Record<string, FilterValue>;
  setSearch: (value: string) => void;
  clearFilter: () => void;
  updateFilter: (group: string, valueOrUpdater: FilterValue | ((prev: FilterValue | undefined) => FilterValue)) => void
  onAdd: (card: OnePieceCard) => void;
  onRightClick: (c: OnePieceCard) => void;
};

function getFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").pop() || "";
  } catch {
    return "";
  }
}

export default function CardList({ allCards, search, filters,
  setSearch, clearFilter, updateFilter, onAdd, onRightClick }: Props) {

  // draftSearch updates on every keystroke locally
  const [draftSearch, setDraftSearch] = useState<string>(search ?? "");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  // const preparedCards = usePreparedCards(allCards);
  const { processedCards, isLoading } = usePreparedCards(allCards);

  // If parent search changes (e.g. reset from elsewhere), sync it into draft
  useEffect(() => {
    setDraftSearch(search ?? "");
  }, [search]);

  // Called when the user presses the Filter button or submits the form (Enter)
  const applySearch = () => {
    setSearch(draftSearch.trim());
  };

  return (
    <section className="rounded-lg bg-lapis h-full
                            overflow-auto shadow p-4 flex flex-col">
      {/* <h2 className="mb-2 font-semibold text-tangerine">Card List</h2> */}
      <div className="flex items-center gap-6 overflow-x-auto pb-2">
        <div className="min-w-[436px]">
          <CheckboxFilter
            label="Color"
            group="color"
            options={["Black", "Blue", "Green", "Purple", "Red", "Yellow"]}
            filters={filters}
            updateFilter={updateFilter}
          />
        </div>
        <div className="w-px bg-tangerine h-1/2 mx-2 flex-shrink-0" />
        <div className="min-w-[492px]">
          <CheckboxFilter
            label="Type"
            group="type"
            options={["DON!!", "Leader", "Stage", "Character", "Event", "Packs"]}
            filters={filters}
            updateFilter={updateFilter}
          />
        </div>
      </div>

      {showMoreFilters && (
        <div className="overflow-x-auto">
          <div className="flex gap-6">
            <div className="min-w-[436px]">
              <CheckboxFilter
                label="Rarity"
                group="rarity"
                options={["C", "UC", "R", "SR", "SEC", "PR", "TR"]}
                filters={filters}
                updateFilter={updateFilter}
              />
            </div>
            <div className="w-px bg-tangerine h-1/2 mx-2 flex-shrink-0" />
            <div className="min-w-[228px]">
              <CheckboxFilter
                label="Counter"
                group="counter"
                options={["0", "1000", "2000"]}
                filters={filters}
                updateFilter={updateFilter}
              />
            </div>
          </div>
          <div className="flex gap-6">
            <div className="min-w-[228px]">
              <RangeFilter
                label="Power Range"
                group="power"
                min={0}
                max={12000}
                step={1000}
                filters={filters}
                updateFilter={updateFilter}
              />
            </div>
            <div className="min-w-[228px]">
              <RangeFilter
                label="Price Range"
                group="price"
                min={0}
                max={500}
                step={50}
                filters={filters}
                updateFilter={updateFilter}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2a Filter + Search */}
      <form
        className="flex gap-2 flex-shrink-0 py-4"
        onSubmit={(e) => {
          e.preventDefault();
          applySearch();
        }}
      >
        <input
          type="text"
          placeholder="Search cards by name or card id..."
          value={draftSearch}
          onChange={(e) => setDraftSearch(e.target.value)}
          className="flex-grow bg-white text-black rounded border px-2 py-1"
        />
        <button
          type="button"
          onClick={() => setShowMoreFilters((prev) => !prev)}
          className="rounded bg-rosso text-white px-3 py-1 font-medium 
                                hover:bg-rosso-700 hover:cursor-pointer min-w-[120px]"
        >
          {showMoreFilters ? "Hide Filters" : "More Filters"}
        </button>
        <button
          type="button"
          onClick={clearFilter}
          className="rounded bg-rosso text-white px-3 py-1 font-medium 
                                hover:bg-rosso-700 hover:cursor-pointer min-w-[120px]"
        >
          Clear Filters
        </button>

      </form>

      {/* Card pool goes here */}
      <div className="flex-1 rounded-lg overflow-auto bg-maya shadow p-4">
        {allCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-2xl">
            Right-click a card to preview
          </div>
        ) : isLoading ? (
          // Spinner while images are preloading
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-2xl font-semibold">Loading Cards</p>
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-rosso"></div>
              <p className="text-lg">Please wait while images load...</p>
            </div>
          </div>

        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {processedCards.map((card) => (
              <div key={card.id} className="relative w-[150px] h-[210px]">
                <Image
                  src={card.image_url || ""}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/cards/fallback.png";
                  }}
                  alt={card.name}
                  fill
                  sizes="150px"
                  style={{ objectFit: "contain" }}
                  className="cursor-pointer rounded hover:ring-2 hover:ring-rosso"
                  onClick={() => onAdd(card)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onRightClick(card);
                  }}
                  loading="lazy"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
      </div>


    </section>
  );
}