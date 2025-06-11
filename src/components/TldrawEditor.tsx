"use client";
import { getSnapshot, Tldraw, loadSnapshot, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useState, useRef } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { MessageCircle, X, Plus, Send } from "lucide-react";
import Image from "next/image";

interface Comment {
  id: string;
  content: string;
  x: number;
  y: number;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}



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
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  // Debounce the save function to prevent too many rapid saves
  const debouncedSave = useDebounceCallback(async (content: any) => {
    if (onSave) {
      await onSave(content);
    }
  }, 1000);

  // Fetch comments
  const fetchComments = async () => {
    try {
      // waiting for 3 seconds before the comments are fetched, to allow the editor to load
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const response = await fetch(`/api/whiteboards/${whiteboardId}/comments`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  // Add new comment
  const addComment = async (content: string, x: number, y: number) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/whiteboards/${whiteboardId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content, x, y }),
        }
      );

      if (response.ok) {
        const newCommentData = await response.json();
        setComments((prev) => [newCommentData, ...prev]);
        setNewComment("");
        setPendingPosition(null);
        setIsAddingComment(false);
      } else {
        console.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle canvas click for adding comments
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isAddingComment || !editorRef.current) return;

    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const camera = editorRef.current.getCamera();

    // Convert screen coordinates to canvas coordinates
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert to world coordinates accounting for camera position and zoom
    const worldX = (screenX - camera.x) / camera.z;
    const worldY = (screenY - camera.y) / camera.z;

    setPendingPosition({ x: worldX, y: worldY });
  };

  // Convert world coordinates to screen coordinates
  const worldToScreen = (worldX: number, worldY: number) => {
    if (!editorRef.current) return { x: 0, y: 0 };

    const camera = editorRef.current.getCamera();
    const screenX = worldX * camera.z + camera.x;
    const screenY = worldY * camera.z + camera.y;

    return { x: screenX, y: screenY };
  };

  useEffect(() => {
    setMounted(true);
    fetchComments();
  }, [whiteboardId]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      <div style={{ position: "fixed", inset: 0, marginTop: "9rem" }}>
        <Tldraw
          inferDarkMode={isDarkMode}
          persistenceKey={whiteboardId}
          onMount={(editor) => {
            editorRef.current = editor;
            editor.updateInstanceState({ isReadonly: isReadOnly });

            // Load initial data if provided
            if (initialData) {
              try {
                const parsedContent =
                  typeof initialData === "string"
                    ? JSON.parse(initialData)
                    : initialData;
                console.log("Parsed content:", parsedContent);

                if (parsedContent.document) {
                  console.log(
                    "Loading snapshot with document:",
                    parsedContent.document
                  );
                  loadSnapshot(editor.store, parsedContent.document);
                } else if (parsedContent.store) {
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

        {/* Canvas overlay for click handling */}
        {isAddingComment && (
          <div
            className="absolute inset-0 cursor-crosshair"
            onClick={handleCanvasClick}
            style={{ zIndex: 10 }}
          />
        )}

        {/* Comment pins overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 20 }}
        >
          {comments.map((comment) => {
            const screenPos = worldToScreen(comment.x, comment.y);
            return (
              <div
                key={comment.id}
                className="absolute pointer-events-auto"
                style={{
                  left: screenPos.x - 12,
                  top: screenPos.y - 12,
                }}
              >
                <button
                  onClick={() =>
                    setSelectedPin(
                      selectedPin === comment.id ? null : comment.id
                    )
                  }
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 ${
                    selectedPin === comment.id ? "bg-blue-600" : "bg-red-500"
                  }`}
                >
                  <MessageCircle size={12} />
                </button>

                {/* Comment popup */}
                {selectedPin === comment.id && (
                  <div className="absolute left-8 top-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 min-w-64 max-w-80 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {comment.userAvatar && (
                          <Image
                          height={30}
                          width={30}
                          src={comment.userAvatar}
                            alt={comment.userName}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {comment.userName}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedPin(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {comment.content}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pending comment position indicator */}
        {pendingPosition && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: worldToScreen(pendingPosition.x, pendingPosition.y).x - 12,
              top: worldToScreen(pendingPosition.x, pendingPosition.y).y - 12,
              zIndex: 25,
            }}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg animate-pulse">
              <Plus size={12} />
            </div>
          </div>
        )}
      </div>

      {/* Comment controls */}
      {!isReadOnly && (
        <div className="fixed top-40 right-4 z-30">
          <button
            onClick={() => {
              setIsAddingComment(!isAddingComment);
              setPendingPosition(null);
              setNewComment("");
            }}
            className={`p-3 rounded-full shadow-lg transition-all ${
              isAddingComment
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isAddingComment ? <X size={20} /> : <MessageCircle size={20} />}
          </button>
        </div>
      )}

      {/* Add comment form */}
      {pendingPosition && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Add Comment
            </h3>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setPendingPosition(null);
                  setNewComment("");
                  setIsAddingComment(false);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newComment.trim() && pendingPosition) {
                    addComment(
                      newComment.trim(),
                      pendingPosition.x,
                      pendingPosition.y
                    );
                  }
                }}
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                <span>{isSubmitting ? "Adding..." : "Add"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions overlay when adding comments */}
      {isAddingComment && !pendingPosition && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-30 pointer-events-none">
          Click anywhere on the canvas to add a comment
        </div>
      )}
    </div>
  );
}
