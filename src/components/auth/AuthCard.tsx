import React from 'react';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out  sm:px-1">
      {children}
    </div>
  );
}
