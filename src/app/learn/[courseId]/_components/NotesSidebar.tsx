"use client";
// _components/NotesSidebar.tsx
// Used inside the Notes tab. Gets video time from parent.

import { useState, useEffect, useRef } from "react";
import { getNotes, saveNote } from "@/lib/api/player";
import type { Note } from "@/types/player";

interface Props {
  lessonId: string;
  getCurrentTime: () => number;
  onSeekTo: (seconds: number) => void;
}

function formatTimestamp(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function NotesSidebar({ lessonId, getCurrentTime, onSeekTo }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const loadedForRef = useRef<string | null>(null);

  // Load notes when lessonId changes or on first open
  useEffect(() => {
    if (loadedForRef.current === lessonId) return;
    loadedForRef.current = lessonId;

    setIsLoading(true);
    getNotes(lessonId)
      .then((data) => {
        // Sort ascending by timestamp
        setNotes([...data].sort((a, b) => a.timestamp - b.timestamp));
      })
      .finally(() => setIsLoading(false));
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSaving) return;

    const timestamp = Math.floor(getCurrentTime());
    setIsSaving(true);

    const saved = await saveNote(lessonId, content.trim(), timestamp);

    if (saved) {
      setNotes((prev) =>
        [...prev, saved].sort((a, b) => a.timestamp - b.timestamp),
      );
      setContent("");
    }
    setIsSaving(false);
  };

  const handleDelete = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    // Fire-and-forget delete — no dedicated delete endpoint specified
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Add note form */}
      <form
        onSubmit={handleSubmit}
        className="border border-slate-200 rounded-xl overflow-hidden"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note at the current video position…"
          rows={3}
          className="w-full px-4 py-3 text-[13.5px] text-slate-800 placeholder:text-slate-400
                     resize-none outline-none border-none bg-white leading-relaxed"
        />
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-200">
          <span className="text-[11.5px] text-slate-400">
            Timestamps to{" "}
            <span className="font-semibold text-slate-600">
              {formatTimestamp(Math.floor(getCurrentTime()))}
            </span>
          </span>
          <button
            type="submit"
            disabled={!content.trim() || isSaving}
            className="bg-[#3B1892] disabled:bg-slate-200 disabled:text-slate-400
                       text-white text-[12.5px] font-bold px-4 py-1.5 rounded-xl
                       hover:bg-violet-700 transition-colors"
          >
            {isSaving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </form>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 animate-pulse">
              <div className="h-3 w-12 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-full bg-slate-100 rounded mb-1.5" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <p className="text-[13px] text-slate-500 font-medium">No notes yet</p>
          <p className="text-[12px] text-slate-400 mt-1">
            Pause the video and add a note above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group bg-slate-50 border border-slate-200 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => onSeekTo(note.timestamp)}
                  className="text-[11.5px] font-bold text-[#3B1892] hover:underline
                             bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full"
                  aria-label={`Seek to ${formatTimestamp(note.timestamp)}`}
                >
                  {formatTimestamp(note.timestamp)}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors opacity-0
                             group-hover:opacity-100"
                  aria-label="Delete note"
                >
                  <TrashIcon />
                </button>
              </div>
              <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
