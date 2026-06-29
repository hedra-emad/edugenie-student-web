"use client";
// Single source of truth for the logged-in student's ownership of this course.
// The course detail page is fetched publicly (ISR, no auth), so per-user
// ownership can't come from it — this client provider calls the authenticated
// `enrollments/my-access/:courseId` once and shares the result with both the
// EnrollCard and the curriculum, so neither re-fetches and the UI stays in sync.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@/providers/SessionProvider";

export type AccessType = "none" | "full_course" | "section";

export interface CourseAccess {
  /** True until the access check resolves (only meaningful when authenticated). */
  loading: boolean;
  authenticated: boolean;
  accessType: AccessType;
  ownedSectionIds: Set<string>;
  totalSections: number;
  /** Owns the whole course (full purchase, or owns every section). */
  isFullyOwned: boolean;
  /** Owns at least one section. */
  hasAnyAccess: boolean;
}

const DEFAULT: CourseAccess = {
  loading: true,
  authenticated: false,
  accessType: "none",
  ownedSectionIds: new Set(),
  totalSections: 0,
  isFullyOwned: false,
  hasAnyAccess: false,
};

const Ctx = createContext<CourseAccess>(DEFAULT);
export const useCourseAccess = () => useContext(Ctx);

const PROXY = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy";

export function CourseAccessProvider({
  courseId,
  totalSections,
  children,
}: {
  courseId: string;
  totalSections: number;
  children: ReactNode;
}) {
  const { isAuthenticated } = useSession();
  const [state, setState] = useState<CourseAccess>({
    ...DEFAULT,
    totalSections,
  });

  useEffect(() => {
    let cancelled = false;

    // Guests can't own anything — skip the call, render the buy flow immediately.
    if (!isAuthenticated) {
      setState({ ...DEFAULT, loading: false, totalSections });
      return;
    }

    setState((s) => ({ ...s, loading: true, authenticated: true }));

    fetch(`${PROXY}/enrollments/my-access/${courseId}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          setState({
            ...DEFAULT,
            loading: false,
            authenticated: true,
            totalSections,
          });
          return;
        }
        const owned = new Set<string>(
          Array.isArray(d.accessibleSections)
            ? (d.accessibleSections as string[])
            : [],
        );
        const total =
          typeof d.totalSections === "number" ? d.totalSections : totalSections;
        const isFullyOwned =
          d.accessType === "full_course" || (total > 0 && owned.size >= total);
        setState({
          loading: false,
          authenticated: true,
          accessType: (d.accessType as AccessType) ?? "none",
          ownedSectionIds: owned,
          totalSections: total,
          isFullyOwned,
          hasAnyAccess: owned.size > 0,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            ...DEFAULT,
            loading: false,
            authenticated: true,
            totalSections,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, isAuthenticated, totalSections]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
