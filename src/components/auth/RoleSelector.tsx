import React from 'react';

interface RoleSelectorProps {
  value: 'student' | 'instructor';
  onChange: (value: 'student' | 'instructor') => void;
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-text-primary mb-2">
        Select your role
      </label>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onChange('student')}
          className={`group flex flex-col items-center justify-center p-5 border rounded-xl transition-all duration-300 focus:outline-none focus:ring-[3px] focus:ring-primary/20 ${
            value === 'student'
              ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-sm transform scale-[1.02]'
              : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50 bg-white hover:-translate-y-1'
          }`}
        >
          <div className={`p-3 rounded-full mb-3 transition-colors ${value === 'student' ? 'bg-primary/10' : 'bg-gray-100 group-hover:bg-primary/5'}`}>
            <svg className={`w-7 h-7 transition-colors ${value === 'student' ? 'text-primary' : 'text-gray-400 group-hover:text-primary/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v6m0 0l-3-3m3 3l3-3"></path>
            </svg>
          </div>
          <span className={`text-sm font-bold tracking-wide ${value === 'student' ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>Student</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('instructor')}
          className={`group flex flex-col items-center justify-center p-5 border rounded-xl transition-all duration-300 focus:outline-none focus:ring-[3px] focus:ring-secondary/20 ${
            value === 'instructor'
              ? 'border-secondary bg-secondary/5 ring-1 ring-secondary shadow-sm transform scale-[1.02]'
              : 'border-gray-200 hover:border-secondary/40 hover:bg-gray-50 bg-white hover:-translate-y-1'
          }`}
        >
          <div className={`p-3 rounded-full mb-3 transition-colors ${value === 'instructor' ? 'bg-secondary/10' : 'bg-gray-100 group-hover:bg-secondary/5'}`}>
            <svg className={`w-7 h-7 transition-colors ${value === 'instructor' ? 'text-secondary' : 'text-gray-400 group-hover:text-secondary/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <span className={`text-sm font-bold tracking-wide ${value === 'instructor' ? 'text-secondary' : 'text-text-secondary group-hover:text-text-primary'}`}>Instructor</span>
        </button>
      </div>
    </div>
  );
}
