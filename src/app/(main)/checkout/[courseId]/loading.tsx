// src/app/(main)/checkout/[courseId]/loading.tsx
export default function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="mb-8 flex flex-col gap-2">
          <div className="animate-pulse h-3 w-16 bg-slate-100 rounded" />
          <div className="animate-pulse h-7 w-56 bg-slate-100 rounded" />
          <div className="animate-pulse h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-24" />
            ))}
          </div>
          <div className="animate-pulse bg-slate-100 rounded-2xl h-64" />
        </div>
      </div>
    </main>
  );
}