"use client";
// Reusable client hook for the EduGenie AI tutor over plain HTTP (NestJS `/ai`
// REST endpoints). One hook drives all three tiers — lesson / course / roadmap —
// by swapping the `event` name and reading the matching id from `context`.
//
// HTTP (no streaming): each send POSTs { message, history, goal? } and receives
// the full reply at once. Requests go through the same-origin proxy, which
// attaches the JWT httpOnly cookie — so no token handling is needed here.
//
//   lesson_chat   → POST /api/proxy/ai/chat/:lessonId
//   course_chat   → POST /api/proxy/ai/course-chat/:courseId
//   roadmap_chat  → POST /api/proxy/ai/roadmap-chat
//
// The public API (messages / connection / isStreaming / send / reset /
// reconnect) is unchanged, so consumer components keep working as-is.

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

export type AiChatEvent = "lesson_chat" | "course_chat" | "roadmap_chat";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Assistant message is still being generated. */
  pending?: boolean;
  /** This message is an error notice rather than a real reply. */
  error?: boolean;
}

export type AiConnectionState =
  | "connecting"
  | "connected"
  | "unauthenticated"
  | "error";

interface UseAiChatOptions {
  event: AiChatEvent;
  /** Extra fields for the request (e.g. { lessonId } / { courseId } / { goal }). */
  context: Record<string, unknown>;
  /** When this value changes the conversation resets. */
  resetKey: string;
  /** Defer until true (e.g. the panel is collapsed). */
  enabled?: boolean;
}

interface UseAiChatResult {
  messages: AiChatMessage[];
  connection: AiConnectionState;
  /** True while an assistant reply is being generated. */
  isStreaming: boolean;
  send: (message: string) => void;
  reset: () => void;
  reconnect: () => void;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Resolve the REST endpoint + extra body fields for a given tier. */
function resolveRequest(
  event: AiChatEvent,
  context: Record<string, unknown>,
): { url: string; extra: Record<string, unknown> } | null {
  switch (event) {
    case "lesson_chat": {
      const lessonId = context.lessonId as string | undefined;
      return lessonId ? { url: `${API_BASE}/ai/chat/${lessonId}`, extra: {} } : null;
    }
    case "course_chat": {
      const courseId = context.courseId as string | undefined;
      return courseId
        ? { url: `${API_BASE}/ai/course-chat/${courseId}`, extra: {} }
        : null;
    }
    case "roadmap_chat": {
      const goal = (context.goal as string | undefined) ?? "";
      return { url: `${API_BASE}/ai/roadmap-chat`, extra: { goal } };
    }
  }
}

export function useAiChat({
  event,
  context,
  resetKey,
  enabled = true,
}: UseAiChatOptions): UseAiChatResult {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [connection, setConnection] = useState<AiConnectionState>("connecting");
  const [isStreaming, setIsStreaming] = useState(false);

  // Mirror of `messages` so `send()` can read history without a stale closure.
  const messagesRef = useRef<AiChatMessage[]>([]);
  // Latest `context` without re-creating `send` each render.
  const contextRef = useRef(context);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    contextRef.current = context;
  });

  // Reset the transcript whenever the conversation identity changes (e.g.
  // switching lessons). Adjusting state during render on a changed key is
  // React's recommended pattern.
  const [trackedKey, setTrackedKey] = useState(resetKey);
  if (trackedKey !== resetKey) {
    setTrackedKey(resetKey);
    setMessages([]);
    setIsStreaming(false);
    setConnection("connecting");
  }

  // No socket to open — once enabled we're ready. The proxy supplies the JWT.
  useEffect(() => {
    if (!enabled) return;
    setConnection("connected");
  }, [enabled, event, resetKey]);

  const reconnect = useCallback(() => setConnection("connected"), []);
  const reset = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
  }, []);

  // ── Send a message ──────────────────────────────────────────────────────────
  const send = useCallback(
    (raw: string) => {
      const message = raw.trim();
      if (!message) return;

      const request = resolveRequest(event, contextRef.current);
      if (!request) return;

      // History = completed turns only (skip pending / error placeholders).
      const history = messagesRef.current
        .filter((m) => !m.pending && !m.error)
        .map((m) => ({ role: m.role, content: m.content }));

      const userMsg: AiChatMessage = {
        id: randomId(),
        role: "user",
        content: message,
      };
      const assistantMsg: AiChatMessage = {
        id: randomId(),
        role: "assistant",
        content: "",
        pending: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const finishWith = (patch: Partial<AiChatMessage>) =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, pending: false, ...patch } : m,
          ),
        );

      const appendToken = (chunk: string) =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: m.content + chunk }
              : m,
          ),
        );

      void (async () => {
        try {
          const res = await fetch(request.url, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify({ message, history, ...request.extra }),
          });

          if (res.status === 401) {
            setConnection("unauthenticated");
            finishWith({
              error: true,
              content: "Please log in to use the AI tutor.",
            });
            return;
          }

          // Access / validation errors come back as normal JSON (not a stream).
          if (!res.ok || !res.body) {
            const err = await res.json().catch(() => ({}));
            const raw = (err as { message?: unknown })?.message;
            const text = Array.isArray(raw)
              ? raw.join(", ")
              : typeof raw === "string"
                ? raw
                : "The AI tutor is unavailable right now. Please try again.";
            finishWith({ error: true, content: text });
            return;
          }

          // Read the SSE stream: `data: {json}` frames separated by a blank line.
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let streamError: string | null = null;

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const frames = buffer.split("\n\n");
            buffer = frames.pop() ?? "";
            for (const frame of frames) {
              const dataLine = frame
                .split("\n")
                .find((l) => l.startsWith("data:"));
              if (!dataLine) continue;
              const payload = dataLine.slice(5).trim();
              if (!payload) continue;
              try {
                const data = JSON.parse(payload) as {
                  type: string;
                  value?: string;
                  message?: string;
                };
                if (data.type === "token" && data.value) {
                  appendToken(data.value);
                } else if (data.type === "error") {
                  streamError = data.message || "AI service error";
                }
              } catch {
                /* ignore malformed frame */
              }
            }
          }

          if (streamError) {
            finishWith({ error: true, content: streamError });
          } else {
            // Clear pending; keep accumulated text (fallback if empty).
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? {
                      ...m,
                      pending: false,
                      content:
                        m.content.trim() ||
                        "I couldn't generate a response. Please try again.",
                    }
                  : m,
              ),
            );
          }
        } catch {
          finishWith({
            error: true,
            content: "Network error. Please try again.",
          });
        } finally {
          setIsStreaming(false);
        }
      })();
    },
    [event],
  );

  return { messages, connection, isStreaming, send, reset, reconnect };
}
