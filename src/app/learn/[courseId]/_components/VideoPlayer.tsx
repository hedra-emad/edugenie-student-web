"use client";
// _components/VideoPlayer.tsx

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import Link from "next/link";
import type { PlayerLesson, ProgressResponse } from "@/types/player";
import Button from "@/components/ui/Button";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { usePlayerKeyboard } from "@/hooks/usePlayerKeyboard";

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      aria-live="assertive"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl
        pointer-events-none select-none whitespace-nowrap
        transition-all duration-300
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      {message}
    </div>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ─── Speed options ────────────────────────────────────────────────────────────

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

// ─── SVG icons (inline, no library) ──────────────────────────────────────────

const PlayIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const VolumeHighIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const VolumeMuteIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const FullscreenIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const ExitFullscreenIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3" />
  </svg>
);

// ─── Props / Handle ───────────────────────────────────────────────────────────

interface Props {
  lesson: PlayerLesson;
  courseId: string;
  /**
   * Whether the active lesson is locked (not purchased directly, or not
   * unlocked via a roadmap enrollment — same `section.isUnlocked`/`lesson.state`
   * check the sidebar uses for its lock icon). While true, no real player is
   * mounted and `lesson.videoUrl` is never read.
   */
  locked?: boolean;
  /** Course-level thumbnail, reused for the locked-state preview background. */
  courseThumbnail?: string;
  onProgressResponse?: (res: ProgressResponse) => void;
  onLessonComplete?: () => void;
}

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer(
  { lesson, courseId, locked = false, courseThumbnail, onProgressResponse, onLessonComplete },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── State ────────────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Max watched time — enforces seek restriction
  const maxWatchedTimeRef = useRef(lesson.watchedDuration);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
  }, []);

  // ── Expose handle to parent ───────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = Math.min(seconds, maxWatchedTimeRef.current);
      video.currentTime = clamped;
    },
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
  }));

  // ── Reset when lesson changes ─────────────────────────────────────────────
  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
    maxWatchedTimeRef.current = lesson.watchedDuration;
    setShowSpeedMenu(false);
  }, [lesson.id, lesson.watchedDuration]);

  // ── Apply speed when it changes ───────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  // ── Progress hook ─────────────────────────────────────────────────────────
  useVideoProgress(lesson.id, videoRef as React.RefObject<HTMLVideoElement>, {
    onProgressResponse: (res) => {
      onProgressResponse?.(res);
      if (res.lessonState === "completed") onLessonComplete?.();
    },
  });

  // ── Keyboard hook ─────────────────────────────────────────────────────────
  usePlayerKeyboard(videoRef as React.RefObject<HTMLVideoElement>, {
    getMaxWatchedTime: () => maxWatchedTimeRef.current,
    onSeekBlocked: () => showToast("Complete the video to unlock"),
  });

  // ── Fullscreen change detection ───────────────────────────────────────────
  useEffect(() => {
    const handleFSChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  // ── Video event handlers ──────────────────────────────────────────────────

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setIsLoading(false);
    // Resume from stored position
    if (lesson.watchedDuration > 0) {
      video.currentTime = lesson.watchedDuration;
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    // Update maxWatchedTime
    if (video.currentTime > maxWatchedTimeRef.current) {
      maxWatchedTimeRef.current = video.currentTime;
    }
  };

  const handleSeeked = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime > maxWatchedTimeRef.current) {
      video.currentTime = maxWatchedTimeRef.current;
      showToast("Complete the video to unlock");
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleWaiting = () => setIsLoading(true);
  const handleCanPlay = () => setIsLoading(false);

  // ── Controls ──────────────────────────────────────────────────────────────

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  const handleSeekBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
    const clamped = Math.min(target, maxWatchedTimeRef.current);
    video.currentTime = clamped;
    if (target > maxWatchedTimeRef.current) {
      showToast("Complete the video to unlock");
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const watchedPct =
    duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

  const seekBarMax = duration > 0 ? duration : 100;
  // Seekable range fills up to maxWatchedTime
  const seekableWidth =
    duration > 0
      ? Math.min((maxWatchedTimeRef.current / duration) * 100, 100)
      : 0;

  // ── Locked state ──────────────────────────────────────────────────────────
  // No <video> is mounted and `lesson.videoUrl` is never touched here — the
  // full asset URL simply never reaches the client for a locked lesson. This
  // is the same `locked` check regardless of *why* it's locked (not purchased
  // individually vs. not unlocked via roadmap enrollment), since both cases
  // collapse into `section.isUnlocked` upstream in PlayerLayout.
  if (locked) {
    return (
      <div className="relative bg-slate-900 w-full select-none">
        <div className="relative w-full aspect-video overflow-hidden bg-slate-900">
          {courseThumbnail && (
            <img
              src={courseThumbnail}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-md"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/70 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <p className="text-sm font-bold text-white">{lesson.title}</p>
            <p className="max-w-xs text-xs text-white/60">
              This section isn’t included in your enrollment.
            </p>
            <Link
              href={`/courses/${courseId}`}
              className="mt-1 rounded-lg border border-white/30 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
            >
              Buy this section
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative bg-slate-900 w-full select-none">
      {/* Video element */}
      <div className="relative w-full aspect-video bg-slate-900">
        <video
          ref={videoRef}
          key={lesson.id}
          // SECURITY TODO: `lesson.videoUrl` is a static, permanent asset URL
          // returned as-is by the backend — anyone who copies it (devtools,
          // a "save video" browser extension, etc.) can fetch the full paid
          // video indefinitely. This needs to become a short-lived signed URL
          // minted per playback session, e.g.:
          //   GET /lessons/:lessonId/video-token → { url: string; expiresAt: string }
          // with VideoPlayer re-requesting a fresh token as the previous one
          // nears expiry. Not implemented here — needs backend
          // streaming/signing support; the `controlsList`/`disablePictureInPicture`
          // below are NOT a real security boundary, just a deterrent against
          // casual/accidental downloads via the browser's own UI.
          src={lesson.videoUrl}
          className="w-full h-full object-contain"
          controlsList="nodownload"
          disablePictureInPicture
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onSeeked={handleSeeked}
          onPlay={handlePlay}
          onPause={handlePause}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          onClick={togglePlay}
          preload="metadata"
        />

        {/* Spinner overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 pointer-events-none">
            <svg className="animate-spin w-10 h-10 text-white/60" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {/* "Watched X%" badge */}
        <div className="absolute top-3 right-3 bg-black/50 text-white/80 text-[11px] font-semibold px-2.5 py-1 rounded-full pointer-events-none">
          {watchedPct}% watched
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="bg-slate-900 px-4 pt-2 pb-3 flex flex-col gap-2">

        {/* Seek bar */}
        <div className="relative h-5 flex items-center group">
          {/* Seekable range (lighter track) */}
          <div
            className="absolute left-0 h-2 group-hover:h-3 transition-all bg-slate-600 rounded-full pointer-events-none"
            style={{ width: `${seekableWidth}%` }}
          />
          {/* Input (full width) */}
          <input
            type="range"
            min={0}
            max={seekBarMax}
            step={0.5}
            value={currentTime}
            onChange={handleSeekBarChange}
            className="relative w-full h-2 group-hover:h-3 transition-all appearance-none
                       bg-slate-700 rounded-full cursor-pointer accent-[#3B1892]
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                       [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-sm
                       [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
                       [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            aria-label="Seek"
          />
          {/* Played fill (visual only, pointer-events-none) */}
          <div
            className="absolute left-0 h-2 group-hover:h-3 transition-all bg-[#3B1892] rounded-full pointer-events-none"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: play + volume + time */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <Button
              type="button"
              variant="ghostOnColor"
              size="icon"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <Button
                type="button"
                variant="ghostOnColor"
                size="icon"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? <VolumeMuteIcon /> : <VolumeHighIcon />}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-16 overflow-hidden transition-all duration-200
                           h-1 appearance-none bg-slate-600 rounded-full cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5
                           [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:w-2.5
                           [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:rounded-full
                           [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
                aria-label="Volume"
              />
            </div>

            {/* Time */}
            <span className="text-[12px] text-white/70 tabular-nums whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right: speed + fullscreen */}
          <div className="flex items-center gap-3 relative">
            {/* Speed selector */}
            <div className="relative">
              <Button
                type="button"
                variant="ghostOnColor"
                size="sm"
                onClick={() => setShowSpeedMenu((v) => !v)}
                aria-label={`Playback speed: ${speed}x`}
              >
                {speed}x
              </Button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-slate-800 border border-slate-700
                                rounded-xl overflow-hidden shadow-xl z-20">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSpeed(s);
                        if (videoRef.current) videoRef.current.playbackRate = s;
                        setShowSpeedMenu(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-[13px] font-semibold
                                  transition-colors whitespace-nowrap
                                  ${s === speed
                                    ? "bg-[#3B1892] text-white"
                                    : "text-white/80 hover:bg-slate-700"}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <Button
              type="button"
              variant="ghostOnColor"
              size="icon"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </Button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
});

export default VideoPlayer;
