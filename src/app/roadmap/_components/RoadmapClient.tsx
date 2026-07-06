"use client";
// _components/RoadmapClient.tsx
// Tier-3 advisor — a quick tap-to-pick intake, then one tap builds a STRUCTURED,
// buyable learning path: ordered milestones recommending real courses (or
// specific sections), with prices and an "Add all to cart" CTA. Builds are
// capped (3 lifetime per user).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RouteIcon } from "@/components/ai/chatUi";
import Button from "@/components/ui/Button";
import {
  buildRoadmap,
  getRoadmapQuota,
  getActiveRoadmap,
  updateRoadmap,
  deleteRoadmap,
  saveRoadmap,
  toMilestoneEdits,
  type Roadmap,
  type RoadmapMilestone,
  type RoadmapItem,
} from "@/lib/api/roadmap";
import { fetchCourses } from "@/lib/api/courses";
import { DEFAULT_FILTERS } from "@/types/course";
import {
  fetchAccessMap,
  isOwned,
  type Access,
} from "@/lib/api/roadmapAccess";
import { addToCartAction } from "@/app/actions/cart.actions";

const GOAL_IDEAS = [
  "Become a full-stack web developer",
  "Break into data science",
  "Land a UI/UX design role",
  "Prepare for a backend engineering job",
];
const LEVELS = ["Complete beginner", "Some basics", "Intermediate", "Advanced"];
const TIMES = ["Under 5 hrs/week", "5–10 hrs/week", "10–20 hrs/week", "20+ hrs/week"];
const TIMELINES = ["1 month", "3 months", "6 months", "1 year", "Flexible"];
const PREFS = [
  "Hands-on projects",
  "Strong fundamentals",
  "Fast results",
  "Certification",
  "Interview prep",
  "Build a portfolio",
];

type Phase = "intake" | "building" | "result" | "error";

export default function RoadmapClient({ firstName = "" }: { firstName?: string }) {
  const router = useRouter();

  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [time, setTime] = useState("");
  const [timeline, setTimeline] = useState("");
  const [prefs, setPrefs] = useState<string[]>([]);
  const [specifics, setSpecifics] = useState("");

  const [phase, setPhase] = useState<Phase>("intake");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Live ownership of the roadmap's items (mark owned + price the remainder).
  const [access, setAccess] = useState<Map<string, Access>>(new Map());

  // Save & buy later + the start-new (overwrite) confirmation.
  const [savingPlan, setSavingPlan] = useState(false);
  const [savedNote, setSavedNote] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);

  // Editing state (curate the saved roadmap: remove / reorder / add).
  const [editing, setEditing] = useState(false);
  const [editMs, setEditMs] = useState<RoadmapMilestone[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [addToMilestone, setAddToMilestone] = useState<number | null>(null);

  // On mount: load quota AND rehydrate the single active roadmap so returning
  // from a course link (or a page reload) shows the saved plan, not the wizard.
  useEffect(() => {
    getRoadmapQuota()
      .then(setRemaining)
      .catch(() => setRemaining(0));
    getActiveRoadmap()
      .then((r) => {
        if (r) {
          setRoadmap(r);
          setPhase("result");
        }
      })
      .catch(() => {});
  }, []);

  // Refresh per-item ownership whenever the roadmap's items change (build,
  // rehydrate, save) — also picks up newly-owned items after returning from a
  // purchase. Keyed on the set of courseIds so it re-runs only when it must.
  const courseIdsKey = roadmap
    ? [...new Set(roadmap.items.map((i) => i.courseId))].sort().join(",")
    : "";
  useEffect(() => {
    if (!courseIdsKey) {
      setAccess(new Map());
      return;
    }
    let cancelled = false;
    fetchAccessMap(courseIdsKey.split(","))
      .then((m) => {
        if (!cancelled) setAccess(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [courseIdsKey]);

  const left = remaining ?? 0;
  const canBuild =
    phase !== "building" &&
    left > 0 &&
    goal.trim().length > 0 &&
    !!level &&
    !!time &&
    !!timeline;

  const togglePref = (p: string) =>
    setPrefs((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const build = async () => {
    if (!canBuild) return;
    setPhase("building");
    setError("");
    setSavedNote("");
    try {
      const r = await buildRoadmap({
        goal: goal.trim(),
        level,
        time,
        timeline,
        focus: prefs,
        notes: specifics.trim() || undefined,
      });
      setRoadmap(r);
      if (typeof r.generationsRemaining === "number") {
        setRemaining(r.generationsRemaining);
      }
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't build your roadmap.");
      setPhase("error");
      getRoadmapQuota()
        .then(setRemaining)
        .catch(() => {});
    }
  };

  // Items the student doesn't already own — the only ones we charge/add.
  const remainingItems = roadmap
    ? roadmap.items.filter((i) => !isOwned(i, access))
    : [];
  const remainingPrice = remainingItems.reduce((s, i) => s + i.price, 0);
  const ownedCount = roadmap ? roadmap.items.length - remainingItems.length : 0;
  const allOwned =
    !!roadmap && roadmap.items.length > 0 && remainingItems.length === 0;

  const addRemainingToCart = async () => {
    if (!roadmap || !remainingItems.length || adding) return;
    setAdding(true);
    setAddError("");
    const payloads = remainingItems.map((i) =>
      i.type === "section"
        ? { courseId: i.courseId, sectionId: i.sectionId as string, type: "section" as const }
        : { courseId: i.courseId, type: "full_course" as const },
    );
    const res = await addToCartAction(payloads);
    if (res.success) {
      router.push("/cart");
    } else {
      setAddError(res.error ?? "Could not add items to cart");
      setAdding(false);
    }
  };

  const buildAnother = () => {
    setRoadmap(null);
    setPhase("intake");
    setAddError("");
    setEditing(false);
  };

  // ── Editing ────────────────────────────────────────────────────────────────
  const startEdit = () => {
    if (!roadmap) return;
    // Deep copy so edits are cancellable.
    setEditMs(roadmap.milestones.map((m) => ({ ...m, items: [...m.items] })));
    setEditError("");
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setAddToMilestone(null);
    setEditError("");
  };

  const swap = <T,>(arr: T[], i: number, j: number): T[] => {
    if (j < 0 || j >= arr.length) return arr;
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };
  const moveMilestone = (mi: number, dir: -1 | 1) =>
    setEditMs((ms) => swap(ms, mi, mi + dir));
  const removeMilestone = (mi: number) =>
    setEditMs((ms) => ms.filter((_, i) => i !== mi));
  const moveItem = (mi: number, ii: number, dir: -1 | 1) =>
    setEditMs((ms) =>
      ms.map((m, i) =>
        i === mi ? { ...m, items: swap(m.items, ii, ii + dir) } : m,
      ),
    );
  const removeItem = (mi: number, ii: number) =>
    setEditMs((ms) =>
      ms.map((m, i) =>
        i === mi ? { ...m, items: m.items.filter((_, j) => j !== ii) } : m,
      ),
    );
  const addItemToMilestone = (mi: number, item: RoadmapItem) => {
    setEditMs((ms) =>
      ms.map((m, i) => {
        if (i !== mi) return m;
        const dup = m.items.some(
          (x) =>
            x.courseId === item.courseId &&
            x.type === item.type &&
            x.sectionId === item.sectionId,
        );
        return dup ? m : { ...m, items: [...m.items, item] };
      }),
    );
    setAddToMilestone(null);
  };

  const saveEdits = async () => {
    if (!roadmap || saving) return;
    const nonEmpty = editMs.filter((m) => m.items.length > 0);
    if (nonEmpty.length === 0) {
      setEditError("Keep at least one item, or delete the roadmap instead.");
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      const updated = await updateRoadmap(roadmap.id, toMilestoneEdits(nonEmpty));
      setRoadmap(updated);
      setEditing(false);
      setAddToMilestone(null);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRoadmapHandler = async () => {
    if (!roadmap) return;
    try {
      await deleteRoadmap(roadmap.id);
    } catch {
      /* ignore — treat as gone */
    }
    buildAnother();
  };

  // Live plan total while editing (server re-dedupes on save).
  const editTotal = editMs
    .flatMap((m) => m.items)
    .reduce((s, i) => s + (i.price ?? 0), 0);

  // ── Save & buy later / start a new roadmap ──────────────────────────────────
  const savePlan = async (): Promise<boolean> => {
    if (!roadmap || savingPlan) return false;
    setSavingPlan(true);
    try {
      await saveRoadmap(roadmap.id);
      return true;
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Couldn't save the roadmap.");
      return false;
    } finally {
      setSavingPlan(false);
    }
  };

  // "Save & buy later" — park it in the profile, then return to a fresh builder.
  const handleSavePlan = async () => {
    if (await savePlan()) {
      buildAnother();
      setSavedNote("Saved to your profile — find it under My Roadmaps. Build another anytime.");
    }
  };

  // Start a new roadmap: the active draft is unsaved, so confirm first.
  const startNewRoadmap = () => {
    if (roadmap) setConfirmNew(true);
    else buildAnother();
  };
  const startFresh = () => {
    setConfirmNew(false);
    buildAnother(); // next build overwrites the (unsaved) active draft
  };
  const saveThenNew = async () => {
    if (await savePlan()) {
      setConfirmNew(false);
      buildAnother();
      setSavedNote("Saved to your profile. Building a new roadmap won't touch it.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      {/* Hero */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B1892] to-[#5B3DB8] text-white shadow-md">
          <RouteIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            Career Roadmap Advisor
          </h1>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-slate-500">
            Answer a few taps{firstName ? `, ${firstName}` : ""} and I&apos;ll
            build a step-by-step path of real courses — buy the whole plan in one
            click.
          </p>
        </div>
        {remaining !== null && (
          <span className="flex-shrink-0 rounded-full bg-violet-50 px-3 py-1 text-[11.5px] font-semibold text-[#3B1892]">
            {left} of 3 left this month
          </span>
        )}
      </div>

      {/* Add-course picker (catalog search) */}
      {addToMilestone !== null && (
        <AddCoursePicker
          onClose={() => setAddToMilestone(null)}
          onPick={(item) => addItemToMilestone(addToMilestone, item)}
        />
      )}

      {/* Start-new confirmation (the active draft is unsaved) */}
      {confirmNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmNew(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[15px] font-bold text-slate-900">Start a new roadmap?</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              Your current roadmap is a draft. Building a new one for a different
              topic will replace it. Save it to your profile first to keep it.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button fullWidth loading={savingPlan} onClick={saveThenNew}>
                Save &amp; start new
              </Button>
              <Button variant="outline" fullWidth onClick={startFresh} disabled={savingPlan}>
                Start fresh (discard draft)
              </Button>
              <Button variant="ghost" fullWidth size="sm" onClick={() => setConfirmNew(false)} disabled={savingPlan}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="flex min-h-[460px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {phase === "building" ? (
            <Centered>
              <span className="inline-block h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#3B1892]" />
              <p className="mt-4 text-[14px] font-semibold text-slate-700">
                Designing your roadmap…
              </p>
              <p className="mt-1 text-[12.5px] text-slate-400">
                Matching your goal to real courses and sections.
              </p>
            </Centered>
          ) : phase === "error" ? (
            <Centered>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </div>
              <p className="text-[13.5px] font-medium text-slate-600">{error}</p>
              <Button size="sm" onClick={() => setPhase("intake")} className="mt-4">
                Back
              </Button>
            </Centered>
          ) : phase === "result" && roadmap ? (
            <RoadmapResult
              roadmap={roadmap}
              access={access}
              editing={editing}
              editMs={editMs}
              remaining={left}
              onMoveMilestone={moveMilestone}
              onRemoveMilestone={removeMilestone}
              onMoveItem={moveItem}
              onRemoveItem={removeItem}
              onAddToMilestone={setAddToMilestone}
            />
          ) : (
            <IntakeWizard
              firstName={firstName}
              goal={goal}
              setGoal={setGoal}
              level={level}
              setLevel={setLevel}
              time={time}
              setTime={setTime}
              timeline={timeline}
              setTimeline={setTimeline}
              prefs={prefs}
              togglePref={togglePref}
              specifics={specifics}
              setSpecifics={setSpecifics}
              disabled={left <= 0}
            />
          )}
        </div>

        {/* Footer */}
        {phase === "result" && roadmap ? (
          <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 sm:px-4">
            {(addError || editError) && (
              <p className="mb-2 text-center text-[12px] text-red-500">
                {editError || addError}
              </p>
            )}
            {editing ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <p className="text-[11px] text-slate-400">Plan total</p>
                    <p className="text-[20px] font-extrabold leading-none text-slate-900">
                      ${editTotal}
                    </p>
                  </div>
                  <Button
                    onClick={saveEdits}
                    loading={saving}
                    className="flex-1"
                  >
                    Save changes
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                </div>
                <Button
                  variant="destructiveOutline"
                  size="sm"
                  fullWidth
                  onClick={deleteRoadmapHandler}
                  disabled={saving}
                  className="mt-2"
                >
                  Delete this roadmap
                </Button>
              </>
            ) : allOwned ? (
              <>
                <p className="mb-2 text-center text-[12.5px] font-semibold text-emerald-600">
                  You own every item in this plan 🎉
                </p>
                <Link
                  href={`/learn/${roadmap.items[0]?.courseId ?? ""}`}
                  className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Continue learning
                </Link>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={startEdit}
                    className="flex-1"
                  >
                    Edit roadmap
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startNewRoadmap}
                    disabled={left <= 0}
                    className="flex-1"
                  >
                    {left > 0 ? `New roadmap (${left} left)` : "No builds left"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <p className="text-[11px] text-slate-400">
                      {ownedCount > 0 ? "Remaining" : "Plan total"}
                    </p>
                    <p className="text-[20px] font-extrabold leading-none text-slate-900">
                      ${remainingPrice}
                    </p>
                    {ownedCount > 0 && (
                      <p className="text-[10px] text-slate-400 line-through">
                        ${roadmap.totalPrice}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={addRemainingToCart}
                    disabled={adding || remainingItems.length === 0}
                    className="flex-1"
                  >
                    {adding
                      ? "Adding…"
                      : ownedCount > 0
                        ? `Add remaining ${remainingItems.length} · $${remainingPrice}`
                        : `Add all ${remainingItems.length} to cart`}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  fullWidth
                  size="sm"
                  loading={savingPlan}
                  onClick={handleSavePlan}
                  className="mt-2"
                >
                  Save &amp; buy later
                </Button>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={startEdit}
                    className="flex-1"
                  >
                    Edit roadmap
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startNewRoadmap}
                    disabled={left <= 0}
                    className="flex-1"
                  >
                    {left > 0 ? `New roadmap (${left} left)` : "No builds left"}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : phase === "intake" ? (
          <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 sm:px-4">
            {savedNote && (
              <p className="mb-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-[12px] font-medium text-emerald-700">
                {savedNote}
              </p>
            )}
            <Button
              fullWidth
              onClick={build}
              disabled={!canBuild}
              leftIcon={<RouteIcon className="h-4 w-4" />}
            >
              Build my roadmap
            </Button>
            <p className="mt-2 text-center text-[11.5px] text-slate-400">
              {left <= 0
                ? "You've used all 3 roadmap builds this month."
                : "Pick your goal, level, time, and timeline to continue."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Result: milestone cards (read-only + editable) ───────────────────────────

interface ResultProps {
  roadmap: Roadmap;
  access: Map<string, Access>;
  editing: boolean;
  editMs: RoadmapMilestone[];
  remaining: number;
  onMoveMilestone: (mi: number, dir: -1 | 1) => void;
  onRemoveMilestone: (mi: number) => void;
  onMoveItem: (mi: number, ii: number, dir: -1 | 1) => void;
  onRemoveItem: (mi: number, ii: number) => void;
  onAddToMilestone: (mi: number) => void;
}

function RoadmapResult({
  roadmap,
  access,
  editing,
  editMs,
  remaining,
  onMoveMilestone,
  onRemoveMilestone,
  onMoveItem,
  onRemoveItem,
  onAddToMilestone,
}: ResultProps) {
  const milestones = editing ? editMs : roadmap.milestones;
  const allItems = milestones.flatMap((m) => m.items);
  const courseCount = allItems.filter((i) => i.type === "course").length;
  const sectionCount = allItems.filter((i) => i.type === "section").length;
  // Ownership marks are a view-mode concern (hidden while curating).
  const ownedTotal = editing ? 0 : allItems.filter((i) => isOwned(i, access)).length;

  return (
    <div className="space-y-5">
      {/* Goal + description */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#3B1892]">
          Your roadmap
        </p>
        <h2 className="mt-0.5 text-[16px] font-bold text-slate-900">
          {roadmap.goal}
        </h2>
        {roadmap.summary && (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">
            {roadmap.summary}
          </p>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Milestones" value={String(milestones.length)} />
        {!editing && ownedTotal > 0 ? (
          <Stat label="Owned" value={`${ownedTotal}/${allItems.length}`} />
        ) : (
          <Stat label="Courses" value={String(courseCount)} />
        )}
        <Stat label="Sections" value={String(sectionCount)} />
        <Stat
          label={!editing && ownedTotal > 0 ? "Remaining" : "Total"}
          value={`$${
            editing
              ? allItems.reduce((s, i) => s + (i.price ?? 0), 0)
              : ownedTotal > 0
                ? allItems
                    .filter((i) => !isOwned(i, access))
                    .reduce((s, i) => s + i.price, 0)
                : roadmap.totalPrice
          }`}
        />
      </div>

      {/* Benefits */}
      {roadmap.benefits && roadmap.benefits.length > 0 && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-3">
          <p className="mb-2 text-[12px] font-bold text-[#3B1892]">
            What you&apos;ll gain
          </p>
          <ul className="space-y-1.5">
            {roadmap.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#3B1892]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && (
        <p className="text-[12px] text-slate-500">
          Editing — reorder, remove, or add items. Changes save when you tap
          <span className="font-semibold"> Save changes</span>.
        </p>
      )}

      {/* Milestones */}
      <div className="space-y-4">
        {milestones.map((m, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#3B1892] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[13.5px] font-bold text-slate-800">{m.title}</p>
                </div>
                {m.focus && (
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{m.focus}</p>
                )}
              </div>
              {editing && (
                <div className="flex flex-shrink-0 items-center gap-1">
                  <IconBtn label="Move up" disabled={i === 0} onClick={() => onMoveMilestone(i, -1)}>↑</IconBtn>
                  <IconBtn label="Move down" disabled={i === milestones.length - 1} onClick={() => onMoveMilestone(i, 1)}>↓</IconBtn>
                  <IconBtn label="Remove milestone" danger onClick={() => onRemoveMilestone(i)}>✕</IconBtn>
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {m.items.map((it, j) => {
                const owned = !editing && isOwned(it, access);
                return (
                <div key={j} className={`flex items-start gap-3 px-4 py-3 ${owned ? "bg-emerald-50/40" : ""}`}>
                  <span
                    className={`mt-0.5 flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      it.type === "section"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-violet-100 text-[#3B1892]"
                    }`}
                  >
                    {it.type === "section" ? "Section" : "Course"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/courses/${it.courseId}`}
                      className={`text-[13px] font-semibold transition-colors hover:text-[#3B1892] ${owned ? "text-slate-500" : "text-slate-800"}`}
                    >
                      {it.title}
                    </Link>
                    {it.type === "section" && (
                      <p className="text-[11px] text-slate-400">from {it.courseTitle}</p>
                    )}
                    {it.reason && (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{it.reason}</p>
                    )}
                  </div>
                  {owned ? (
                    <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Owned
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-[13px] font-bold text-slate-700">${it.price}</span>
                  )}
                  {editing && (
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <IconBtn label="Move up" disabled={j === 0} onClick={() => onMoveItem(i, j, -1)}>↑</IconBtn>
                      <IconBtn label="Move down" disabled={j === m.items.length - 1} onClick={() => onMoveItem(i, j, 1)}>↓</IconBtn>
                      <IconBtn label="Remove item" danger onClick={() => onRemoveItem(i, j)}>✕</IconBtn>
                    </div>
                  )}
                </div>
                );
              })}
              {editing && (
                <button
                  type="button"
                  onClick={() => onAddToMilestone(i)}
                  className="w-full px-4 py-2.5 text-left text-[12.5px] font-semibold text-[#3B1892] transition-colors hover:bg-violet-50"
                >
                  + Add a course to this milestone
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!editing && roadmap.status === "purchased" && (
        <p className="text-center text-[12px] text-emerald-600">
          You&apos;ve purchased from this roadmap — it&apos;s saved in your profile.
        </p>
      )}
      {remaining <= 0 && !editing && (
        <p className="text-center text-[11.5px] text-slate-400">
          No rebuilds left this month — you can still edit this plan.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-center">
      <p className="text-[15px] font-extrabold leading-none text-slate-900">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-6 w-6 items-center justify-center rounded-md border text-[12px] font-bold transition-colors disabled:opacity-30 ${
        danger
          ? "border-red-200 text-red-500 hover:bg-red-50"
          : "border-slate-200 text-slate-500 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

// ── Add-course picker (catalog search) ──────────────────────────────────────

function AddCoursePicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (item: RoadmapItem) => void;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    Array<{ id: string; title: string; price: number }>
  >([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetchCourses({
          ...DEFAULT_FILTERS,
          search: q.trim(),
          limit: 8,
          page: 1,
        });
        if (active) {
          setResults(
            (res.data as Array<{ id: string; title: string; price: number }>).map((c) => ({
              id: c.id,
              title: c.title,
              price: c.price ?? 0,
            })),
          );
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-[14px] font-bold text-slate-800">Add a course</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="border-b border-slate-100 p-3">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search published courses…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] text-slate-700 outline-none focus:border-[#3B1892] focus:ring-1 focus:ring-[#3B1892]"
          />
        </div>
        <div className="min-h-[120px] flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="py-8 text-center text-[12.5px] text-slate-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-slate-400">No courses found.</p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  onPick({
                    type: "course",
                    courseId: c.id,
                    title: c.title,
                    courseTitle: c.title,
                    price: c.price,
                  })
                }
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-violet-50"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-700">{c.title}</span>
                <span className="flex-shrink-0 text-[13px] font-bold text-slate-500">${c.price}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      {children}
    </div>
  );
}

// ── Intake wizard ────────────────────────────────────────────────────────────

function IntakeWizard({
  firstName,
  goal,
  setGoal,
  level,
  setLevel,
  time,
  setTime,
  timeline,
  setTimeline,
  prefs,
  togglePref,
  specifics,
  setSpecifics,
  disabled,
}: {
  firstName: string;
  goal: string;
  setGoal: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  timeline: string;
  setTimeline: (v: string) => void;
  prefs: string[];
  togglePref: (v: string) => void;
  specifics: string;
  setSpecifics: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-6">
      <p className="text-[13.5px] leading-relaxed text-slate-600">
        Hi{firstName ? ` ${firstName}` : ""}! 👋 Tap to answer — it takes about 20
        seconds, then I&apos;ll build your buyable plan.
      </p>

      <Field label="What's your goal?" required>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GOAL_IDEAS.map((g) => (
            <Chip key={g} label={g} selected={goal === g} disabled={disabled} onClick={() => setGoal(g)} icon />
          ))}
        </div>
        <input
          type="text"
          value={GOAL_IDEAS.includes(goal) ? "" : goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={disabled}
          placeholder="…or type your own goal"
          className="mt-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3B1892] focus:ring-1 focus:ring-[#3B1892] disabled:opacity-60"
        />
      </Field>

      <Field label="Your current level" required>
        <ChipRow options={LEVELS} value={level} onSelect={setLevel} disabled={disabled} />
      </Field>

      <Field label="Time you can commit" required>
        <ChipRow options={TIMES} value={time} onSelect={setTime} disabled={disabled} />
      </Field>

      <Field label="Your timeline" required>
        <ChipRow options={TIMELINES} value={timeline} onSelect={setTimeline} disabled={disabled} />
      </Field>

      <Field label="What matters most?" hint="Optional · pick any">
        <div className="flex flex-wrap gap-2">
          {PREFS.map((p) => (
            <Chip key={p} label={p} selected={prefs.includes(p)} disabled={disabled} onClick={() => togglePref(p)} />
          ))}
        </div>
      </Field>

      <Field label="Anything specific?" hint="Optional">
        <input
          type="text"
          value={specifics}
          onChange={(e) => setSpecifics(e.target.value)}
          disabled={disabled}
          placeholder="e.g. focus on React, prep for a June interview…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13.5px] text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3B1892] focus:ring-1 focus:ring-[#3B1892] disabled:opacity-60"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <p className="text-[12.5px] font-semibold text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-[#3B1892]">*</span>}
        </p>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onSelect,
  disabled,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} label={o} selected={value === o} disabled={disabled} onClick={() => onSelect(o)} />
      ))}
    </div>
  );
}

function Chip({
  label,
  selected,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  icon?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={`group flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-[#3B1892] bg-[#3B1892] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-[#3B1892]/40 hover:bg-violet-50/40 hover:text-[#3B1892]"
      }`}
    >
      {icon && (
        <RouteIcon
          className={`h-4 w-4 flex-shrink-0 ${
            selected ? "text-white" : "text-slate-300 transition-colors group-hover:text-[#3B1892]"
          }`}
        />
      )}
      {label}
    </button>
  );
}
