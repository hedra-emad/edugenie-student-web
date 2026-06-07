import Link from "next/link";
 
export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between">
        {/* Left: Brand + copyright */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-bold text-[#3B1892] tracking-tight">
            EduGenie
          </span>
          <span className="text-xs text-gray-500">
            © 2026 EduGenie AI. Visionary Learning Systems.
          </span>
        </div>
 
        {/* Right: Nav links */}
        <nav className="flex items-center gap-6">
          <Link
            href="/privacy-policy"
            className="text-sm font-medium text-gray-700 hover:text-indigo-700 transition-colors duration-150"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-sm font-medium text-gray-700 hover:text-indigo-700 transition-colors duration-150"
          >
            Terms of Service
          </Link>
          <Link
            href="/instructor-portal"
            className="text-sm font-medium text-gray-700 hover:text-indigo-700 transition-colors duration-150"
          >
            Instructor Portal
          </Link>
        </nav>
      </div>
    </footer>
  );
}