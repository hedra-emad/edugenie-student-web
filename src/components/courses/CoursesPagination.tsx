"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationMeta } from "@/types/course";

interface Props {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  isFetching: boolean;
}

export default function CoursesPagination({
  pagination,
  onPageChange,
  isFetching,
}: Props) {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

  if (totalPages <= 1) return null;

  // Build visible page numbers with ellipsis
  function getPages(): (number | "…")[] {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | "…")[] = [1];

    if (currentPage > 3) pages.push("…");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("…");

    pages.push(totalPages);
    return pages;
  }

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10">
      {/* Result count */}
      <p className="text-sm text-slate-400 order-2 sm:order-1">
        Showing{" "}
        <span className="font-semibold text-slate-700">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-slate-700">{totalItems}</span>{" "}
        courses
      </p>

      {/* Pages */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* Prev */}
        <PageBtn
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrevPage || isFetching}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </PageBtn>

        {getPages().map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="w-9 text-center text-slate-400 text-sm"
            >
              …
            </span>
          ) : (
            <PageBtn
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={isFetching}
              active={p === currentPage}
              aria-label={`Page ${p}`}
            >
              {p}
            </PageBtn>
          ),
        )}

        {/* Next */}
        <PageBtn
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNextPage || isFetching}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </PageBtn>
      </div>
    </div>
  );
}

// ─── PageBtn ──────

function PageBtn({
  children,
  onClick,
  disabled,
  active,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold
        transition-all duration-150 select-none
        ${ active
            ? "bg-[#3B1892] text-white shadow-[0_4px_12px_rgba(124,58,237,0.4)]"
            : disabled
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-500 hover:bg-violet-50 hover:text-violet-600 border border-slate-200"
        }
      `}
    >
      {children}
    </button>
  );
}
