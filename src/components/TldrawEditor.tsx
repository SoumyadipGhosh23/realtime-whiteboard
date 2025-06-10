"use client";
import { getSnapshot, Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

export default function TldrawEditor({
  isDarkMode,
  whiteboardId,
  isReadOnly,
  onSave,
}: {
  isDarkMode: boolean;
  whiteboardId: string;
  initialData?: any;
  isReadOnly?: boolean;
  onSave?: (content: any) => Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);

  // Debounce the save function to prevent too many rapid saves
  const debouncedSave = useDebounceCallback(async (content: any) => {
    if (onSave) {
      await onSave(content);
    }
  }, 1000);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div style={{ position: "fixed", inset: 0, marginTop: "9rem" }}>
      <Tldraw
        inferDarkMode={isDarkMode}
        persistenceKey={whiteboardId}
        onMount={(editor) => {
          editor.updateInstanceState({ isReadonly: isReadOnly });

          // Listen for changes and persist them
          editor.store.listen(() => {
            const content = getSnapshot(editor.store);
            debouncedSave(content);
          });
        }}
      />
    </div>
  );
}
