"use client";
import { OnePieceCard, FilterValue } from "@/bh_lib/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import ColorFilter from "./ColorFilter";
import CheckboxFilter from "./CheckboxFilter";
import RangeFilter from "./RangeFilter";

type Props = {
  allCards: OnePieceCard[];
  deck: OnePieceCard[];
  search: string;
  filters: Record<string, FilterValue>;
  setSearch: (value: string) => void;
//   updateFilter: (group: string, updater: (prev: Set<string>) => Set<string>) => void;
  updateFilter: (group: string, valueOrUpdater: FilterValue | ((prev: FilterValue | undefined) => FilterValue)) => void
  onAdd: (card: OnePieceCard) => void;
  onRightClick: (c: OnePieceCard) => void;   
};

export default function CardList({ allCards, deck, search, filters,
                        setSearch, updateFilter, onAdd, onRightClick }: Props) {

    // draftSearch updates on every keystroke locally
    const [draftSearch, setDraftSearch] = useState<string>(search ?? "");

    // If parent search changes (e.g. reset from elsewhere), sync it into draft
    useEffect(() => {
        setDraftSearch(search ?? "");
    }, [search]);

    // Called when the user presses the Filter button or submits the form (Enter)
    const applySearch = () => {
        setSearch(draftSearch.trim());
    };

    const [showMoreFilters, setShowMoreFilters] = useState(false);


    return (
        <section className="basis-[65%] rounded-lg bg-lapis min-h-[500px]
                            overflow-x-auto shadow p-4 flex flex-col">
            {/* <h2 className="mb-2 font-semibold text-tangerine">Card List</h2> */}
            <div className="flex items-center gap-6 overflow-x-auto pb-2">
                <div className="min-w-[436px]">
                    <CheckboxFilter
                        label="Color"
                        group="color"
                        options={["Red", "Green", "Blue", "Purple", "Black", "Yellow"]}
                        filters={filters}
                        updateFilter={updateFilter}
                    />
                </div>
                <div className="w-px bg-tangerine h-1/2 mx-2 flex-shrink-0" />
                <div className="min-w-[228px]">
                    <CheckboxFilter
                        label="Type"
                        group="type"
                        options={["DON!!", "Leader", "Stage"]}
                        filters={filters}
                        updateFilter={updateFilter}
                    />
                </div>
            </div>

            {showMoreFilters && (
            <div>
                <div className="flex gap-6 overflow-x-auto">
                    <div className="min-w-[228px]">
                        <CheckboxFilter
                            label="Rarity"
                            group="rarity"
                            options={["L", "C", "UC", "R", "SR", "SEC", "PR", "TR"]}
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
                <div className="flex gap-6 overflow-x-auto">
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
                className="mb-4 flex items-center gap-2"
                onSubmit={(e) => {
                e.preventDefault();
                applySearch();
                }}
            >
                <input
                    type="text"
                    placeholder="Search cards..."
                    value={draftSearch}
                    onChange={(e) => setDraftSearch(e.target.value)}
                    className="flex-grow bg-white text-black rounded border px-2 py-1"
                />
                <button
                    type="button"
                    onClick={() => setShowMoreFilters((prev) => !prev)}
                    className="rounded bg-rosso text-white px-3 py-1 font-medium 
                                hover:text-tangerine hover:cursor-pointer"
                    >
                    {showMoreFilters ? "Hide Filters" : "More Filters"}
                </button>

            </form>

            {/* Card pool goes here */}
            <div className="flex-1 rounded-lg overflow-auto bg-maya shadow p-4">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                    {allCards.map((card) => (
                        <div className="relative w-[150px] h-[210px]">
                            <Image
                            src={card.image_url || ""}
                            alt={card.name}
                            fill
                            sizes="150px"
                            style={{ objectFit: "contain" }}
                            className="cursor-pointer rounded hover:ring-2 hover:ring-green-400"
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
            </div>
        </section>
    );
}