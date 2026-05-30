import React from 'react';

export const SocialLogin = () => {
  return (
    <div className="w-full">
      {/* Divider */}
      <div className="relative my-8 flex items-center">
        <div className="flex-grow border-t border-gray-100"></div>
        <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          or continue with
        </span>
        <div className="flex-grow border-t border-gray-100"></div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button type="button" className="flex items-center justify-center gap-2 p-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-sm text-gray-700 bg-white">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Google
        </button>
        <button type="button" className="flex items-center justify-center gap-2 p-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-sm text-gray-700 bg-white">
          <img src="https://www.svgrepo.com/show/512317/github-142.svg" className="w-5 h-5" alt="GitHub" />
          GitHub
        </button>
      </div>
    </div>
  );
};