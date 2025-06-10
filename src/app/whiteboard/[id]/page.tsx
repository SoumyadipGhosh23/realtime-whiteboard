"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { Whiteboard } from "@/types/whiteboard";

const EnhancedTldrawEditor = dynamic(
  () => import("@/components/TldrawEditor"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        Loading editor...
      </div>
    ),
    ssr: false,
  }
);

export default function WhiteboardEditorPage({}) {
  const { theme } = useTheme();
  const { isSignedIn } = useUser();
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parameters = useParams();
  const id = parameters.id;

  useEffect(() => {
    if (isLoaded) {
      fetchWhiteboard();
    }
  }, [id, isLoaded]);

  const fetchWhiteboard = async () => {
    try {
      const response = await fetch(`/api/whiteboards/${id}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in");
          return;
        }
        if (response.status === 403) {
          setError("You do not have permission to access this whiteboard");
          return;
        }
        if (response.status === 404) {
          setError("Whiteboard not found");
          return;
        }
        throw new Error("Failed to fetch whiteboard");
      }

      const data = await response.json();
      setWhiteboard(data);
    } catch (error) {
      console.error("Error fetching whiteboard:", error);
      setError("Failed to load whiteboard");
    } finally {
      setLoading(false);
    }
  };

  const saveWhiteboard = async (content: any) => {
    if (!whiteboard || saving) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/whiteboards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save whiteboard");
      }

      const updatedWhiteboard = await response.json();
      setWhiteboard(updatedWhiteboard);
    } catch (error) {
      console.error("Error saving whiteboard:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!whiteboard) return;

    const newStatus = whiteboard.status === "DRAFT" ? "PUBLISHED" : "DRAFT";

    try {
      const response = await fetch(`/api/whiteboards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updatedWhiteboard = await response.json();
        setWhiteboard(updatedWhiteboard);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const copyShareLink = async () => {
    if (!whiteboard) return;

    if (whiteboard.status !== "PUBLISHED") {
      alert("Whiteboard must be published to share");
      return;
    }

    const shareUrl = `${window.location.origin}/share/${whiteboard.shareId}`;
    await navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  };
  const { redirectToSignIn } = useClerk();

  useEffect(() => {
    if (!isSignedIn) {
      redirectToSignIn({
        redirectUrl: "/",
      });
      return;
    }
  }, [isSignedIn, redirectToSignIn]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!whiteboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Whiteboard not found</p>
      </div>
    );
  }

  const isOwner = userId === whiteboard.userId;
  const canEdit = isOwner;

  return (
    <div style={{ marginTop: "0.25rem" }}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Whiteboards
          </button>
          <h1 className="text-xl font-semibold">{whiteboard.name}</h1>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              whiteboard.status === "PUBLISHED"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {whiteboard.status}
          </span>
          {saving && <span className="text-sm text-gray-500">Saving...</span>}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleStatus}
              className={`px-4 py-2 rounded-lg ${
                whiteboard.status === "DRAFT"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-yellow-600 text-white hover:bg-yellow-700"
              }`}
            >
              {whiteboard.status === "DRAFT" ? "Publish" : "Unpublish"}
            </button>
            <button
              onClick={copyShareLink}
              disabled={whiteboard.status !== "PUBLISHED"}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Share
            </button>
          </div>
        )}
      </div>

      {/* Editor */}
      <EnhancedTldrawEditor
        key={`${theme}-${whiteboard.id}`}
        isDarkMode={theme === "dark"}
        whiteboardId={whiteboard.id}
        initialData={whiteboard.content}
        isReadOnly={!canEdit}
        onSave={canEdit ? saveWhiteboard : undefined}
      />
    </div>
  );
}
