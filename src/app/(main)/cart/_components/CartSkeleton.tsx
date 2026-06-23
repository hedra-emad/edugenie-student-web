// src/app/(main)/cart/_components/CartSkeleton.tsx
// Purely presentational loading skeleton — no logic, no state.
// Matches the two-column layout (lg:grid-cols-[1fr_380px]) used by CartPageClient.
// Requirements: 1.3, 12.2

export default function CartSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading cart"
      className="w-full max-w-5xl mx-auto px-4 py-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* ── Left column: item list placeholders ───────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Skeleton heading */}
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />

          {/* Three shimmer item cards */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 animate-pulse"
            >
              {/* Thumbnail rect */}
              <div className="w-20 h-14 rounded-xl bg-slate-200 flex-shrink-0" />

              {/* Text placeholders */}
              <div className="flex-1 flex flex-col gap-2">
                {/* Title rect */}
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                {/* Instructor / subtitle rect */}
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                {/* Badge rect */}
                <div className="h-3 bg-slate-200 rounded w-1/4" />
              </div>

              {/* Price rect */}
              <div className="h-5 w-16 bg-slate-200 rounded flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* ── Right column: order summary panel placeholder ──────────────── */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 animate-pulse">
            {/* Panel heading */}
            <div className="h-5 w-36 bg-slate-200 rounded" />

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Line items */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-3 w-12 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-12 bg-slate-200 rounded" />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Total row */}
            <div className="flex justify-between items-center">
              <div className="h-4 w-10 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-200 rounded" />
            </div>

            {/* Coupon toggle placeholder */}
            <div className="h-3 w-28 bg-slate-200 rounded" />

            {/* Proceed to checkout button placeholder */}
            <div className="h-12 w-full bg-slate-200 rounded-xl" />

            {/* Payment badges placeholder */}
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-9 bg-slate-100 rounded-xl" />
              ))}
            </div>

            {/* Security note placeholder */}
            <div className="h-3 w-48 bg-slate-100 rounded mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
