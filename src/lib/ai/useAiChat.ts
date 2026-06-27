"use client";
// Reusable client hook for the EduGenie AI tutor WebSocket (NestJS `/ai`
// gateway). One hook drives all three tiers — lesson / course / roadmap — by
// swapping the `event` name and the `context` fields merged into each emit.
//
// Wire protocol (per request, correlated by requestId):
//   client emits  event            { requestId, ...context, message, history }
//   server emits  'token'          { requestId, token }   // repeated, word-by-word
//   server emits  'done'           { requestId }          // stream finished
//   server emits  'error'          { requestId?, message } // stream / auth failure
//
// The gateway authenticates the socket once at handshake time via a JWT passed
// in `auth.token`; we fetch that token from our own `/api/ai/token` route
// (which reads the httpOnly cookie server-side).

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_AI_WS_URL || "http://localhost:5000";

export type AiChatEvent = "lesson_chat" | "course_chat" | "roadmap_chat";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Assistant message is still receiving tokens. */
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
  /** Extra fields merged into every emit (e.g. { lessonId } / { courseId } / { goal }). */
  context: Record<string, unknown>;
  /** When this value changes the conversation resets and the socket reconnects. */
  resetKey: string;
  /** Defer connecting until true (e.g. the panel is collapsed). */
  enabled?: boolean;
}

interface UseAiChatResult {
  messages: AiChatMessage[];
  connection: AiConnectionState;
  /** True while an assistant reply is streaming in. */
  isStreaming: boolean;
  send: (message: string) => void;
  reset: () => void;
  /** Re-attempt the handshake after an auth/transport failure. */
  reconnect: () => void;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

  const socketRef = useRef<Socket | null>(null);
  // requestId → the assistant message id currently being filled by that stream.
  const pendingRef = useRef<Map<string, string>>(new Map());
  // Mirror of `messages` so `send()` can read history without a stale closure.
  const messagesRef = useRef<AiChatMessage[]>([]);
  // Latest `context` without forcing a reconnect each render.
  const contextRef = useRef(context);
  const [reconnectNonce, setReconnectNonce] = useState(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    contextRef.current = context;
  });

  // Reset the transcript and mark "connecting" whenever the conversation
  // identity changes (e.g. switching lessons). Adjusting state during render on
  // a changed key is React's recommended pattern — it avoids the cascading
  // renders that a setState-in-effect would cause.
  const [trackedKey, setTrackedKey] = useState(resetKey);
  if (trackedKey !== resetKey) {
    setTrackedKey(resetKey);
    setMessages([]);
    setIsStreaming(false);
    setConnection("connecting");
  }

  const reconnect = useCallback(() => {
    setConnection("connecting");
    setReconnectNonce((n) => n + 1);
  }, []);
  const reset = useCallback(() => {
    pendingRef.current.clear();
    setMessages([]);
    setIsStreaming(false);
  }, []);

  // ── Connection lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    // Drop any stream-id mappings from a previous lesson/connection.
    pendingRef.current.clear();

    const connect = async () => {
      let token: string | null = null;
      try {
        const res = await fetch("/api/ai/token", { cache: "no-store" });
        if (res.ok) {
          token = (await res.json())?.token ?? null;
        }
      } catch {
        /* fall through to the no-token branch */
      }

      if (disposed) return;
      if (!token) {
        setConnection("unauthenticated");
        return;
      }

      const socket = io(`${WS_URL}/ai`, {
        auth: { token },
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnectionAttempts: 4,
        timeout: 12000,
      });
      socketRef.current = socket;

      socket.on("connect", () => setConnection("connected"));

      socket.on("connect_error", () => {
        if (!disposed) setConnection("error");
      });

      socket.on("token", ({ requestId, token: chunk }: { requestId?: string; token: string }) => {
        const msgId = requestId ? pendingRef.current.get(requestId) : undefined;
        if (!msgId) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, content: m.content + chunk } : m,
          ),
        );
      });

      socket.on("done", ({ requestId }: { requestId?: string }) => {
        const msgId = requestId ? pendingRef.current.get(requestId) : undefined;
        if (requestId) pendingRef.current.delete(requestId);
        if (msgId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
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
        if (pendingRef.current.size === 0) setIsStreaming(false);
      });

      socket.on("error", ({ requestId, message }: { requestId?: string; message: string }) => {
        // Stream-scoped error → turn the pending bubble into an error notice.
        const msgId = requestId ? pendingRef.current.get(requestId) : undefined;
        if (requestId && msgId) {
          pendingRef.current.delete(requestId);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? { ...m, pending: false, error: true, content: message }
                : m,
            ),
          );
          if (pendingRef.current.size === 0) setIsStreaming(false);
          return;
        }
        // Connection-scoped error (e.g. "Unauthorized" before any request).
        if (!disposed) {
          setConnection(
            /unauthor/i.test(message) ? "unauthenticated" : "error",
          );
        }
      });
    };

    void connect();

    return () => {
      disposed = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [enabled, event, resetKey, reconnectNonce]);

  // ── Send a message ──────────────────────────────────────────────────────────
  const send = useCallback(
    (raw: string) => {
      const message = raw.trim();
      const socket = socketRef.current;
      if (!message || !socket || !socket.connected) return;

      // History = completed turns only (skip the streaming/error placeholders).
      const history = messagesRef.current
        .filter((m) => !m.pending && !m.error)
        .map((m) => ({ role: m.role, content: m.content }));

      const requestId = randomId();
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

      pendingRef.current.set(requestId, assistantMsg.id);
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      socket.emit(event, {
        requestId,
        ...contextRef.current,
        message,
        history,
      });
    },
    [event],
  );

  return { messages, connection, isStreaming, send, reset, reconnect };
}
