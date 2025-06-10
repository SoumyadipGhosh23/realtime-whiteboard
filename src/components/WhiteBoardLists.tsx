"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Whiteboard } from "@/types/whiteboard";

interface WhiteboardWithCount extends Omit<Whiteboard, "content" | "comments"> {
  _count: {
    comments: number;
  };
}

export default function WhiteboardList() {
  const { userId, isLoaded } = useAuth();
  const [whiteboards, setWhiteboards] = useState<WhiteboardWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "PUBLISHED">("ALL");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWhiteboardName, setNewWhiteboardName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchWhiteboards = useCallback(async () => {
    if (!userId) return;

    try {
      const url =
        filter === "ALL"
          ? "/api/whiteboards"
          : `/api/whiteboards?status=${filter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setWhiteboards(data);
      }
    } catch (error) {
      console.error("Error fetching whiteboards:", error);
    } finally {
      setLoading(false);
    }
  },[filter, userId]);

  useEffect(() => {
    if (isLoaded && userId) {
      fetchWhiteboards();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [userId, isLoaded, filter, fetchWhiteboards]);

  const createWhiteboard = async () => {
    if (!newWhiteboardName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/whiteboards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newWhiteboardName.trim(),
        }),
      });

      if (response.ok) {
        const whiteboard = await response.json();
        setWhiteboards((prev) => [whiteboard, ...prev]);
        setNewWhiteboardName("");
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error("Error creating whiteboard:", error);
    } finally {
      setCreating(false);
    }
  };

  const deleteWhiteboard = async (id: string) => {
    if (!confirm("Are you sure you want to delete this whiteboard?")) return;

    try {
      const response = await fetch(`/api/whiteboards/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWhiteboards((prev) => prev.filter((wb) => wb.id !== id));
      }
    } catch (error) {
      console.error("Error deleting whiteboard:", error);
    }
  };

  const copyShareLink = async (shareId: string, status: string) => {
    if (status !== "PUBLISHED") {
      alert("Only published whiteboards can be shared");
      return;
    }

    const shareUrl = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  };

  if (!isLoaded || loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Whiteboards</h1>
        <p className="text-gray-600 mb-4">
          Sign in to create and manage your whiteboards
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Whiteboards</h1>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create New
        </button>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "DRAFT", "PUBLISHED"] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-lg ${
              filter === filterType
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {filterType}
          </button>
        ))}
      </div>

      {/* Create dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Whiteboard</h2>
            <input
              type="text"
              value={newWhiteboardName}
              onChange={(e) => setNewWhiteboardName(e.target.value)}
              placeholder="Enter whiteboard name"
              className="w-full p-3 border rounded-lg mb-4"
              onKeyPress={(e) => e.key === "Enter" && createWhiteboard()}
            />
            <div className="flex gap-2">
              <button
                onClick={createWhiteboard}
                disabled={creating || !newWhiteboardName.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewWhiteboardName("");
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Whiteboards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {whiteboards.map((whiteboard) => (
          <div
            key={whiteboard.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg truncate">
                {whiteboard.name}
              </h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  whiteboard.status === "PUBLISHED"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {whiteboard.status}
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p>
                Created: {new Date(whiteboard.createdAt).toLocaleDateString()}
              </p>
              <p>
                Updated: {new Date(whiteboard.updatedAt).toLocaleDateString()}
              </p>
              <p>Comments: {whiteboard._count.comments}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/whiteboard/${whiteboard.id}`}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-center hover:bg-blue-700"
              >
                Edit
              </Link>
              <button
                onClick={() =>
                  copyShareLink(whiteboard.shareId, whiteboard.status)
                }
                className="bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700"
                title={
                  whiteboard.status === "PUBLISHED"
                    ? "Copy share link"
                    : "Publish to share"
                }
              >
                Share
              </button>
              <button
                onClick={() => deleteWhiteboard(whiteboard.id)}
                className="bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {whiteboards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No whiteboards found</p>
          <p className="text-gray-500">
            Create your first whiteboard to get started!
          </p>
        </div>
      )}
    </div>
  );
}
