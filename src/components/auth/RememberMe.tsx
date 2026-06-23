import React from 'react';
import Link from 'next/link';

interface RememberMeProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function RememberMe({ checked, onChange }: RememberMeProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <input
          id="remember-me"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 border-primary accent-primary focus:ring-primary rounded cursor-pointer"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-text-primary cursor-pointer">
          Remember me
        </label>
      </div>

      <div className="text-sm">
        <Link href="/forgot-password" className="text-secondary hover:text-blue-100 transition-colors">
          Forgot Password?
        </Link>
      </div>
    </div>
  );
}
