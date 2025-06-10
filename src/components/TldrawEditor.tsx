"use client";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useState } from "react";

export default function TldrawEditor({
  isDarkMode,
  whiteboardId
}: {
  isDarkMode: boolean;
  whiteboardId: string;
  initialData: any;
  isReadOnly: boolean;
  onSave?: (content: any) => Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div style={{ position: "fixed", inset: 0, marginTop: "9rem" }}>
      <Tldraw inferDarkMode={isDarkMode} persistenceKey={whiteboardId} />
    </div>
  );
}
