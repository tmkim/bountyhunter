"use client";

import { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { FilterValue } from "@/bh_lib/types";

interface RangeFilterProps {
  label: string;
  group: string;
  min: number;
  max: number;
  step: number;
  filters: Record<string, any>;
  updateFilter: (
    group: string,
    valueOrUpdater:
      | FilterValue
      | ((prev: FilterValue | undefined) => FilterValue)
  ) => void;
}

export default function RangeFilter({
  label,
  group,
  min,
  max,
  step,
  filters,
  updateFilter,
}: RangeFilterProps) {
  const [range, setRange] = useState<[number, number]>([min, max]);

  // modeRef: null | "typing" | "spinning"
  const modeRef = useRef<null | "typing" | "spinning">(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with external filters (like reset)
  useEffect(() => {
    const filterValue = filters[group];
    if (Array.isArray(filterValue) && filterValue.length === 2) {
      setRange(filterValue as [number, number]);
    } else {
      setRange([min, max]);
    }
  }, [filters, group, min, max]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // SLIDER handlers
  const handleSliderChange = (newRange: [number, number]) => {
    setRange(newRange);
  };

  const handleSliderCommit = (newRange: [number, number]) => {
    // slider commit should always be immediate
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    modeRef.current = null;
    updateFilter(group, newRange);
  };

  // Shared commit helper
  const commitRangeNow = (r: [number, number]) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    modeRef.current = null;
    updateFilter(group, r);
  };

  // INPUT handlers
  const scheduleDebouncedCommit = (r: [number, number]) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      commitRangeNow(r);
    }, 420); // .420 second debounce
  };

  const handleInputChange = (index: 0 | 1, value: number) => {
    const clamped = Number.isNaN(value) ? (index === 0 ? min : max) : Math.min(Math.max(value, min), max);
    const newRange: [number, number] = index === 0 ? [clamped, range[1]] : [range[0], clamped];
    setRange(newRange);

    // if mode is spinning, debounce commit; if typing, do nothing
    if (modeRef.current === "spinning") {
      scheduleDebouncedCommit(newRange);
    }
    // if modeRef.current === "typing" => wait for Enter/blur
  };

  const handleInputBlur = () => {
    // commit any pending change immediately on blur
    commitRangeNow(range);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter => commit immediately
    if (e.key === "Enter") {
      commitRangeNow(range);
      return;
    }

    // Arrow keys => treat as spinning
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      modeRef.current = "spinning";
      return;
    }

    // For other key presses, treat as typing
    modeRef.current = "typing";
  };

  const handleInputMouseDown = () => {
    // clicking the spinner arrows uses pointer/mouse; treat as spinning
    modeRef.current = "spinning";
  };

  const handleInputTouchStart = () => {
    modeRef.current = "spinning";
  };

  return (
    <div className="mb-6 w-full max-w-md">
      <Label className="block mb-2 text-sm font-medium text-tangerine">
        {label}:{" "}
        {group === "price" ? (
          <>${range[0].toLocaleString()} – ${range[1] === max ? `${range[1].toLocaleString()}+` : range[1].toLocaleString()}</>
        ) : (
          <>{range[0].toLocaleString()} – {range[1].toLocaleString()}</>
        )}
      </Label>

      <Slider
        value={range}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        className="mt-2"
      />

      <div className="flex items-center justify-between mt-3 text-sm text-black">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          className="w-24 px-2 py-1 border rounded-md text-center bg-maya border-gray-600"
          value={range[0]}
          onChange={(e) => handleInputChange(0, Number(e.target.value))}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onMouseDown={handleInputMouseDown}
          onTouchStart={handleInputTouchStart}
        />
        <span className="text-tangerine">to</span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          className="w-24 px-2 py-1 border rounded-md text-center bg-maya border-gray-600"
          value={range[1]}
          onChange={(e) => handleInputChange(1, Number(e.target.value))}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onMouseDown={handleInputMouseDown}
          onTouchStart={handleInputTouchStart}
        />
      </div>
    </div>
  );
}
