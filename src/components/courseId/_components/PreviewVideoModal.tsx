"use client";
// _components/PreviewVideoModal.tsx

import { useEffect } from "react";
import Button from "@/components/ui/Button";

interface Props {
  videoUrl: string;
  onClose: () => void;
}

export default function PreviewVideoModal({ videoUrl, onClose }: Props) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-black shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
          <h2 className="text-white text-[14px] font-bold">Course Preview</h2>
          <Button
            variant="ghostOnColor"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none"
          >
            ✕
          </Button>
        </div>
        {/* Native controls (play/pause, volume, fullscreen) — the lesson
            VideoPlayer is tightly coupled to authenticated progress-tracking
            and watched-time seek limits, neither of which apply to a public
            course preview clip. */}
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full aspect-video bg-black"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
