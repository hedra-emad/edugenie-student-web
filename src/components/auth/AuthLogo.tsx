import React from 'react';

interface AuthLogoProps {
  dark?: boolean;
}

export default function AuthLogo({ dark = false }: AuthLogoProps) {
  return (
    <div className="flex flex-col items-center justify-center mb-2">
      <div className="flex items-center space-x-2">
        <img 
          src="/logo.jpg" 
          alt="EduGenie Icon" 
          className="w-full sm:h-15 h-20 object-contain" 
          onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }}
        />
      </div>
    </div>
  );
}
