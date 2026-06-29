import React from 'react';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function AuthButton({ 
  children, 
  loading = false, 
  disabled, 
  type = 'button',
  className = '',
  ...props 
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`w-full bg-primary hover:bg-primary-light text-white font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg hover:shadow-primary/25 transform transition-all duration-300 hover:-translate-y-[1px] active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md flex justify-center items-center ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
