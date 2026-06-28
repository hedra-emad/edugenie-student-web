"use client";
import Link from "next/link";
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProfileError({ reset }: ErrorProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col items-start gap-5 max-w-md">
        {/* Warning icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#3B1892]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3B1892"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-gray-900">
            We couldn&apos;t load your profile
          </h1>
          <p className="text-sm text-gray-500">
            This is usually temporary. Your data is safe.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="bg-[#3B1892] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[#2f1275] transition-colors duration-150"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}