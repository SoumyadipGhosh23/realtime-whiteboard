"use client";
import { getSnapshot, Tldraw, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

export default function TldrawEditor({
  isDarkMode,
  whiteboardId,
  initialData,
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

  console.log(initialData);

  return (
    <div style={{ position: "fixed", inset: 0, marginTop: "9rem" }}>
      <Tldraw
        inferDarkMode={isDarkMode}
        persistenceKey={whiteboardId}
        onMount={(editor) => {
          editor.updateInstanceState({ isReadonly: isReadOnly });

          // Load initial data if provided
          if (initialData) {
            try {
              // Handle both string and object formats
              const parsedContent =
                typeof initialData === "string"
                  ? JSON.parse(initialData)
                  : initialData;

              console.log("Parsed content:", parsedContent);

              // Check if we have the document structure
              if (parsedContent.document) {
                console.log(
                  "Loading snapshot with document:",
                  parsedContent.document
                );
                // Load the entire document snapshot
                loadSnapshot(editor.store, parsedContent.document);
              } else if (parsedContent.store) {
                // Fallback: if the data is directly a store
                console.log(
                  "Loading snapshot with store:",
                  parsedContent.store
                );
                loadSnapshot(editor.store, parsedContent.store);
              } else {
                console.warn(
                  "No valid document or store found in initial data"
                );
              }
            } catch (error) {
              console.error("Failed to load initial whiteboard data:", error);
            }
          }

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
