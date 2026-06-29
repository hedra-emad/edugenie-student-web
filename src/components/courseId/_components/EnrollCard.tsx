// _components/EnrollCard.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type {
  Course,
  Section,
} from "../../../app/courses/[courseId]/types/course";
import { addToCartAction } from "@/app/actions/cart.actions";
import { useSession } from "@/providers/SessionProvider";
import PlacementTestModal from "./PlacementTestModal";
import DotsLoader from "@/components/ui/DotsLoader";
import { useCourseAccess } from "./CourseAccessProvider";
function getSafeImageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const { hostname } = new URL(trimmed);
    if (hostname === "example.com") return null;
    if (
      hostname === "res.cloudinary.com" ||
      hostname === "edugenie-api.vercel.app" ||
      hostname === "images.unsplash.com"
    ) {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Types
interface SectionWithOwned extends Section {
  isOwned?: boolean;
  price?: number;
}

type BtnState = "enrolled" | "disabled" | "partial" | "full";

function getSectionId(section: Section) {
  return (section as Section & { id?: string }).id ?? section.id;
}

function getCourseId(course: Course) {
  return (course as Course & { id?: string }).id ?? course.id;
}

// ─── Helpers
function formatDuration(totalHours: number) {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

// Split course price equally across sections that have no individual price
function getSectionPrice(section: SectionWithOwned): number {
  return section.price ?? 0;
}

function getBtnState(
  isEnrolled: boolean,
  selectedIds: Set<string>,
  availableSections: SectionWithOwned[],
  allowFullCourse: boolean,
): BtnState {
  if (isEnrolled) return "enrolled";
  if (selectedIds.size === 0) return "disabled";
  // The full-course purchase only makes sense when the student owns NOTHING yet.
  // A partial owner buying their remaining sections must stay in "partial" so we
  // charge only for those sections — never re-buy the whole course.
  if (allowFullCourse && selectedIds.size === availableSections.length) {
    return "full";
  }
  return "partial";
}

// ─── Checkbox row ─────────────────────────────────────────────────────────────
function SectionRow({
  section,
  index,
  price,
  isChecked,
  isOwned,
  onToggle,
}: {
  section: SectionWithOwned;
  index: number;
  price: number;
  isChecked: boolean;
  isOwned: boolean;
  onToggle: () => void;
}) {
  const totalSec = section.lessons.reduce((a, l) => a + l.videoDuration, 0);
  const minutes = Math.round(totalSec / 60);

  return (
    <div
      role={isOwned ? undefined : "checkbox"}
      aria-checked={isOwned ? undefined : isChecked}
      onClick={isOwned ? undefined : onToggle}
      className={`
        flex items-center gap-3 px-3 py-2.5
        rounded-xl border-2 select-none
        transition-all duration-150
        ${
          isOwned
            ? "border-emerald-200 bg-emerald-50 cursor-default"
            : isChecked
              ? "border-violet-500 bg-violet-50 cursor-pointer"
              : "border-slate-200 hover:border-slate-300 cursor-pointer"
        }
      `}
    >
      {/* Checkbox */}
      <div
        className={`
          w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
          transition-all duration-150
          ${
            isOwned
              ? "bg-emerald-500 border-emerald-500"
              : isChecked
                ? "bg-violet-600 border-violet-600"
                : "border-slate-300 bg-white"
          }
        `}
      >
        {(isChecked || isOwned) && (
          <svg
            className="w-3 h-3 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-[12.5px] font-semibold leading-tight line-clamp-1
          ${isOwned ? "text-emerald-700" : "text-slate-800"}`}
        >
          {index + 1}. {section.title}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {section.lessons.length} lessons{minutes > 0 ? ` · ${minutes}m` : ""}
        </p>
      </div>

      {/* Price / owned */}
      {isOwned ? (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
          Owned
        </span>
      ) : (
        <span
          className={`text-[13px] font-bold flex-shrink-0
          ${isChecked ? "text-violet-700" : "text-slate-700"}`}
        >
          ${price}
        </span>
      )}
    </div>
  );
}

// (DotsLoader imported — used for button loading state)

// ─── Main
export default function EnrollCard({ course }: { course: Course }) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const access = useCourseAccess();
  const [pending, startTransition] = useTransition();
  const [cartError, setCartError] = useState<string | null>(null);
  const [showPlacement, setShowPlacement] = useState(false);
  const safeThumbnail = getSafeImageSrc(course.thumbnail);

  const sections = course.sections as SectionWithOwned[];

  // Real per-user ownership comes from the shared access provider (the page
  // data is public/cached and can't know it).
  const isFullyOwned = access.isFullyOwned;
  const isSectionOwned = (s: Section) =>
    isFullyOwned || access.ownedSectionIds.has(getSectionId(s));
  const showLoading = isAuthenticated && access.loading;

  // sections that can still be purchased
  const availableSections = useMemo(
    () => sections.filter((s) => !isSectionOwned(s)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, isFullyOwned, access.ownedSectionIds],
  );
  const ownedCount = sections.length - availableSections.length;
  const courseId = getCourseId(course);

  // default: all available are selected
  // const [selectedIds, setSelectedIds] = useState<Set<string>>(
  //   () => new Set(availableSections.map((s) => s._id)),
  // );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    setSelectedIds(new Set(availableSections.map((s) => getSectionId(s))));
  }, [availableSections]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Derived ──
  // A full-course purchase is only offered to students who own no sections yet.
  const ownsNothing = !access.hasAnyAccess;
  const btnState = getBtnState(
    isFullyOwned,
    selectedIds,
    availableSections,
    ownsNothing,
  );
  const selectedList = availableSections.filter((s) =>
    selectedIds.has(getSectionId(s)),
  );
  const selectedTotal = selectedList.reduce(
    (acc, s) => acc + getSectionPrice(s),
    0,
  );
  // The cart charges the course's own price for a full_course purchase (not the
  // sum of section prices), so the label must reflect course.price.
  const fullCoursePrice =
    typeof course.price === "number" ? course.price : selectedTotal;

  // ── Smart button label ──
  const btnLabel = (() => {
    if (btnState === "enrolled") return "Go to Course";
    if (btnState === "disabled") return "Select at least one section";
    if (btnState === "full") return `Buy Full Course — $${fullCoursePrice}`;
    return `Buy Selected — $${selectedTotal}`;
  })();

  const helperText = (() => {
    if (btnState === "disabled") return "Choose the sections you want above";
    if (btnState === "full") return "Best value — full course access";
    if (btnState === "partial" && ownsNothing)
      return `Select all ${availableSections.length} sections to buy the full course`;
    return "";
  })();

  // ── Button styles ──
  const btnClass = (() => {
    const base =
      "w-full py-3.5 rounded-xl text-[14px] font-bold transition-all duration-200 font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";
    if (btnState === "disabled")
      return `${base} bg-slate-100 text-slate-400 cursor-not-allowed`;
    if (btnState === "enrolled")
      return `${base} bg-slate-900 hover:bg-slate-800 text-white shadow-sm`;
    if (btnState === "full")
      return `${base} bg-violet-700 hover:bg-violet-600 text-white shadow-sm`;
    return `${base} bg-violet-700 hover:bg-violet-600 text-white shadow-sm`;
  })();

  function handleCTA() {
    if (btnState === "disabled" || pending) return;

    if (btnState !== "enrolled" && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (btnState === "enrolled") {
      startTransition(() => router.push(`/learn/${courseId}`));
      return;
    }

    if (btnState === "full") {
      startTransition(async () => {
        const result = await addToCartAction({
          courseId,
          type: "full_course",
        });

        if (result.success) {
          router.push("/cart");
        } else {
          setCartError(result.error ?? "Could not add to cart");
          setTimeout(() => setCartError(null), 3000);
        }
      });
      return;
    }

    // partial — batch all selected sections
    startTransition(async () => {
      const payloads = selectedList.map((s) => ({
        courseId,
        sectionId: getSectionId(s),
        type: "section" as const,
      }));

      const result = await addToCartAction(payloads);

      if (result.success) {
        router.push("/cart");
      } else {
        setCartError(result.error ?? "Could not add items to cart");
        setTimeout(() => setCartError(null), 3000);
      }
    });
  }
  // button toggle all sections
  const toggleAllSections = () => {
    if (selectedIds.size === availableSections.length) {
      setSelectedIds(new Set<string>());
    } else {
      setSelectedIds(
        new Set<string>(availableSections.map((s) => getSectionId(s))),
      );
    }
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-100">
        {safeThumbnail && (
          <Image
            src={safeThumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
          <button
            aria-label="Watch preview"
            className="w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg
              className="w-5 h-5 text-slate-900 ml-0.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-md">
          Preview
        </span>
      </div>

      <div className="p-5">
        {showLoading ? (
          /* Checking the student's access first — avoids flashing the buy UI
             before we know they already own this course. */
          <div className="space-y-3 animate-pulse" aria-hidden>
            <div className="h-[58px] rounded-xl bg-slate-100" />
            <div className="h-12 rounded-xl bg-slate-100" />
            <div className="h-9 rounded-xl bg-slate-100" />
          </div>
        ) : (
          <>
            {/* Fully owned */}
            {isFullyOwned && (
              <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 mb-4">
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[13px] font-bold text-emerald-800">
                    You own this course
                  </p>
                  <p className="text-[11.5px] text-emerald-600 mt-0.5">
                    Full access to every section
                  </p>
                </div>
              </div>
            )}

            {/* Partially owned — owns some sections, can buy the rest */}
            {!isFullyOwned && access.hasAnyAccess && (
              <div className="border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-emerald-800">
                      You own {ownedCount} of {sections.length} sections
                    </p>
                    <p className="text-[11.5px] text-emerald-600 mt-0.5">
                      Keep learning, or add the rest below
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    startTransition(() => router.push(`/learn/${courseId}`))
                  }
                  className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold transition-colors"
                >
                  Continue learning
                </button>
              </div>
            )}

            {/* Section selector — only when there's still something to buy */}
            {!isFullyOwned && (
              <div className="mb-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {access.hasAnyAccess ? "Add more sections" : "Choose what to buy"}
                </p>
                <div className="flex flex-col gap-2">
                  {sections.map((section, i) => {
                    const sectionId = getSectionId(section);
                    const price = getSectionPrice(section);
                    const isOwned = isSectionOwned(section);
                    return (
                      <SectionRow
                        key={sectionId}
                        section={section}
                        index={i}
                        price={price}
                        isChecked={isOwned || selectedIds.has(sectionId)}
                        isOwned={isOwned}
                        onToggle={() => toggle(sectionId)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            {!isFullyOwned && (
              <div className="flex items-center justify-between mb-4 px-0.5">
                <span className="text-[12.5px] text-slate-500">
                  {btnState === "disabled"
                    ? "No sections selected"
                    : btnState === "full"
                      ? `All ${availableSections.length} sections`
                      : `${selectedList.length} of ${availableSections.length} sections`}
                </span>
                <span className="text-[20px] font-extrabold text-slate-900 leading-none">
                  {btnState === "disabled"
                    ? "$0"
                    : btnState === "full"
                      ? `$${fullCoursePrice}`
                      : `$${selectedTotal}`}
                </span>
              </div>
            )}

            {/* Smart CTA (Go to Course when fully owned, else Buy …) */}
            <button
              onClick={handleCTA}
              disabled={btnState === "disabled" || pending}
              className={btnClass}
            >
              {pending ? <DotsLoader /> : btnLabel}
            </button>

            {cartError && (
              <p className="text-red-500 text-xs mt-1.5 text-center" role="alert">
                {cartError}
              </p>
            )}

            {helperText && (
              <p className="text-center text-[11.5px] text-slate-400 mt-2">
                {helperText}
              </p>
            )}

            {!isFullyOwned && (
              <button
                onClick={toggleAllSections}
                className="w-full mt-2.5 py-2.5 rounded-xl text-[12.5px] font-semibold text-violet-600 border border-violet-200 hover:bg-violet-50 transition-all duration-150"
              >
                {selectedIds.size === availableSections.length
                  ? "Unselect All"
                  : "Select All Sections"}
              </button>
            )}

            {/* AI placement test — "buy only what you need" */}
            {!isFullyOwned && availableSections.length > 0 && (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push("/login");
                    return;
                  }
                  setShowPlacement(true);
                }}
                className="w-full mt-2.5 py-2.5 rounded-xl text-[12.5px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100 transition-all duration-150 flex items-center justify-center gap-1.5"
              >
                <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l1.9 5.7L20 9.5l-5.1 2L12 17l-1.9-5.5L5 9.5l5.1-1.8L12 2z" />
                </svg>
                Take the AI placement test — skip what you know
              </button>
            )}

            {showPlacement && (
              <PlacementTestModal
                courseId={courseId}
                onClose={() => setShowPlacement(false)}
              />
            )}
          </>
        )}

        {/* Divider */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            This course includes
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              [
                "Video lessons (max 20 min each)",
                `${course.totalLessons} lessons · ${formatDuration(course.totalHours)}`,
              ],
              ["3-tier AI Chatbot", "Lesson, course & roadmap level"],
              ["Quizzes after every lesson", "80% required to advance"],
              ["Certificate on completion", "Auto-generated with your score"],
              ["Lifetime access", "Learn at your own pace"],
            ].map(([label, sub]) => (
              <div key={label} className="flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 text-violet-600 mt-[2px] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-[12.5px] text-slate-700 font-medium leading-tight">
                    {label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
