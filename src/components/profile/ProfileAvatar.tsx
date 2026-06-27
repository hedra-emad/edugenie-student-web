"use client";

import Image from "next/image";
import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";

interface Props {
  avatarUrl?: string;
  initials: string;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
}

export default function ProfileAvatar({
  avatarUrl,
  initials,
  isUploading,
  onFileSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="relative shrink-0 w-20 h-20">
      {/* Avatar circle */}
      <button
        type="button"
        aria-label="Change profile picture"
        onClick={() => inputRef.current?.click()}
        className="group relative w-20 h-20 rounded-full overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1892] focus-visible:ring-offset-2"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Your profile picture"
            fill
            sizes="80px"
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-[#3B1892] text-white font-bold text-2xl select-none"
            aria-hidden="true"
          >
            {initials}
          </div>
        )}

        {/* Hover / uploading overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200
            ${isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          aria-hidden="true"
        >
          {isUploading ? (
            <Loader2 className="text-white animate-spin" size={18} />
          ) : (
            <Camera className="text-white" size={18} />
          )}
        </div>
      </button>

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
  );
}
