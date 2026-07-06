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

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

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

const PipIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <rect x="12" y="11.5" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
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
  const containerRef = useRef<HTMLDivElement>(null);

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
  const [pipSupported, setPipSupported] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const activityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const showSpeedMenuRef = useRef(showSpeedMenu);

  // Furthest-watched position — used only to resume playback, not to cap seeking.
  const maxWatchedTimeRef = useRef(lesson.watchedDuration);

  // ── Expose handle to parent ───────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      // Free seek — clamp only to the video's own duration.
      const max = video.duration || seconds;
      video.currentTime = Math.max(0, Math.min(seconds, max));
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

  // ── Keyboard hook — scoped to the player container, not the whole window,
  // so shortcuts only fire once the student has focused the player ─────────
  usePlayerKeyboard(
    videoRef as React.RefObject<HTMLVideoElement>,
    containerRef,
    {
      // Free seek — never cap ArrowRight.
      getMaxWatchedTime: () => Infinity,
    },
  );

  // ── Fullscreen change detection ───────────────────────────────────────────
  useEffect(() => {
    const handleFSChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  // ── Picture-in-picture support detection + state sync ─────────────────────
  useEffect(() => {
    setPipSupported(
      typeof document !== "undefined" &&
        "pictureInPictureEnabled" in document &&
        document.pictureInPictureEnabled,
    );
    const handleEnterPip = () => setIsPip(true);
    const handleLeavePip = () => setIsPip(false);
    const video = videoRef.current;
    video?.addEventListener("enterpictureinpicture", handleEnterPip);
    video?.addEventListener("leavepictureinpicture", handleLeavePip);
    return () => {
      video?.removeEventListener("enterpictureinpicture", handleEnterPip);
      video?.removeEventListener("leavepictureinpicture", handleLeavePip);
    };
  }, []);

  // ── Keep latest isPlaying/showSpeedMenu in refs for the hide-timer closure ─
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    showSpeedMenuRef.current = showSpeedMenu;
  }, [showSpeedMenu]);

  // ── Auto-hide controls after inactivity during playback ───────────────────
  const bumpActivity = useCallback(() => {
    setControlsVisible(true);
    if (activityTimer.current) clearTimeout(activityTimer.current);
    activityTimer.current = setTimeout(() => {
      if (isPlayingRef.current && !showSpeedMenuRef.current) {
        setControlsVisible(false);
      }
    }, 3000);
  }, []);

  // Start/refresh the hide countdown when playback starts; always show
  // controls (and cancel the countdown) while paused/loading.
  useEffect(() => {
    if (isPlaying) {
      bumpActivity();
    } else {
      setControlsVisible(true);
      if (activityTimer.current) clearTimeout(activityTimer.current);
    }
    return () => {
      if (activityTimer.current) clearTimeout(activityTimer.current);
    };
  }, [isPlaying, bumpActivity]);

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
    // Track furthest-watched (still used for resume), but it no longer caps seeking.
    if (video.currentTime > maxWatchedTimeRef.current) {
      maxWatchedTimeRef.current = video.currentTime;
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

  // Skip forward/back (e.g. double-tap zones) — mirrors the ArrowRight/Left
  // keyboard behavior, capped at maxWatchedTime for forward skips.
  const skip = (deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const next = video.currentTime + deltaSeconds;
    video.currentTime = Math.max(0, Math.min(next, video.duration || next));
    bumpActivity();
  };

  const handleSeekBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    // Free seek anywhere along the timeline.
    video.currentTime = parseFloat(e.target.value);
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
    // Fullscreen the whole player container (video + custom controls), not
    // just the bare <video> element — otherwise the browser's fullscreen
    // element would only contain the video and every custom control (seek
    // bar, speed menu, PiP/fullscreen buttons) would vanish while fullscreen.
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {
        // fullscreen may be blocked by the browser — silently ignore
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video || !pipSupported) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP can be refused by the browser/OS — non-critical, ignore
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const watchedPct =
    duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

  const seekBarMax = duration > 0 ? duration : 100;
  // Free seek — the entire timeline is seekable.
  const seekableWidth = 100;

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
    <div
      ref={containerRef}
      className="relative bg-slate-900 w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B1892]"
      tabIndex={0}
      onMouseMove={bumpActivity}
      onTouchStart={bumpActivity}
    >
      {/* Video element */}
      <div className="relative w-full aspect-video bg-slate-900 overflow-hidden">
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
          // streaming/signing support; `controlsList` below is NOT a real
          // security boundary, just a deterrent against casual/accidental
          // downloads via the browser's own UI.
          src={lesson.videoUrl}
          className="w-full h-full object-contain"
          controlsList="nodownload"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          preload="metadata"
        />

        {/* Tap zones — click anywhere toggles play; double-tap/double-click
            the left or right third skips -10s/+10s (mobile-style gesture,
            equivalent to the ArrowLeft/ArrowRight keyboard shortcuts). */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={togglePlay}
          onDoubleClick={() => skip(-10)}
          className="absolute inset-y-0 left-0 w-1/3 cursor-pointer bg-transparent border-0 focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={togglePlay}
          className="absolute inset-y-0 left-1/3 w-1/3 cursor-pointer bg-transparent border-0 focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={togglePlay}
          onDoubleClick={() => skip(10)}
          className="absolute inset-y-0 right-0 w-1/3 cursor-pointer bg-transparent border-0 focus:outline-none"
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

        {/* ── Controls overlay — auto-hides after a few seconds of playback
            inactivity, reappears on mouse move/tap (bumpActivity above) ── */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent
                      px-4 pt-8 pb-3 flex flex-col gap-2 transition-opacity duration-300
                      ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >

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

            {/* Picture-in-picture (only rendered when the browser supports it) */}
            {pipSupported && (
              <Button
                type="button"
                variant="ghostOnColor"
                size="icon"
                onClick={togglePiP}
                aria-label={isPip ? "Exit picture-in-picture" : "Picture-in-picture"}
              >
                <PipIcon />
              </Button>
            )}

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
      </div>

    </div>
  );
});

export default VideoPlayer;
