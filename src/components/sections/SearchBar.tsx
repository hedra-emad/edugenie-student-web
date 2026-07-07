"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/courses?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="
        flex items-center
        bg-white rounded-2xl shadow-2xl shadow-black/30
        p-1.5 pl-3 sm:p-2 sm:pl-5
        w-full
      "
    >
      {/* Search Icon */}
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      {/* Input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What do you want to learn today?"
        className="
          flex-1 min-w-0 text-slate-800 text-[14px] sm:text-[15px] bg-transparent outline-none
          placeholder:text-slate-400 font-medium px-2 sm:px-3
        "
      />

      {/* Button */}
      <Button type="submit" className="flex-shrink-0">
        <span className="sm:hidden">Search</span>
        <span className="hidden sm:inline">Search Courses</span>
      </Button>
    </form>
  );
}
