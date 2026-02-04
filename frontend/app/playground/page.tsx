"use client";

import { useState, useEffect, useRef } from "react";

interface StickyNote {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  createdAt: Date;
}

const colors = [
  "bg-yellow-200",
  "bg-pink-200",
  "bg-blue-200",
  "bg-green-200",
  "bg-purple-200",
  "bg-orange-200",
];

export default function Playground() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const playgroundRef = useRef<HTMLDivElement>(null);

  // Load notes from backend on mount
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch("/api/playground/notes");
        if (response.ok) {
          const fetchedNotes = await response.json();
          setNotes(
            fetchedNotes.map((note: any) => ({
              ...note,
              createdAt: new Date(note.createdAt),
            })),
          );
        }
      } catch (error) {
        console.error("Error loading notes:", error);
        // Fallback to localStorage if backend fails
        const savedNotes = localStorage.getItem("playground-notes");
        if (savedNotes) {
          try {
            const parsedNotes = JSON.parse(savedNotes);
            setNotes(
              parsedNotes.map((note: any) => ({
                ...note,
                createdAt: new Date(note.createdAt),
              })),
            );
          } catch (parseError) {
            console.error("Error parsing localStorage notes:", parseError);
          }
        }
      }
    };

    fetchNotes();
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("playground-notes", JSON.stringify(notes));
    }
  }, [notes]);

  const addNote = async () => {
    if (!newNoteContent.trim()) return;

    const newNote: StickyNote = {
      id: Date.now().toString(),
      content: newNoteContent,
      x: Math.random() * 300,
      y: Math.random() * 200,
      color: selectedColor,
      createdAt: new Date(),
    };

    try {
      // Save to backend
      const response = await fetch("/api/playground/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        const savedNote = await response.json();
        setNotes([...notes, savedNote]);
      } else {
        throw new Error("Failed to save note to backend");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      // Fallback to local state
      setNotes([...notes, newNote]);
      localStorage.setItem(
        "playground-notes",
        JSON.stringify([...notes, newNote]),
      );
    }

    setNewNoteContent("");
    setIsAddingNote(false);
  };

  const deleteNote = async (id: string) => {
    try {
      // Delete from backend
      const response = await fetch(`/api/playground/notes?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotes(notes.filter((note) => note.id !== id));
      } else {
        throw new Error("Failed to delete note from backend");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      // Fallback to local state
      setNotes(notes.filter((note) => note.id !== id));
    }
  };

  const updateNoteContent = async (id: string, content: string) => {
    const updatedNote = notes.find((note) => note.id === id);
    if (!updatedNote) return;

    try {
      // Update in backend
      const response = await fetch("/api/playground/notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, content }),
      });

      if (response.ok) {
        const savedNote = await response.json();
        setNotes(notes.map((note) => (note.id === id ? savedNote : note)));
      } else {
        throw new Error("Failed to update note in backend");
      }
    } catch (error) {
      console.error("Error updating note:", error);
      // Fallback to local state
      setNotes(
        notes.map((note) => (note.id === id ? { ...note, content } : note)),
      );
    }
  };

  const clearAllNotes = async () => {
    if (confirm("Are you sure you want to clear all sticky notes?")) {
      try {
        // Clear from backend
        const response = await fetch("/api/playground/notes/clear", {
          method: "POST",
        });

        if (response.ok) {
          setNotes([]);
          localStorage.removeItem("playground-notes");
        } else {
          throw new Error("Failed to clear notes from backend");
        }
      } catch (error) {
        console.error("Error clearing notes:", error);
        // Fallback to local state
        setNotes([]);
        localStorage.removeItem("playground-notes");
      }
    }
  };

  const exportNotes = () => {
    const notesText = notes
      .map(
        (note) =>
          `Note (${note.createdAt.toLocaleDateString()}):\n${note.content}\n---`,
      )
      .join("\n\n");

    const blob = new Blob([notesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "playground-notes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMouseDown = (e: React.MouseEvent, noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDraggedNote(noteId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNote || !playgroundRef.current) return;

    const playgroundRect = playgroundRef.current.getBoundingClientRect();
    const newX = e.clientX - playgroundRect.left - dragOffset.x;
    const newY = e.clientY - playgroundRect.top - dragOffset.y;

    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === draggedNote
          ? { ...note, x: Math.max(0, newX), y: Math.max(0, newY) }
          : note,
      ),
    );
  };

  const handleMouseUp = () => {
    setDraggedNote(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Playground</h1>
              <p className="text-gray-600 mt-1">
                Your creative sticky note space
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingNote(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                + Add Note
              </button>
              <button
                onClick={clearAllNotes}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                disabled={notes.length === 0}
              >
                Clear All
              </button>
              <button
                onClick={exportNotes}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                disabled={notes.length === 0}
              >
                Export
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{notes.length} notes</span>
            <span>•</span>
            <span>Click and drag to move notes</span>
            <span>•</span>
            <span>Double-click to edit</span>
          </div>
        </div>

        {/* Add Note Modal */}
        {isAddingNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h2 className="text-xl font-bold mb-4">Add New Sticky Note</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded ${color} ${selectedColor === color ? "ring-2 ring-blue-500" : ""}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter your note content..."
                  autoFocus
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNoteContent("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={addNote}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Playground Area */}
        <div
          ref={playgroundRef}
          className="relative bg-gray-50 rounded-lg shadow-inner h-96 md:h-[600px] overflow-hidden border-2 border-dashed border-gray-300"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {notes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg">No sticky notes yet</p>
                <p className="text-gray-400">Click "Add Note" to get started</p>
              </div>
            </div>
          )}

          {notes.map((note) => (
            <div
              key={note.id}
              className={`absolute p-3 rounded-lg shadow-lg cursor-move ${note.color} min-w-[200px] max-w-[300px] group`}
              style={{
                left: `${note.x}px`,
                top: `${note.y}px`,
                minWidth: "200px",
                maxWidth: "300px",
              }}
              onMouseDown={(e) => handleMouseDown(e, note.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-600 opacity-75">
                  {note.createdAt.toLocaleDateString()}
                </span>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                >
                  ×
                </button>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) =>
                  updateNoteContent(note.id, e.currentTarget.textContent || "")
                }
                className="outline-none text-gray-800 whitespace-pre-wrap"
              >
                {note.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
