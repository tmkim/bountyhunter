"use client";
import React from "react";

type ColorFilterProps = {
  colors: string[];
  activeColors: Set<string>;
  setActiveColors: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export default function ColorFilter({
  colors,
  activeColors,
  setActiveColors,
}: ColorFilterProps) {
  const toggleColor = (color: string) => {
    setActiveColors((prev) => {
      const next = new Set(prev);
      if (next.has(color)) {
        next.delete(color);
      } else {
        next.add(color);
      }
      return next;
    });
  };

  return (
    <div className="mb-4 flex gap-4">
      {colors.map((color) => (
        <label key={color} className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={activeColors.has(color)}
            onChange={() => toggleColor(color)}
          />
          <span className="capitalize">{color}</span>
        </label>
      ))}
    </div>
  );
}
