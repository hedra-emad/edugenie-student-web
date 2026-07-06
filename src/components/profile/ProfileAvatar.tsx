"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";

interface Props {
  avatarUrl?: string;
  initials: string;
  isUploading: boolean;
  isDeleting?: boolean;
  onFileSelect: (file: File) => void;
  onDelete?: () => void;
}

const MAX_MB = 5;

export default function ProfileAvatar({
  avatarUrl,
  initials,
  isUploading,
  isDeleting = false,
  onFileSelect,
  onDelete,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [lastAvatarUrl, setLastAvatarUrl] = useState(avatarUrl);

  // Reset the failed-load flag whenever the avatar URL changes (new upload,
  // or a fresh URL after a previous one broke) — adjusted during render
  // rather than an effect, per React's state-adjustment-on-prop-change guidance.
  if (avatarUrl !== lastAvatarUrl) {
    setLastAvatarUrl(avatarUrl);
    setImgFailed(false);
  }

  const busy = isUploading || isDeleting;
  const hasAvatar = !!avatarUrl;
  const showImage = hasAvatar && !imgFailed;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected after an error/cancel.
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_MB}MB.`);
      return;
    }

    setError(null);
    onFileSelect(file);
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="relative shrink-0 w-20 h-20">
        {/* Avatar / change-picture button */}
        <button
          type="button"
          aria-label={hasAvatar ? "Change profile picture" : "Add profile picture"}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="group relative w-20 h-20 rounded-full overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892] focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Your profile picture"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-[#3B1892] text-white font-bold text-2xl select-none"
              aria-hidden="true"
            >
              {initials}
            </div>
          )}

          {/* Hover / busy overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200
              ${busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            aria-hidden="true"
          >
            {busy ? (
              <Loader2 className="text-white animate-spin" size={18} />
            ) : (
              <Camera className="text-white" size={18} />
            )}
          </div>
        </button>

        {/* Remove button — sibling (not nested) so the markup stays valid */}
        {hasAvatar && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            aria-label="Remove profile picture"
            title="Remove profile picture"
            className="absolute -bottom-0.5 -right-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-red-500 shadow-md ring-1 ring-slate-200 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Trash2 size={12} />
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleChange}
        />
      </div>

      {error && (
        <p className="max-w-[160px] text-[11px] leading-tight text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
