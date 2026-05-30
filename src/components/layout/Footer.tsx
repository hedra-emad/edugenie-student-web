export const AuthFooter = () => {
  return (
    <footer className="mt-12 w-full max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4 px-6 text-[13px] text-gray-400 pb-8">
      <div className="flex items-center gap-2">
        <span className="font-bold text-[#2e2a91] text-lg">EduGenie</span>
        <span className="hidden md:inline text-gray-200">|</span>
        <span>© 2024 EduGenie AI. Visionary Learning Systems.</span>
      </div>
      <div className="flex gap-6 font-medium">
        <a href="#" className="hover:text-[#2e2a91] transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-[#2e2a91] transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-[#2e2a91] transition-colors text-gray-500 font-bold">Instructor Portal</a>
      </div>
    </footer>
  );
};