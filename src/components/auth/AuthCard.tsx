import React from 'react';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-[465px] px-4 sm:px-1 animate-in fade-in slide-in-from-bottom-4 py-3 duration-700 ease-out">
      {children}
    </div>
  );
}