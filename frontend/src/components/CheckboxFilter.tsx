"use client";
import { FilterValue } from "@/bh_lib/types";
import React from "react";

type CheckboxFilterProps = {
  label: string;
  group: string;
  options: string[];
  filters: Record<string, FilterValue>;
  updateFilter: (
    group: string, 
    valueOrUpdater: 
      FilterValue | 
      ((prev: FilterValue | undefined) => FilterValue)
  ) => void
};

export default function CheckboxFilter({
  label,
  group,
  options,
  filters,
  updateFilter,
}: CheckboxFilterProps) {

  const active = filters[group] ?? new Set();

  const toggle = (value: string) => {
    updateFilter(group, (prev: any) => {
      const set = prev instanceof Set ? new Set(prev) : new Set<string>();
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return set;
    });
  };

  return (
    <div className="mb-4">
      <p className="font-semibold mb-2 text-tangerine">{label}</p>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={active instanceof Set && active.has(option)}
              onChange={() => toggle(option)}
            />
            <span className="capitalize text-white">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
