import React from 'react';

export default function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300"></div>
      </div>
      <div className="relative flex justify-center">
        <span className="px-4 py-1 text-xs sm:text-sm font-medium text-gray-600 bg-background rounded-full border border-gray-200 shadow-sm">
          {children}
        </span>
      </div>
    </div>
  );
}
