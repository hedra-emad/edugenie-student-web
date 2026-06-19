// src/app/learn/[courseId]/loading.tsx
// Skeleton UI shown by Next.js while the server component is fetching data.

export default function LearnPageLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Skeleton Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="h-14 flex items-center justify-between px-6">
          <div className="h-5 w-24 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-4 w-28 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        {/* Progress bar placeholder */}
        <div className="h-1 bg-slate-100" />
      </header>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_320px]">
        {/* Left — video + tabs skeleton */}
        <div className="flex flex-col">
          {/* Video skeleton */}
          <div className="w-full aspect-video bg-slate-200 animate-pulse flex items-center justify-center">
            <svg
              className="animate-spin w-10 h-10 text-slate-300"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>

          {/* Controls skeleton */}
          <div className="bg-slate-900 px-4 py-4 flex flex-col gap-3">
            <div className="h-1 bg-slate-700 rounded-full animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
                <div className="w-4 h-4 bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-6 bg-slate-700 rounded animate-pulse" />
                <div className="w-4 h-4 bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Tab bar skeleton */}
          <div className="bg-white border-t border-slate-200">
            <div className="flex border-b border-slate-200 px-5 gap-6 h-12 items-end pb-0">
              {["Overview", "Notes", "AI Chat"].map((tab) => (
                <div
                  key={tab}
                  className="h-4 w-16 bg-slate-100 rounded animate-pulse mb-3"
                />
              ))}
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="h-6 w-3/4 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right — sidebar skeleton */}
        <div className="hidden lg:flex flex-col border-l border-slate-200 bg-white">
          <div className="px-4 py-3.5 border-b border-slate-100">
            <div className="h-3 w-28 bg-slate-100 rounded animate-pulse mb-1.5" />
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="p-4 flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
                <div className="ml-4 mt-1 space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={j}
                      className="h-3 bg-slate-100 rounded animate-pulse"
                      style={{ width: `${70 + (j % 3) * 10}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
