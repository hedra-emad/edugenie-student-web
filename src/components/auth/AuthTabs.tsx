import React from 'react';

interface AuthTabsProps {
  activeTab: 'signin' | 'signup';
  onTabChange: (tab: 'signin' | 'signup') => void;
}

export default function AuthTabs({ activeTab, onTabChange }: AuthTabsProps) {
  return (
    <div className="relative flex p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl mb-6 shadow-inner border border-gray-200/50">
      <div 
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out border border-gray-200/50 ${
          activeTab === 'signin' ? 'left-1' : 'left-[calc(50%+2px)]'
        }`}
      />
      
      <button
        type="button"
        onClick={() => onTabChange('signin')}
        className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors duration-300 ${
          activeTab === 'signin' 
            ? 'text-primary' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onTabChange('signup')}
        className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors duration-300 ${
          activeTab === 'signup' 
            ? 'text-primary' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Create Account
      </button>
    </div>
  );
}
