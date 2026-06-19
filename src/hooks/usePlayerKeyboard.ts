"use client";
// src/hooks/usePlayerKeyboard.ts

import { useEffect } from "react";

interface Options {
  /** The furthest position the student has watched — enforces seek restriction. */
  getMaxWatchedTime: () => number;
  /** Called when seek restriction is triggered (show toast). */
  onSeekBlocked?: () => void;
}

/**
 * Attaches keyboard shortcuts for the course player.
 *
 * Space      → toggle play / pause
 * ArrowRight → seek +10 s  (capped at maxWatchedTime)
 * ArrowLeft  → seek -10 s
 * M          → toggle mute
 * F          → toggle fullscreen
 *
 * Listeners are removed on component unmount.
 */
export function usePlayerKeyboard(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: Options,
): void {
  const { getMaxWatchedTime, onSeekBlocked } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't steal keys when the user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case " ":
        case "Spacebar": {
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;
        }

        case "ArrowRight": {
          e.preventDefault();
          const max = getMaxWatchedTime();
          const next = video.currentTime + 10;
          if (next > max) {
            video.currentTime = max;
            onSeekBlocked?.();
          } else {
            video.currentTime = next;
          }
          break;
        }

        case "ArrowLeft": {
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        }

        case "m":
        case "M": {
          e.preventDefault();
          video.muted = !video.muted;
          break;
        }

        case "f":
        case "F": {
          e.preventDefault();
          if (!document.fullscreenElement) {
            video.requestFullscreen().catch(() => {
              // fullscreen may be blocked by the browser — silently ignore
            });
          } else {
            document.exitFullscreen();
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videoRef, getMaxWatchedTime, onSeekBlocked]);
}
