// @vitest-environment jsdom
// Regression guard for the unload-beacon bug: the beacon used to POST to
// `/auth/progress/lesson` as a raw string, so it 404'd and — even on the right
// path — would have been rejected as `text/plain` by the backend ValidationPipe.
// Last-watched position was silently never saved.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useVideoProgress } from "../useVideoProgress";

// Keep the real `progressLessonUrl` (that's what we're asserting on); only the
// network-calling `saveProgress` is stubbed out.
vi.mock("@/lib/api/player", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/player")>();
  return { ...actual, saveProgress: vi.fn().mockResolvedValue(null) };
});

const LESSON_ID = "507f1f77bcf86cd799439011";

function makeVideo(currentTime: number, duration: number): HTMLVideoElement {
  const video = document.createElement("video");
  Object.defineProperty(video, "currentTime", { value: currentTime, writable: true });
  Object.defineProperty(video, "duration", { value: duration, writable: true });
  return video;
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
}

/** The single beacon call's [url, body] pair. */
function beaconCall(sendBeacon: ReturnType<typeof vi.fn>) {
  expect(sendBeacon).toHaveBeenCalledTimes(1);
  return sendBeacon.mock.calls[0] as [string, Blob];
}

describe("useVideoProgress — unload beacon", () => {
  let sendBeacon: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setVisibility("visible");
    sendBeacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    // RTL's auto-cleanup only self-registers under `globals: true`; without it
    // each test's hook would stay mounted and keep its listeners attached.
    cleanup();
    vi.clearAllMocks();
  });

  it("beacons to the proxied progress endpoint, not the old /auth path", () => {
    const videoRef = { current: makeVideo(42.7, 100) };
    renderHook(() => useVideoProgress(LESSON_ID, videoRef));

    window.dispatchEvent(new Event("beforeunload"));

    const [url] = beaconCall(sendBeacon);
    expect(url).toBe("/api/proxy/progress/lesson");
    expect(url).not.toContain("/auth");
  });

  it("sends the body as an application/json Blob so ValidationPipe accepts it", async () => {
    const videoRef = { current: makeVideo(42.7, 100) };
    renderHook(() => useVideoProgress(LESSON_ID, videoRef));

    window.dispatchEvent(new Event("beforeunload"));

    const [, blob] = beaconCall(sendBeacon);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");

    // Payload must match TrackProgressDto: { lessonId, watchedDuration, isCompleted }
    expect(JSON.parse(await blob.text())).toEqual({
      lessonId: LESSON_ID,
      watchedDuration: 42, // floored
      isCompleted: false, // 42.7/100 < 0.9 threshold
    });
  });

  it("marks isCompleted once past the 90% threshold", async () => {
    const videoRef = { current: makeVideo(95, 100) };
    renderHook(() => useVideoProgress(LESSON_ID, videoRef));

    window.dispatchEvent(new Event("beforeunload"));

    const [, blob] = beaconCall(sendBeacon);
    expect(JSON.parse(await blob.text())).toMatchObject({
      watchedDuration: 95,
      isCompleted: true,
    });
  });

  it("also beacons when the page becomes hidden (mobile / BFCache)", () => {
    const videoRef = { current: makeVideo(10, 100) };
    renderHook(() => useVideoProgress(LESSON_ID, videoRef));

    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    const [url] = beaconCall(sendBeacon);
    expect(url).toBe("/api/proxy/progress/lesson");
  });

  it("does not beacon while the page is merely visible", () => {
    const videoRef = { current: makeVideo(10, 100) };
    renderHook(() => useVideoProgress(LESSON_ID, videoRef));

    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("detaches both listeners on unmount", () => {
    const videoRef = { current: makeVideo(10, 100) };
    const { unmount } = renderHook(() => useVideoProgress(LESSON_ID, videoRef));

    unmount();
    window.dispatchEvent(new Event("beforeunload"));
    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(sendBeacon).not.toHaveBeenCalled();
  });
});
