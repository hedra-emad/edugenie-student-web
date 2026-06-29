import React from 'react';

export default function AuthSidebar() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-sidebar-bg via-[#112240] to-sidebar-bg text-white h-full w-full flex flex-col items-center justify-center p-6 sm:p-8">
      {/* Top glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-secondary/20 blur-[80px] rounded-full pointer-events-none"></div>
      {/* Bottom glow effect */}
      <div className="absolute bottom-0 right-0 w-3/4 h-32 bg-primary/30 blur-[60px] rounded-full pointer-events-none"></div>
      
      <div className="flex-grow flex flex-col justify-center items-center text-center w-full z-10 relative">
        {/* Logo */}
        <div className="w-48 h-24 relative mb-6 group">
          <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <img 
            src="/icoon.png" 
            alt="EduGenie Logo" 
            className="w-full h-full object-contain drop-shadow-logo-glow relative z-10 transform transition-transform duration-500 group-hover:scale-105" 
            onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }}
          />
        </div>

        <div className="space-y-6 max-w-sm">
          <p className="text-secondary font-medium text-[10px] tracking-[0.2em] uppercase">Intelligent Learning Ecosystem</p>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
            Elevate Your<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-blue-200 to-cyan-300 italic font-serif pr-2">Coding</span><br/>
            Intelligence.
          </h2>
          
          <p className="text-blue-100/70 text-xs leading-relaxed mx-auto font-light mb-6">
            The all-in-one platform to master modern software development. Learn, build, and shape your future with EduGenie.
          </p>
        </div>
      </div>
      
      {/* Bottom faint text */}
      <p className="mt-6 text-[9px] text-white/30 tracking-widest font-bold uppercase z-10">
        Empowering Your Dev Experience
      </p>
    </div>
  );
}
