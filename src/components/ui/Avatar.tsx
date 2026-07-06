"use client";
// components/ui/Avatar.tsx

import { useState } from "react";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  textSizeClassName?: string;
}

/**
 * Round profile picture with an initials fallback. Falls back both when
 * `src` is empty AND dynamically via `onError` (e.g. an expired/blocked
 * Google avatar URL) — uses a plain `<img>` rather than `next/image` so it
 * never depends on `images.remotePatterns` allowlisting the source host.
 */
export default function Avatar({
  src,
  name,
  className = "h-8 w-8",
  textSizeClassName = "text-sm",
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.trim().charAt(0) || "U").toUpperCase();
  const showImage = Boolean(src) && !failed;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src as string}
        alt={name ?? "Profile"}
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-cover ring-2 ring-indigo-200`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center rounded-full bg-indigo-100 ${textSizeClassName} font-bold text-indigo-700 ring-2 ring-indigo-200`}
    >
      {initial}
    </div>
  );
}
