"use client";

export const AuthToggle = () => {
  return (
    <div className="bg-gray-100/80 p-1 rounded-2xl flex mb-8 w-full border border-gray-200/50">
      <button className="flex-1 bg-white shadow-sm py-2.5 rounded-xl text-sm font-bold text-[#2e2a91] transition-all">
        Sign In
      </button>
      <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 transition-all">
        Create Account
      </button>
    </div>
  );
};