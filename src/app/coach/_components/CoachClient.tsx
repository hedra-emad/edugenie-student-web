'use client';
// _components/CoachClient.tsx
// Tier-4 AI Learning Coach. Choice-first: the page opens on a starter screen and
// nothing is sent until the student picks a prompt (or types one) — this also
// keeps the Bedrock "start with a user message" rule. A deterministic snapshot
// (progress + weak spots) feeds the stats strip; active recovery plans surface
// above the chat.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAiChat } from '@/lib/ai/useAiChat';
import {
  MessageBubble,
  StateNotice,
  SendIcon,
  RefreshIcon,
  SparkleIcon,
} from '@/components/ai/chatUi';
import PracticeQuizModal from '@/components/ai/PracticeQuizModal';
import Button from '@/components/ui/Button';
import RecoveryPlanCard from '@/components/ai/RecoveryPlanCard';
import {
  getActiveRemediation,
  type RemediationPlan,
} from '@/lib/api/remediation';
import {
  getCoachSnapshot,
  getCoachMissions,
  setCoachGoal,
  type CoachSnapshot,
  type CoachStreak,
  type CoachGoal,
  type CoachInProgress,
  type CoachMissions,
  type CoachMission,
} from '@/lib/api/coach';

// Sentinel: this starter scrolls to the recovery card instead of sending.
const RECOVER_STARTER = '__recover__';

// Weekly-goal presets offered when the student hasn't set a goal yet.
const GOAL_PRESETS = [1, 3, 5, 7];

interface Starter {
  label: string;
  sub: string;
  prompt: string;
  icon: 'compass' | 'target' | 'chart' | 'shield';
}

const STARTERS: Starter[] = [
  {
    label: 'Where am I?',
    sub: 'Progress across my courses',
    prompt: 'Where am I in my learning, and what should I focus on next?',
    icon: 'compass',
  },
  {
    label: 'What next?',
    sub: 'Pick my next lesson',
    prompt: 'What is the single most important thing I should work on next?',
    icon: 'target',
  },
  {
    label: 'My weak spots',
    sub: 'Where I keep slipping',
    prompt:
      'Which topics am I weakest in based on my quiz scores, and how do I fix them?',
    icon: 'chart',
  },
  {
    label: 'Recovery plan',
    sub: 'Bounce back from a fail',
    prompt: RECOVER_STARTER,
    icon: 'shield',
  },
];

export default function CoachClient() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [snapshot, setSnapshot] = useState<CoachSnapshot | null>(null);
  const [missions, setMissions] = useState<CoachMissions | null>(null);
  const [recovery, setRecovery] = useState<RemediationPlan[]>([]);
  const [savingGoal, setSavingGoal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
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

  // Deterministic snapshot + active recovery plans.
  const fetchAux = useCallback(async () => {
    const [s, m] = await Promise.all([getCoachSnapshot(), getCoachMissions()]);
    if (s) setSnapshot(s);
    if (m) setMissions(m);
    setRecovery(await getActiveRemediation());
  }, []);
  useEffect(() => {
    void fetchAux();
  }, [fetchAux]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const ready = connection === 'connected';
  const canSend = ready && !isStreaming && input.trim().length > 0;
  const notStarted = messages.length === 0;

  const startWith = (prompt: string) => {
    if (prompt === RECOVER_STARTER) {
      if (recovery.length > 0) {
        document
          .getElementById(`recovery-${recovery[0].sectionId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        send('I recently struggled with a section. How can I recover?');
      }
      return;
    }
    if (ready) send(prompt);
  };

  const handleSetGoal = async (n: number) => {
    if (savingGoal) return;
    setSavingGoal(true);
    try {
      setSnapshot(await setCoachGoal(n));
    } catch {
      /* keep the current view; the picker stays available */
    } finally {
      setSavingGoal(false);
    }
  };

  // Deterministic follow-up actions offered after an assistant reply (the
  // gateway has no tool-calling, so we wire chips to the real modals/links).
  const followUps: { label: string; run: () => void }[] = [];
  if (snapshot) {
    const w = snapshot.weakSpots[0];
    if (w) {
      followUps.push({
        label: `Quiz me on ${w.sectionTitle}`,
        run: () =>
          setQuizSection({
            sectionId: w.sectionId,
            label: `${w.courseTitle} › ${w.sectionTitle}`,
          }),
      });
    }
    const resume =
      snapshot.inProgress.find((c) => c.stalled) ?? snapshot.inProgress[0];
    if (resume) {
      followUps.push({
        label: `Resume ${resume.title}`,
        run: () => router.push(`/learn/${resume.courseId}`),
      });
    }
    if (snapshot.goal) {
      followUps.push({
        label: 'How am I tracking my goal?',
        run: () => send('How am I tracking against my weekly goal?'),
      });
    }
  }
  if (recovery.length) {
    followUps.push({
      label: 'See my recovery plan',
      run: () =>
        document
          .getElementById(`recovery-${recovery[0].sectionId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    });
  }
  followUps.push({
    label: 'What should I focus on next?',
    run: () => send('What is the single most important thing I should work on next?'),
  });
  const lastMessage = messages[messages.length - 1];
  const showFollowUps =
    !notStarted &&
    !isStreaming &&
    lastMessage?.role === 'assistant' &&
    !lastMessage.pending &&
    !lastMessage.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    send(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const refresh = () => {
    reset();
    void fetchAux();
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
            Your coach sets you a few missions each day, tracks them from your
            real progress, and rewards you with XP. Clear the board, keep the
            streak.
          </p>
        </div>
      </div>

      {/* Streak + weekly goal */}
      {snapshot && snapshot.totalCourses > 0 && (
        <GoalStreakBar
          streak={snapshot.streak}
          goal={snapshot.goal}
          saving={savingGoal}
          onSetGoal={handleSetGoal}
        />
      )}

      {/* Today's missions (the hero) */}
      {missions && (
        <MissionBoard
          data={missions}
          onQuiz={(sectionId, label) => setQuizSection({ sectionId, label })}
          onResume={(courseId) => router.push(`/learn/${courseId}`)}
          onBrowse={() =>
            router.push(
              snapshot?.inProgress[0]
                ? `/learn/${snapshot.inProgress[0].courseId}`
                : '/courses',
            )
          }
        />
      )}

      {/* Continue where you left off */}
      {snapshot && snapshot.inProgress.length > 0 && (
        <ContinueCards items={snapshot.inProgress} />
      )}

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

      {/* Active recovery plans */}
      <RecoveryPlanCard plans={recovery} />

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
                <Button
                  size="sm"
                  onClick={() =>
                    setQuizSection({
                      sectionId: w.sectionId,
                      label: `${w.courseTitle} › ${w.sectionTitle}`,
                    })
                  }
                  leftIcon={<SparkleIcon className="h-3.5 w-3.5" />}
                  className="flex-shrink-0"
                >
                  Quiz me
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ask the coach — secondary, collapsed by default */}
      <button
        type="button"
        onClick={() => setChatOpen((v) => !v)}
        className="mt-2 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-[#3B1892]/40"
      >
        <span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-700">
          <SparkleIcon className="h-4 w-4 text-[#3B1892]" />
          Ask the coach a question
        </span>
        <span className="text-[12px] font-medium text-slate-400">
          {chatOpen ? 'Hide' : 'Open'}
        </span>
      </button>

      {/* Chat card (secondary) */}
      {chatOpen && (
      <div className="mt-3 flex h-[70vh] min-h-[540px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
          {!notStarted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isStreaming}
              leftIcon={<RefreshIcon className="h-3.5 w-3.5" />}
            >
              New chat
            </Button>
          )}
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-5 sm:px-6"
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
            <StarterScreen ready={ready} onPick={startWith} />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {showFollowUps && (
                <div className="flex flex-wrap gap-2 pt-1 pl-10">
                  {followUps.slice(0, 4).map((f) => (
                    <Chip key={f.label} onClick={f.run}>
                      {f.label}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
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
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className="flex-shrink-0"
            aria-label="Send message"
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </form>
      </div>
      )}

      {/* Targeted practice quiz */}
      {quizSection && (
        <PracticeQuizModal
          sectionId={quizSection.sectionId}
          label={quizSection.label}
          onClose={() => {
            setQuizSection(null);
            void fetchAux(); // a passed quiz may complete a mission
          }}
        />
      )}
    </div>
  );
}

// ── Choice-first starter screen (symmetric 2×2 grid) ─────────────────────────
function StarterScreen({
  ready,
  onPick,
}: {
  ready: boolean;
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-6 text-center">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-[#3B1892]">
        <SparkleIcon className="h-6 w-6" />
      </div>
      <h2 className="text-[17px] font-bold text-slate-800">
        How can I help you today?
      </h2>
      <p className="mt-1 max-w-sm text-[13px] text-slate-400">
        Pick a starting point, or just type your own question below.
      </p>

      <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s.label}
            type="button"
            disabled={!ready}
            onClick={() => onPick(s.prompt)}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#3B1892]/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-[#3B1892] transition-colors group-hover:bg-[#3B1892] group-hover:text-white">
              <StarterIcon icon={s.icon} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-bold text-slate-800">
                {s.label}
              </span>
              <span className="block truncate text-[11.5px] text-slate-400">
                {s.sub}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StarterIcon({ icon }: { icon: Starter['icon'] }) {
  const common = {
    className: 'h-5 w-5',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (icon) {
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
        </svg>
      );
    case 'target':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M18 17V9M13 17V5M8 17v-3" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
  }
}

// ── Daily missions board (the hero) ──────────────────────────────────────────
function MissionBoard({
  data,
  onQuiz,
  onResume,
  onBrowse,
}: {
  data: CoachMissions;
  onQuiz: (sectionId: string, label: string) => void;
  onResume: (courseId: string) => void;
  onBrowse: () => void;
}) {
  const xpIntoLevel = data.xpTotal % 100;
  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* XP / level header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 items-center rounded-full bg-[#3B1892] px-3 text-[12px] font-bold text-white">
            Lvl {data.level}
          </span>
          <div>
            <p className="text-[13.5px] font-bold text-slate-800">
              {data.xpTotal} XP
            </p>
            <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#3B1892]"
                style={{ width: `${xpIntoLevel}%` }}
              />
            </div>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-slate-500">
          {data.doneCount}/{data.total} today
        </span>
      </div>

      {/* Missions */}
      <div className="divide-y divide-slate-100">
        {data.missions.map((m) => (
          <MissionRow
            key={m.key}
            mission={m}
            onAction={() => {
              if (m.type === 'weak_spot' && m.sectionId) {
                onQuiz(m.sectionId, m.label);
              } else if (m.type === 'resume_course' && m.courseId) {
                onResume(m.courseId);
              } else {
                onBrowse();
              }
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-3">
        {data.allDone ? (
          <p className="text-center text-[13px] font-semibold text-emerald-600">
            All missions cleared 🎉 +10 XP bonus — come back tomorrow!
          </p>
        ) : (
          <p className="text-center text-[12.5px] text-slate-500">
            {data.note || 'Clear your missions to earn XP and level up.'}
          </p>
        )}
      </div>
    </div>
  );
}

function MissionRow({
  mission,
  onAction,
}: {
  mission: CoachMission;
  onAction: () => void;
}) {
  const cta =
    mission.type === 'weak_spot'
      ? 'Quiz me'
      : mission.type === 'resume_course'
        ? 'Resume'
        : 'Go';
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
          mission.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300'
        }`}
      >
        {mission.done && (
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <p
        className={`min-w-0 flex-1 text-[13.5px] font-medium ${
          mission.done ? 'text-slate-400 line-through' : 'text-slate-700'
        }`}
      >
        {mission.label}
      </p>
      <span className="flex-shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-[#3B1892]">
        +{mission.xp} XP
      </span>
      {!mission.done && (
        <Button size="sm" variant="outline" onClick={onAction} className="flex-shrink-0">
          {cta}
        </Button>
      )}
    </div>
  );
}

// ── Gamification: streak flame + weekly-goal ring / goal picker ──────────────
function GoalStreakBar({
  streak,
  goal,
  saving,
  onSetGoal,
}: {
  streak: CoachStreak;
  goal: CoachGoal | null;
  saving: boolean;
  onSetGoal: (n: number) => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      {/* Streak */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-sm">
          <FlameIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[18px] font-extrabold leading-none text-slate-900">
            {streak.current} day{streak.current === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-[11.5px] font-medium text-slate-400">
            {streak.current > 0
              ? streak.activeToday
                ? 'Streak active today 🔥'
                : 'Study today to keep it alive'
              : 'Start a streak — study today'}
            {streak.longest > 0 && ` · best ${streak.longest}`}
          </p>
        </div>
      </div>

      {/* Weekly goal */}
      {goal ? (
        <div className="flex items-center gap-3">
          <Ring pct={goal.pct} />
          <div>
            <p className="text-[13.5px] font-bold text-slate-800">
              {goal.completedThisWeek}/{goal.target} lessons
            </p>
            <p className="mt-0.5 text-[11.5px] font-medium text-slate-400">
              {goal.remaining > 0
                ? `${goal.remaining} to hit this week's goal`
                : 'Weekly goal reached! 🎉'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <p className="text-[11.5px] font-semibold text-slate-500">
            Set a weekly goal
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_PRESETS.map((n) => (
              <Chip key={n} disabled={saving} onClick={() => onSetGoal(n)}>
                {n}/wk
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#ede9fe" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="#3B1892"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c}`}
      />
      <text
        x="20"
        y="21"
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90"
        transform="rotate(90 20 20)"
        fontSize="10"
        fontWeight="700"
        fill="#3B1892"
      >
        {pct}%
      </text>
    </svg>
  );
}

// ── Continue where you left off ──────────────────────────────────────────────
function ContinueCards({ items }: { items: CoachInProgress[] }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-[12.5px] font-semibold text-slate-500">
        Continue where you left off
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.slice(0, 4).map((c) => (
          <Link
            key={c.courseId}
            href={`/learn/${c.courseId}`}
            className={`group rounded-2xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
              c.stalled ? 'border-amber-200' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-slate-800 group-hover:text-[#3B1892]">
                {c.title}
              </p>
              <span className="flex-shrink-0 text-[12px] font-bold text-[#3B1892]">
                {c.progressPercent}%
              </span>
            </div>
            {c.stalled && (
              <p className="mt-1 text-[11px] font-medium text-amber-600">
                Stalled — jump back in
              </p>
            )}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#3B1892] transition-all"
                style={{ width: `${c.progressPercent}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Small tap-to-act chip (mirrors the roadmap wizard chip styling).
function Chip({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-[#3B1892] hover:bg-violet-50 hover:text-[#3B1892] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.6-2.4C7 8 6 9.6 6 12a6 6 0 0 0 12 0c0-4.4-6-10-6-10z" />
    </svg>
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
