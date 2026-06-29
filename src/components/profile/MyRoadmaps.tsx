"use client";
// Profile → Roadmaps tab. Lists the student's saved AI roadmaps and acts as an
// ordered overlay over their real enrollments: each item shows owned/locked
// derived live from `enrollments/my-access`, with a per-item "Continue" and a
// one-click "Buy remaining" that adds the not-yet-owned items to the cart.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listRoadmaps, type Roadmap, type RoadmapItem } from "@/lib/api/roadmap";
import { addToCartAction } from "@/app/actions/cart.actions";

const PROXY = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

interface Access {
  accessType: string;
  sections: Set<string>;
}

async function fetchAccess(courseId: string): Promise<Access> {
  try {
    const r = await fetch(`${PROXY}/enrollments/my-access/${courseId}`, {
      credentials: "include",
    });
    if (!r.ok) return { accessType: "none", sections: new Set() };
    const d = (await r.json()) as {
      accessType?: string;
      accessibleSections?: string[];
    };
    return {
      accessType: d.accessType ?? "none",
      sections: new Set(
        Array.isArray(d.accessibleSections) ? d.accessibleSections : [],
      ),
    };
  } catch {
    return { accessType: "none", sections: new Set() };
  }
}

function isOwned(item: RoadmapItem, access: Map<string, Access>): boolean {
  const a = access.get(item.courseId);
  if (!a) return false;
  if (a.accessType === "full_course") return true;
  if (item.type === "section" && item.sectionId) return a.sections.has(item.sectionId);
  return false;
}

export default function MyRoadmaps() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [access, setAccess] = useState<Map<string, Access>>(new Map());
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listRoadmaps().catch(() => []);
      if (cancelled) return;
      setRoadmaps(list);
      const ids = [...new Set(list.flatMap((r) => r.items.map((i) => i.courseId)))];
      const entries = await Promise.all(
        ids.map(async (id) => [id, await fetchAccess(id)] as const),
      );
      if (cancelled) return;
      setAccess(new Map(entries));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const buyRemaining = async (r: Roadmap) => {
    const remaining = r.items.filter((i) => !isOwned(i, access));
    if (!remaining.length || busyId) return;
    setBusyId(r.id);
    const payloads = remaining.map((i) =>
      i.type === "section"
        ? { courseId: i.courseId, sectionId: i.sectionId as string, type: "section" as const }
        : { courseId: i.courseId, type: "full_course" as const },
    );
    const res = await addToCartAction(payloads);
    if (res.success) router.push("/cart");
    else setBusyId(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (roadmaps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-[#3B1892]">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" />
            <path d="M9 19h6a3 3 0 0 0 3-3V8" /><path d="M6 16V8a3 3 0 0 1 3-3h6" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-slate-800">No roadmaps yet</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
          Build a personalized, step-by-step learning path and buy the whole plan
          in one click.
        </p>
        <Link
          href="/roadmap"
          className="mt-4 inline-flex rounded-xl bg-[#3B1892] px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#2A1069]"
        >
          Build my roadmap
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {roadmaps.map((r) => (
        <RoadmapCard
          key={r.id}
          roadmap={r}
          access={access}
          busy={busyId === r.id}
          onBuyRemaining={() => buyRemaining(r)}
        />
      ))}
    </div>
  );
}

function RoadmapCard({
  roadmap,
  access,
  busy,
  onBuyRemaining,
}: {
  roadmap: Roadmap;
  access: Map<string, Access>;
  busy: boolean;
  onBuyRemaining: () => void;
}) {
  const ownedCount = roadmap.items.filter((i) => isOwned(i, access)).length;
  const total = roadmap.items.length;
  const pct = total ? Math.round((ownedCount / total) * 100) : 0;
  const allOwned = total > 0 && ownedCount === total;
  const remainingItems = roadmap.items.filter((i) => !isOwned(i, access));
  const remainingPrice = remainingItems.reduce((s, i) => s + i.price, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-slate-900">
              {roadmap.goal}
            </p>
            {roadmap.createdAt && (
              <p className="mt-0.5 text-[11.5px] text-slate-400">
                Created {new Date(roadmap.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          {allOwned ? (
            <span className="flex-shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[11.5px] font-semibold text-emerald-700">
              Complete plan owned
            </span>
          ) : (
            <span className="flex-shrink-0 rounded-full bg-violet-100 px-3 py-1 text-[11.5px] font-semibold text-[#3B1892]">
              {ownedCount} of {total} owned
            </span>
          )}
        </div>
        {/* Progress */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#3B1892] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="divide-y divide-slate-100">
        {roadmap.milestones.map((m, mi) => (
          <div key={mi} className="px-5 py-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                {mi + 1}
              </span>
              <p className="text-[13px] font-semibold text-slate-800">{m.title}</p>
            </div>
            <div className="space-y-1.5 pl-7">
              {m.items.map((it, ii) => {
                const owned = isOwned(it, access);
                return (
                  <div key={ii} className="flex items-center gap-2.5">
                    <span
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
                        owned ? "bg-emerald-500 text-white" : "border border-slate-300"
                      }`}
                    >
                      {owned && (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-700">
                      {it.title}
                      {it.type === "section" && (
                        <span className="text-slate-400"> · section</span>
                      )}
                    </span>
                    {owned ? (
                      <Link
                        href={`/learn/${it.courseId}`}
                        className="flex-shrink-0 text-[12px] font-semibold text-[#3B1892] hover:underline"
                      >
                        Continue
                      </Link>
                    ) : (
                      <span className="flex-shrink-0 text-[12px] font-bold text-slate-500">
                        ${it.price}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-slate-100 px-5 py-3">
        {allOwned ? (
          <Link
            href={`/learn/${roadmap.items[0]?.courseId ?? ""}`}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Continue learning
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBuyRemaining}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B1892] py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#2A1069] disabled:opacity-50"
          >
            {busy
              ? "Adding…"
              : `Buy remaining ${remainingItems.length} · $${remainingPrice}`}
          </button>
        )}
      </div>
    </div>
  );
}
