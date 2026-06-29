import React from 'react';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out py-0.5 px-0.5 sm:px-1">
      {children}
    </div>
  );
}
