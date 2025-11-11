"use client";
import { useEffect } from "react";

export function usePreloadImages(urls: string[]) {
  useEffect(() => {
    if (!urls || urls.length === 0) return;

    urls.forEach((url) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
      img.onerror = () => {
        img.src = "/CardFallback.png";
      };
    });
  }, [urls]);
}
