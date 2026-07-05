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
 * Scoped to the player: the listener is attached to `containerRef` (a
 * focusable element, `tabIndex={0}`) rather than `window`, so these
 * non-intrusive shortcuts only fire once the student has actually focused
 * the player — pressing space to scroll the page or toggle a "Buy this
 * section" button elsewhere on the page is never hijacked.
 *
 * Listeners are removed on component unmount.
 */
export function usePlayerKeyboard(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  containerRef: React.RefObject<HTMLElement | null>,
  options: Options,
): void {
  const { getMaxWatchedTime, onSeekBlocked } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
            container.requestFullscreen().catch(() => {
              // fullscreen may be blocked by the browser — silently ignore
            });
          } else {
            document.exitFullscreen();
          }
          break;
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [videoRef, containerRef, getMaxWatchedTime, onSeekBlocked]);
}
