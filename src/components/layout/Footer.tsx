import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface px-4 py-2 sm:px-6 lg:px-8 shadow-footer max-[360px]:py-4 max-[360px]:px-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center max-[360px]:gap-3">
        <div className="max-[360px]:text-center">
          <h2 className="text-xl font-bold text-primary mb-1 max-[360px]:text-lg">
            EduGenie
          </h2>
          <p className="text-sm text-text-secondary max-[360px]:text-xs">
            © 2026 EduGenie AI. Visionary Learning Systems.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6 text-sm font-medium text-text-secondary max-[360px]:gap-2.5 max-[360px]:text-xs-alt max-[360px]:justify-center">
          <Link
            href="/privacy-policy"
            className="hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="hover:text-primary transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/instructor-portal"
            className="hover:text-primary transition-colors"
          >
            Instructor Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}