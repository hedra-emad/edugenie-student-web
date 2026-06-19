"use client";
// src/hooks/useVideoProgress.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { saveProgress } from "@/lib/api/player";
import type { ProgressResponse } from "@/types/player";

const SAVE_INTERVAL_MS = 30_000; // 30 seconds
const COMPLETION_THRESHOLD = 0.9; // 90 %

interface Options {
  /** Called when the backend returns a progress response. */
  onProgressResponse?: (res: ProgressResponse) => void;
}

interface UseVideoProgressReturn {
  /** Call this manually to trigger an immediate save (e.g. on pause). */
  saveNow: () => void;
  isSaving: boolean;
}

/**
 * Handles all progress-saving logic for the video player.
 *
 * - Saves to the backend every 30 seconds while the video is playing.
 * - Saves on the video `pause` event.
 * - Saves on the browser `beforeunload` event (best-effort beacon).
 * - Detects 90 % completion and marks the lesson as completed.
 * - Clears the interval when `lessonId` changes or the component unmounts.
 */
export function useVideoProgress(
  lessonId: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: Options = {},
): UseVideoProgressReturn {
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const onProgressResponseRef = useRef(options.onProgressResponse);

  // Keep the callback ref current without re-triggering effects
  useEffect(() => {
    onProgressResponseRef.current = options.onProgressResponse;
  }, [options.onProgressResponse]);

  // ── Core save function ────────────────────────────────────────────────────
  const doSave = useCallback(
    async (force = false) => {
      const video = videoRef.current;
      if (!video || !lessonId) return;

      const watchedDuration = Math.floor(video.currentTime);
      const isCompleted =
        !completedRef.current &&
        video.duration > 0 &&
        video.currentTime / video.duration >= COMPLETION_THRESHOLD;

      // Avoid redundant network calls when nothing meaningful changed
      // (unless force === true, e.g. on pause/unload)
      if (!force && watchedDuration === 0) return;

      if (isCompleted) completedRef.current = true;

      setIsSaving(true);
      try {
        const res = await saveProgress({
          lessonId,
          watchedDuration,
          isCompleted,
        });
        if (res) onProgressResponseRef.current?.(res);
      } finally {
        setIsSaving(false);
      }
    },
    [lessonId, videoRef],
  );

  // ── Interval — only while video is playing ────────────────────────────────
  const startInterval = useCallback(() => {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => doSave(), SAVE_INTERVAL_MS);
  }, [doSave]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Attach video event listeners + beforeunload ───────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !lessonId) return;

    // Reset completion flag for the new lesson
    completedRef.current = false;

    const handlePlay = () => startInterval();
    const handlePause = () => {
      stopInterval();
      doSave(true);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    // Beacon on page unload — synchronous best-effort
    const handleBeforeUnload = () => {
      const v = videoRef.current;
      if (!v || !lessonId) return;
      const watchedDuration = Math.floor(v.currentTime);
      const isCompleted =
        v.duration > 0 &&
        v.currentTime / v.duration >= COMPLETION_THRESHOLD;

      // Use sendBeacon for reliability during unload
      const body = JSON.stringify({ lessonId, watchedDuration, isCompleted });
      const base =
        typeof window !== "undefined" ? "/api/proxy" : "";
      navigator.sendBeacon(`${base}/progress/lesson`, body);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopInterval();
    };
  }, [lessonId, videoRef, doSave, startInterval, stopInterval]);

  const saveNow = useCallback(() => doSave(true), [doSave]);

  return { saveNow, isSaving };
}
