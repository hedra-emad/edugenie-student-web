"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { CourseFilters, CourseLevel, SortOption } from "@/types/course";
import { CategoryOption } from "@/lib/api/courses";
import Button from "@/components/ui/Button";

const LEVELS: { value: CourseLevel | ""; label: string }[] = [
  { value: "", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
];

const RATINGS = [4.5, 4.0, 3.5, 3.0];

const DURATIONS: { value: number; label: string }[] = [
  { value: 3, label: "Under 3 hours" },
  { value: 6, label: "Under 6 hours" },
  { value: 10, label: "Under 10 hours" },
  { value: 20, label: "Under 20 hours" },
];

interface Props {
  filters: CourseFilters;
  categories: CategoryOption[];
  activeFilterCount: number;
  isFetching: boolean;
  onFilterChange: (updates: Partial<CourseFilters>) => void;
  onReset: () => void;
}

function FilterSelect<T extends string | number>({
  value,
  onChange,
  children,
}: {
  value: T | "";
  onChange: (v: T | "") => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
        className="
          appearance-none w-full bg-white border border-slate-200
          text-slate-700 text-sm font-medium
          pl-3 pr-8 py-2.5 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400
          cursor-pointer transition-colors duration-150 hover:border-violet-300
        "
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
}

export default function CoursesFilterBar({
  filters,
  categories,
  activeFilterCount,
  isFetching,
  onFilterChange,
  onReset,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSearchRef = useRef(filters.search);

  useEffect(() => {
    if (filters.search === "" && prevSearchRef.current !== "") {
      setLocalSearch("");
    }
    prevSearchRef.current = filters.search;
  }, [filters.search]);

  // Cleanup عند الـ unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  function handleSearch(val: string) {
    setLocalSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onFilterChange({ search: val });
    }, 400);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* TOP BAR */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search courses, topics, instructors…"
            className="
              w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200
              text-sm text-slate-700 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-[#3B1892] focus:border-violet-400
              transition-colors duration-150 bg-slate-50 hover:bg-white
            "
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#3B1892] border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="hidden sm:block min-w-[180px]">
          <FilterSelect
            value={filters.sort}
            onChange={(v) => onFilterChange({ sort: v as SortOption })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FilterSelect>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen((p) => !p)}
          className="flex-shrink-0"
          leftIcon={<SlidersHorizontal size={15} />}
        >
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            type="button"
            variant="destructiveSoft"
            size="sm"
            onClick={onReset}
            className="flex-shrink-0"
            leftIcon={<X size={14} />}
          >
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}
      </div>

      {/* EXPANDABLE FILTERS */}
      <div
        className={`transition-all duration-300 overflow-hidden
          ${mobileOpen ? "max-h-[600px]" : "max-h-0"}
          lg:max-h-[600px]`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
          <FilterSelect
            value={filters.category}
            onChange={(v) => onFilterChange({ category: v })}
          >
            <option key="all-categories" value="">All Categories</option>
            {categories.map((c) => (
              <option
                key={
                  (c as CategoryOption & { id?: string }).id ?? c.id ?? c.slug
                }
                value={c.id}
              >
                {c.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.level}
            onChange={(v) => onFilterChange({ level: v as CourseLevel | "" })}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </FilterSelect>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              EGP
            </span>
            <input
              type="number"
              min={0}
              placeholder="Min price"
              value={filters.minPrice}
              onChange={(e) =>
                onFilterChange({
                  minPrice: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className="
                w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200
                text-sm text-slate-700 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-[#3B1892]
                transition-colors duration-150 hover:border-[#3B1892]
              "
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              EGP
            </span>
            <input
              type="number"
              min={0}
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) =>
                onFilterChange({
                  maxPrice: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className="
                w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200
                text-sm text-slate-700 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-[#3B1892]
                transition-colors duration-150 hover:border-[#3B1892]
              "
            />
          </div>

          <FilterSelect
            value={filters.minRating}
            onChange={(v) =>
              onFilterChange({ minRating: v === "" ? "" : Number(v) })
            }
          >
            <option key="any-rating" value="">Any Rating</option>
            {RATINGS.map((r) => (
              <option key={r} value={r}>
                {"★".repeat(Math.floor(r))} {r}+
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.maxDuration}
            onChange={(v) =>
              onFilterChange({ maxDuration: v === "" ? "" : Number(v) })
            }
          >
            <option key="any-duration" value="">Any Duration</option>
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </FilterSelect>

          <div className="sm:hidden">
            <FilterSelect
              value={filters.sort}
              onChange={(v) => onFilterChange({ sort: v as SortOption })}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FilterSelect>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {filters.category && (
              <Chip
                label={
                  categories.find((c) => c.id === filters.category)?.name ??
                  "Category"
                }
                onRemove={() => onFilterChange({ category: "" })}
              />
            )}
            {filters.level && (
              <Chip
                label={filters.level}
                onRemove={() => onFilterChange({ level: "" })}
              />
            )}
            {filters.minPrice !== "" && (
              <Chip
                label={`Min EGP${filters.minPrice}`}
                onRemove={() => onFilterChange({ minPrice: "" })}
              />
            )}
            {filters.maxPrice !== "" && (
              <Chip
                label={`Max EGP${filters.maxPrice}`}
                onRemove={() => onFilterChange({ maxPrice: "" })}
              />
            )}
            {filters.minRating !== "" && (
              <Chip
                label={`★ ${filters.minRating}+`}
                onRemove={() => onFilterChange({ minRating: "" })}
              />
            )}
            {filters.maxDuration !== "" && (
              <Chip
                label={`< ${filters.maxDuration}h`}
                onRemove={() => onFilterChange({ maxDuration: "" })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-[#3B1892] text-xs font-semibold px-2.5 py-1 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-[#3B1892]"
      >
        <X size={11} />
      </button>
    </span>
  );
}
