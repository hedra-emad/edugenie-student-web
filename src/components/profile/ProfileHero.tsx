"use client";

import { useState, useRef, useCallback } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { UserProfile, UpdateProfilePayload } from "@/types/profile.types";

const LEVEL_LABELS: Record<UserProfile["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const LEVEL_COLORS: Record<UserProfile["level"], string> = {
  beginner: "bg-emerald-50 text-emerald-700",
  intermediate: "bg-amber-50 text-amber-700",
  advanced: "bg-violet-50 text-[#3B1892]",
};

interface Props {
  profile: UserProfile;
  mutation: UseMutationResult<UserProfile, Error, UpdateProfilePayload, unknown>;
}

export default function ProfileHero({ profile, mutation }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);

  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether focus is still inside the edit container
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initials =
    `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  const startEdit = () => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setNameError(null);
    setEditingName(true);
    setTimeout(() => firstRef.current?.focus(), 0);
  };

  const showError = (msg: string) => {
    setNameError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setNameError(null), 3000);
  };

  const commitEdit = useCallback(
    (f: string, l: string) => {
      const trimFirst = f.trim();
      const trimLast = l.trim();

      if (!trimFirst || !trimLast) {
        showError("First and last name are required.");
        return;
      }

      setEditingName(false);

      if (
        trimFirst === profile.firstName &&
        trimLast === profile.lastName
      ) {
        return;
      }

      mutation.mutate(
        { firstName: trimFirst, lastName: trimLast },
        {
          onError: () => {
            showError("Name could not be saved. Try again.");
          },
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.firstName, profile.lastName, mutation]
  );

  /**
   * Called on blur of either input.
   * We use a short timeout so we can check if focus moved to the OTHER input
   * (relatedTarget is the element receiving focus). If it did, we don't commit.
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const related = e.relatedTarget as HTMLElement | null;
    // If focus moved to the sibling input, do nothing yet
    if (related === firstRef.current || related === lastRef.current) return;

    // Focus left the edit area — commit with latest state values
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => {
      commitEdit(firstName, lastName);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit(firstName, lastName);
    }
    if (e.key === "Escape") {
      setEditingName(false);
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setNameError(null);
    }
  };

  return (
    <div className="flex items-start gap-5">
      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center
                   bg-[#3B1892]/10 text-[#3B1892] font-semibold text-xl select-none"
        aria-label={`${profile.firstName} ${profile.lastName}`}
      >
        {profile.photo ? (
          <img
            src={profile.photo}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {editingName ? (
           <div
  className="flex items-center gap-2 flex-wrap"
  onBlur={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      commitEdit(firstName, lastName);
    }
  }}
>
              <input
                ref={firstRef}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                
                onKeyDown={handleKeyDown}
              
              />
              <input
                ref={lastRef}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                
                onKeyDown={handleKeyDown}
                
              />
            </div>
          ) : (
            <div className="flex items-center gap-0.5">
              <h1 className="text-xl font-bold text-gray-900 truncate flex items-center gap-1">
  <span>{profile.firstName}</span>
  <span>{profile.lastName}</span>
</h1>

              {/* Pencil — only on hover */}
              {hovering && (
                <button
                  onClick={startEdit}
                  aria-label="Edit name"
                  className="shrink-0 text-gray-400 hover:text-[#3B1892] transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Inline error */}
        {nameError && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {nameError}
          </p>
        )}

        {/* Level badge + email */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${LEVEL_COLORS[profile.level]}`}
          >
            {LEVEL_LABELS[profile.level]}
          </span>
          <span className="text-sm text-gray-400">{profile.email}</span>
        </div>
      </div>
    </div>
  );
}