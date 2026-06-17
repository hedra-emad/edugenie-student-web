// app/courses/[courseId]/loading.tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero skeleton */}
      <div className="bg-slate-900 px-4 sm:px-6 lg:px-10 py-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="h-3 w-40 bg-white/10 rounded-full mb-6 animate-pulse" />
          <div className="h-6 w-20 bg-white/10 rounded-full mb-4 animate-pulse" />
          <div className="h-8 w-3/4 bg-white/10 rounded-xl mb-3 animate-pulse" />
          <div className="h-4 w-1/2 bg-white/10 rounded-lg mb-5 animate-pulse" />
          <div className="flex gap-2">
            {[60, 80, 56, 72].map((w, i) => (
              <div key={i} className="h-8 bg-white/10 rounded-full animate-pulse" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_352px] gap-10">
          <div className="flex flex-col gap-5">
            {[180, 280, 140, 120].map((h, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 animate-pulse" style={{ height: h }} />
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 h-[520px] animate-pulse" />
        </div>
      </div>
    </main>
  );
}