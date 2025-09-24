"use client";
import React from "react";

type CheckboxFilterProps = {
  label: string;
  group: string;
  options: string[];
  filters: Record<string, Set<string>>;
  updateFilter: (group: string, updater: (prev: Set<string>) => Set<string>) => void;
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
    updateFilter(group, (prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  return (
    <div className="mb-4">
      <p className="font-semibold mb-2">{label}</p>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={active.has(option)}
              onChange={() => toggle(option)}
            />
            <span className="capitalize">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
