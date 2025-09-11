"use client"
import ActiveDeck from "@/components/ActiveDeck";
import CardList from "@/components/CardList";
import DetailsPanel from "@/components/DetailsPanel";
import {useState, useRef, useEffect} from "react";

export default function Page() {

  // --- handle resizable column layout ---
  const isDragging = useRef(false);
  const [leftWidth, setLeftWidth] = useState(70);

  // Load from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem("leftPanelWidth");
    if (savedWidth) {
      setLeftWidth(parseFloat(savedWidth));
    }
  }, []);

  // Save to localStorage whenever leftWidth changes
  useEffect(() => {
    localStorage.setItem("leftPanelWidth", leftWidth.toString());
  }, [leftWidth]);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const containerWidth = window.innerWidth;
    let newLeftWidth = (e.clientX / containerWidth) * 100;

    // clamp values
    newLeftWidth = Math.max(20, Math.min(newLeftWidth, 80));
    setLeftWidth(newLeftWidth);
  };

  // Attach global listeners once
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  // --- handle resizable column layout ---

  return (
      <div className="h-full px-10 py-6 flex flex-1 gap-4">
        {/* Left Column (Active Deck + Available Cards) */}
        <div className="flex flex-col gap-4"
        style={{ width: `${leftWidth}%` }}>
          {/* #1 Active Deck */}
          <ActiveDeck />
          {/* #2 Available Cards + Filters */}
          <CardList />
        </div>

        {/* Divider */}
        <div
          className="w-2 cursor-col-resize bg-gray-300 hover:bg-gray-400"
          onMouseDown={handleMouseDown}
        />

        {/* Right Column (#3 Card/Deck Details) */}
        <div className="flex-[3] flex"
        style={{ width: `${100 - leftWidth}%` }}>
          <DetailsPanel/>
        </div>
      </div>
  );
}
