'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { CategoryOption } from '@/lib/api/courses';
import CoursesFilterBar from '@/components/courses/CoursesFilterBar';
import CoursesGrid from '@/components/courses/CoursesGrid';
import CoursesPagination from '@/components/courses/CoursesPagination';
import Button from '@/components/ui/Button';

interface Props {
  categories: CategoryOption[];
}

export default function CoursesPageClient({ categories }: Props) {
  const {
    courses,
    pagination,
    filters,
    isLoading,
    isFetching,
    isError,
    setFilters,
    resetFilters,
    activeFilterCount,
  } = useCourses();

  return (
    <main className="bg-[#f0f2f5]">
      {/* ── PAGE HEADER — dark, matches Hero ── */}
      <div className="relative bg-[#0d1117] overflow-hidden">
        {/* glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-20 -left-20 w-72 h-72 rounded-full
                          bg-violet-600/10 blur-3xl"
          />
          <div
            className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full
                          bg-blue-600/10 blur-3xl"
          />
          {/* grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),' +
                'linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-300 font-medium">All Courses</span>
          </nav>

          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block flex-shrink-0" />
                <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">
                  All Courses
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight"
                style={{ fontWeight: 800 }}
              >
                Explore{' '}
                <span
                  className="text-transparent bg-clip-text
                                 bg-gradient-to-r from-violet-400 to-blue-400"
                >
                  800+
                </span>{' '}
                Expert Courses
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-lg leading-relaxed">
                Master in-demand skills with AI-guided paths, expert
                instructors, and rigorous assessments.
              </p>
            </div>

            {/* Live count badge */}
            {pagination && (
              <div
                className="flex-shrink-0 bg-white/6 border border-white/10
                              rounded-2xl px-5 py-3 text-center"
              >
                <p className="text-2xl font-black text-white leading-none tracking-tight">
                  {pagination.totalItems.toLocaleString('en-US')}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {activeFilterCount > 0 ? 'matching courses' : 'total courses'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="mb-7">
          <CoursesFilterBar
            filters={filters}
            categories={categories}
            activeFilterCount={activeFilterCount}
            isFetching={isFetching}
            onFilterChange={setFilters}
            onReset={resetFilters}
          />
        </div>

        {/* Error state */}
        {isError && (
          <div
            className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-7
                          flex items-center gap-4"
          >
            <span className="text-2xl select-none">⚠️</span>
            <div>
              <p className="font-bold text-red-700 text-sm">
                Failed to load courses
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                Please check your connection and try again.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setFilters({})}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Grid */}
        <CoursesGrid
          courses={courses}
          isLoading={isLoading}
          isFetching={isFetching}
          onReset={resetFilters}
          limit={filters.limit}
        />

        {/* Pagination */}
        {pagination && !isLoading && (
          <CoursesPagination
            pagination={pagination}
            isFetching={isFetching}
            onPageChange={(page) => {
              setFilters({ page });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>
    </main>
  );
}
