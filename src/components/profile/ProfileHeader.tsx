"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import type { UserProfile } from "@/types/profile.types";
import type { ProfileUpdatePayload } from "@/types/profile.types";
import ProfileAvatar from "./ProfileAvatar";

const LEVEL_LABELS: Record<UserProfile["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

interface Props {
  profile: UserProfile;
  isUploading: boolean;
  isDeletingAvatar: boolean;
  onAvatarSelect: (file: File) => void;
  onAvatarDelete: () => void;
  onFieldSave: (field: keyof ProfileUpdatePayload, value: string) => void;
}

interface NameEditorProps {
  firstName: string;
  lastName: string;
  onSave: (firstName: string, lastName: string) => void;
}

function InlineNameEditor({ firstName, lastName, onSave }: NameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draftFirst, setDraftFirst] = useState(firstName);
  const [draftLast, setDraftLast] = useState(lastName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep drafts in sync if parent value changes (e.g. optimistic rollback)
  useEffect(() => {
    if (!editing) {
      setDraftFirst(firstName);
      setDraftLast(lastName);
    }
  }, [firstName, lastName, editing]);

  function startEditing() {
    setDraftFirst(firstName);
    setDraftLast(lastName);
    setError(null);
    setEditing(true);
    // Focus first input on next tick
    setTimeout(() => firstRef.current?.focus(), 0);
  }

  function showError(msg: string) {
    setError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 3000);
  }

  function commit(f: string, l: string) {
    const trimFirst = f.trim();
    const trimLast = l.trim();
    if (!trimFirst || !trimLast) {
      showError("First and last name are required.");
      return;
    }
    setEditing(false);
    setSaving(true);
    onSave(trimFirst, trimLast);
    // saving state clears optimistically; parent handles rollback on error
    setTimeout(() => setSaving(false), 1500);
  }

  function cancel() {
    setDraftFirst(firstName);
    setDraftLast(lastName);
    setEditing(false);
    setError(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(draftFirst, draftLast);
    }
    if (e.key === "Escape") cancel();
  }

  // Blur: only commit when focus leaves BOTH inputs
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const related = e.relatedTarget as HTMLElement | null;
    if (related === firstRef.current || related === lastRef.current) return;
    commit(draftFirst, draftLast);
  }

  if (editing) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={firstRef}
            value={draftFirst}
            onChange={(e) => setDraftFirst(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="First name"
            aria-label="First name"
            disabled={saving}
            className={`border-b border-gray-300 focus:border-[#3B1892] outline-none bg-transparent
                        text-2xl font-bold text-slate-900 w-32 transition-colors duration-150
                        ${saving ? "opacity-60" : ""}`}
          />
          <input
            ref={lastRef}
            value={draftLast}
            onChange={(e) => setDraftLast(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Last name"
            aria-label="Last name"
            disabled={saving}
            className={`border-b border-gray-300 focus:border-[#3B1892] outline-none bg-transparent
                        text-2xl font-bold text-slate-900 w-32 transition-colors duration-150
                        ${saving ? "opacity-60" : ""}`}
          />
        </div>
        {error && (
          <p className="text-red-500 text-xs" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div
        className="group inline-flex items-center gap-2 cursor-pointer"
        onClick={startEditing}
        role="button"
        tabIndex={0}
        aria-label="Edit name"
        onKeyDown={(e) => e.key === "Enter" && startEditing()}
      >
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          {firstName} {lastName}
        </h1>
        {/* Pencil — only on hover */}
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
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>
    </div>
  );
}

export default function ProfileHeader({
  profile,
  isUploading,
  isDeletingAvatar,
  onAvatarSelect,
  onAvatarDelete,
  onFieldSave,
}: Props) {
  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();
  const avatarUrl = profile.avatar ?? profile.photo;

  function handleNameSave(firstName: string, lastName: string) {
    onFieldSave("firstName", firstName);
    onFieldSave("lastName", lastName);
  }

  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <ProfileAvatar
            avatarUrl={avatarUrl}
            initials={initials}
            isUploading={isUploading}
            isDeleting={isDeletingAvatar}
            onFileSelect={onAvatarSelect}
            onDelete={onAvatarDelete}
          />

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Full name — single-unit inline editor */}
            <InlineNameEditor
              firstName={profile.firstName}
              lastName={profile.lastName}
              onSave={handleNameSave}
            />

            {/* Level + Verified badges */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B1892] text-white">
                {LEVEL_LABELS[profile.level]}
              </span>
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle size={14} aria-hidden="true" />
                  Verified
                </span>
              )}
            </div>

            {/* Email */}
            <p className="text-sm text-slate-500">{profile.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
