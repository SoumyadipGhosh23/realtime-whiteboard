"use client";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useState } from "react";

export default function TldrawEditor({ isDarkMode }: { isDarkMode: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; 
  }

  return (
    <div style={{ position: "fixed", inset: 0, marginTop: "3.75rem" }} >
      <Tldraw inferDarkMode={isDarkMode} />
    </div>
  );
}
