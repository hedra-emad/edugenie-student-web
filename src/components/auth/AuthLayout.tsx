import React from 'react';
import AuthSidebar from './AuthSidebar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background-page to-blue-50/50 relative">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-40 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-[80px]"></div>
      </div>

      <main className="flex-1 flex w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 z-10">
        <div className="w-full max-w-[1000px] m-auto bg-white/90 backdrop-blur-sm rounded-[2.5rem] shadow-layout flex flex-col lg:flex-row overflow-hidden border border-white/50">
          {/* Left Sidebar */}
          <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
            <AuthSidebar />
          </div>

          {/* Right Panel */}
          <div className="auth-right-panel w-full lg:w-[55%] relative overflow-hidden bg-white">
            <div className="flex flex-col items-center justify-center py-8 lg:py-10 sm:px-10 h-full w-full max-w-[480px] mx-auto">
              {children}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
