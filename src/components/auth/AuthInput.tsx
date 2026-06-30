import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  showSuccess?: boolean;
}

export default function AuthInput({
  label,
  id,
  type = 'text',
  icon,
  error,
  showSuccess,
  className = '',
  ...props
}: AuthInputProps) {
  const isError = !!error;

  return (
    <div className="relative w-full group">
      {label && id && (
        <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-1.5 transition-colors group-focus-within:text-primary">
          {label}
        </label>
      )}

      <div className="relative w-full">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={type}
          className={`w-full bg-surface text-text-primary rounded-lg py-2.5 ${icon ? 'pl-[2.75rem]' : 'pl-4'} pr-4 border transition-all duration-300 focus:outline-none focus:ring-[3px] focus:ring-primary/20 focus:border-primary hover:border-primary/50 placeholder:text-gray-400/80 ${
            isError
              ? 'border-error focus:ring-error/20 focus:border-error hover:border-error/70'
              : showSuccess
                ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500'
                : 'border-gray-200'
          } ${className}`}
          {...props}
        />

        {showSuccess && !isError && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-green-500 animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Error block always rendered to reserve space; content/visibility toggled */}
      <div
  className={`mt-1 text-error flex items-start gap-1 min-h-[1.25rem] transition-opacity duration-200 ${
    isError ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`}
>
  <svg className="w-3 h-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span className="block leading-relaxed text-[10px]">{error || '\u00A0'}</span>
</div>
    </div>
  );
}