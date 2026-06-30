'use client';
// _components/CoachClient.tsx
// Tier-4 AI Learning Coach. On load it pulls a deterministic learning snapshot
// (progress + weak spots) for the stats strip. The chat is CHOICE-FIRST: the
// coach does NOT speak first — the student picks a starter prompt (or types),
// which becomes the opening user turn (satisfying the Bedrock start-with-user
// rule). Follow-ups are typed in the chat.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAiChat } from '@/lib/ai/useAiChat';
import {
  MessageBubble,
  StateNotice,
  SendIcon,
  RefreshIcon,
  SparkleIcon,
} from '@/components/ai/chatUi';
import PracticeQuizModal from '@/components/ai/PracticeQuizModal';
import RecoveryPlanCard from '@/components/ai/RecoveryPlanCard';
import {
  getActiveRemediation,
  type RemediationPlan,
} from '@/lib/api/remediation';

const SNAPSHOT_URL = '/api/proxy/ai/coach/snapshot';

// When tapped and the student has an active recovery plan, this starter scrolls
// to the plan card instead of chatting.
const RECOVER_STARTER = 'Help me recover a section I keep failing.';

// Conversation starters: a short title + subtitle for a tidy 2×2 grid, and the
// full `prompt` sent to the coach as the opening user turn.
const STARTERS = [
  {
    label: 'Where am I?',
    sub: 'Progress & next step',
    prompt: 'Where am I in my learning, and what should I focus on next?',
  },
  {
    label: 'Review weak spots',
    sub: 'What to revisit',
    prompt: 'Review my weak spots and tell me what to revisit.',
  },
  {
    label: 'Plan my week',
    sub: 'Build a study schedule',
    prompt: 'Plan my study week.',
  },
  {
    label: 'Recover a section',
    sub: 'Get back on track',
    prompt: RECOVER_STARTER,
  },
] as const;

interface Snapshot {
  totalCourses: number;
  completedCount: number;
  inProgressCount: number;
  stalledCount: number;
  notStartedCount: number;
  weakSpotCount: number;
  recentAvgScore: number | null;
  inProgress: {
    courseId: string;
    title: string;
    progressPercent: number;
    stalled: boolean;
  }[];
  weakSpots: {
    courseId: string;
    sectionId: string;
    courseTitle: string;
    sectionTitle: string;
    score: number;
    passed: boolean;
  }[];
}

export default function CoachClient() {
  const [input, setInput] = useState('');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [recovery, setRecovery] = useState<RemediationPlan[]>([]);
  const [quizSection, setQuizSection] = useState<{
    sectionId: string;
    label: string;
  } | null>(null);

  const { messages, connection, isStreaming, send, reset, reconnect } =
    useAiChat({
      event: 'coach_chat',
      context: {},
      resetKey: 'coach',
    });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pull the snapshot for the stats strip.
  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(SNAPSHOT_URL, { credentials: 'include' });
      if (res.ok) setSnapshot((await res.json()) as Snapshot);
    } catch {
      /* non-fatal — the chat still works without the strip */
    }
  }, []);
  useEffect(() => {
    void fetchSnapshot();
    void getActiveRemediation().then(setRecovery);
  }, [fetchSnapshot]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const ready = connection === 'connected';
  const canSend = ready && !isStreaming && input.trim().length > 0;

  // The conversation hasn't started until the student picks a starter or types.
  const notStarted = messages.length === 0;

  // Send a starter prompt as the opening user turn. The recovery starter jumps
  // to the plan card instead of chatting when the student actually has one.
  const startWith = (prompt: string) => {
    if (prompt === RECOVER_STARTER && recovery.length > 0) {
      document
        .getElementById(`recovery-${recovery[0].sectionId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (!ready || isStreaming) return;
    send(prompt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    send(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const refresh = () => {
    reset(); // back to the choice-first starter screen
    void fetchSnapshot();
    void getActiveRemediation().then(setRecovery);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      {/* Hero */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B1892] to-[#5B3DB8] text-white shadow-md">
          <SparkleIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            AI Learning Coach
          </h1>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-slate-500">
            I read your real progress and quiz results, then tell you exactly
            what to focus on next — and where to shore up weak spots.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      {snapshot && snapshot.totalCourses > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="In progress" value={snapshot.inProgressCount} />
          <Stat label="Completed" value={snapshot.completedCount} />
          <Stat
            label="Avg quiz score"
            value={
              snapshot.recentAvgScore !== null
                ? `${snapshot.recentAvgScore}%`
                : '—'
            }
          />
          <Stat
            label="Weak spots"
            value={snapshot.weakSpotCount}
            warn={snapshot.weakSpotCount > 0}
          />
        </div>
      )}

      {/* Weak spots — drill them with a targeted quiz */}
      {snapshot && snapshot.weakSpots.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-700">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            Trouble spots — quiz yourself to improve
          </p>
          <div className="space-y-2">
            {snapshot.weakSpots.map((w) => (
              <div
                key={w.sectionId}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-700">
                    {w.sectionTitle}
                  </p>
                  <p className="truncate text-[11.5px] text-slate-400">
                    {w.courseTitle} · last score {w.score}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuizSection({
                      sectionId: w.sectionId,
                      label: `${w.courseTitle} › ${w.sectionTitle}`,
                    })
                  }
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#3B1892] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#2A1069]"
                >
                  <SparkleIcon className="h-3.5 w-3.5" />
                  Quiz me
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active quiz-recovery plans (failed a section 3×) */}
      <RecoveryPlanCard plans={recovery} />

      {/* Chat card */}
      <div className="flex h-[70vh] min-h-[540px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Connection strip */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-slate-400">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                ready
                  ? 'bg-green-500'
                  : connection === 'connecting'
                    ? 'animate-pulse bg-amber-400'
                    : 'bg-slate-300'
              }`}
            />
            {ready
              ? 'Coaching from your progress'
              : connection === 'connecting'
                ? 'Connecting…'
                : 'Offline'}
          </p>
          <button
            type="button"
            onClick={refresh}
            disabled={isStreaming}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
        >
          {connection === 'unauthenticated' ? (
            <StateNotice
              title="Sign in to use the coach"
              body="Your session has expired. Please log in again to see your coaching."
            />
          ) : connection === 'error' ? (
            <StateNotice
              title="Couldn't reach the coach"
              body="The assistant is temporarily unavailable."
              action={{ label: 'Try again', onClick: reconnect }}
            />
          ) : notStarted ? (
            <div className="flex h-full flex-col items-center justify-center px-2 py-4 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B1892] to-[#5B3DB8] text-white shadow-md">
                <SparkleIcon className="h-6 w-6" />
              </div>
              <p className="text-[17px] font-bold tracking-tight text-slate-800">
                Where would you like to start?
              </p>
              <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-400">
                Pick a starting point and I&apos;ll coach you from your real
                progress — or just ask your own question below.
              </p>
              <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button
                    key={s.prompt}
                    type="button"
                    onClick={() => startWith(s.prompt)}
                    disabled={!ready || isStreaming}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#3B1892]/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#3B1892]/10 text-[#3B1892] transition-colors group-hover:bg-[#3B1892] group-hover:text-white">
                      <SparkleIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold text-slate-800">
                        {s.label}
                      </span>
                      <span className="block text-[11.5px] text-slate-400">
                        {s.sub}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              {!ready && (
                <p className="mt-5 text-[11.5px] text-slate-400">Connecting…</p>
              )}
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-shrink-0 items-center gap-2 border-t border-slate-100 px-3 py-3 sm:px-4"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!ready}
            placeholder={
              ready
                ? 'Ask your coach anything about your learning…'
                : 'Connecting…'
            }
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3B1892] focus:ring-1 focus:ring-[#3B1892] disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-[#3B1892] text-white transition-all hover:bg-[#2A1069] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Targeted practice quiz */}
      {quizSection && (
        <PracticeQuizModal
          sectionId={quizSection.sectionId}
          label={quizSection.label}
          onClose={() => setQuizSection(null)}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p
        className={`text-[20px] font-bold leading-none ${
          warn ? 'text-amber-600' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] font-medium text-slate-400">{label}</p>
    </div>
  );
}
