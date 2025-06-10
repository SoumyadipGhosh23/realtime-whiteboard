"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Whiteboard } from "@/types/whiteboard";
import { useParams } from "next/navigation";

const EnhancedTldrawEditor = dynamic(
  () => import("@/components/TldrawEditor"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        Loading shared whiteboard...
      </div>
    ),
    ssr: false,
  }
);

export default function SharePage() {
  const { theme } = useTheme();
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const shareId = params.shareId;

  useEffect(() => {
    fetchSharedWhiteboard();
  }, [shareId]);

  const fetchSharedWhiteboard = async () => {
    try {
      const response = await fetch(`/api/share/${shareId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Shared whiteboard not found or no longer available");
          return;
        }
        throw new Error("Failed to fetch shared whiteboard");
      }

      const data = await response.json();
      setWhiteboard(data);
    } catch (error) {
      console.error("Error fetching shared whiteboard:", error);
      setError("Failed to load shared whiteboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading shared whiteboard...</p>
        </div>
      </div>
    );
  }

  if (error || !whiteboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || "This shared whiteboard is not available"}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            The whiteboard may have been unpublished or deleted by its owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{whiteboard.name}</h1>
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            SHARED - READ ONLY
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Created: {new Date(whiteboard.createdAt).toLocaleDateString()}
          </span>
          <span>•</span>
          <span>Comments: {whiteboard.comments?.length || 0}</span>
        </div>
      </div>

      {/* Read-only Editor */}
      <EnhancedTldrawEditor
        key={`${theme}-${whiteboard.id}-readonly`}
        isDarkMode={theme === "dark"}
        whiteboardId={whiteboard.id}
        initialData={whiteboard.content}
        isReadOnly={true}
      />
    </div>
  );
}
