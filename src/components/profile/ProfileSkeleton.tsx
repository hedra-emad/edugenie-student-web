export default function ProfileSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading profile">
      {/* Header skeleton */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-slate-200 shrink-0" />
            {/* Info */}
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-7 w-56 rounded-md bg-slate-200" />
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-slate-200" />
                <div className="h-5 w-16 rounded-full bg-slate-200" />
              </div>
              <div className="h-4 w-48 rounded-md bg-slate-200" />
              <div className="h-4 w-72 rounded-md bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip skeleton */}
      <div className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto flex">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center justify-center py-4 gap-2 ${
                i < 3 ? "border-r border-slate-200" : ""
              }`}
            >
              <div className="h-7 w-10 rounded-md bg-slate-200" />
              <div className="h-3 w-20 rounded-md bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Body skeleton */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* My Learning */}
            <div className="space-y-4">
              <div className="h-6 w-32 rounded-md bg-slate-200" />
              <div className="flex gap-4 border-b border-slate-200 pb-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-4 w-20 rounded-md bg-slate-200" />
                ))}
              </div>
              {/* Course card skeletons */}
              {[0, 1].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-100" />
              ))}
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <div className="h-6 w-40 rounded-md bg-slate-200" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-4 pl-10">
                  <div className="h-4 w-full rounded-md bg-slate-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[300px] shrink-0 space-y-4">
            {/* Level selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="h-3 w-12 rounded bg-slate-200" />
              <div className="h-8 w-full rounded-lg bg-slate-200" />
            </div>

            {/* Skills */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="h-3 w-12 rounded bg-slate-200" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-6 w-16 rounded-full bg-slate-200" />
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="flex flex-wrap gap-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-6 w-20 rounded-full bg-slate-200" />
                ))}
              </div>
            </div>

            {/* Certificates */}
            <div className="h-28 rounded-xl bg-slate-100" />

            {/* Account */}
            <div className="h-36 rounded-xl bg-slate-100" />
          </aside>
        </div>
      </div>
    </div>
  );
}
