import React from 'react';
import DotsLoader from '@/components/ui/DotsLoader';

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
      {loading ? <DotsLoader /> : children}
    </button>
  );
}
