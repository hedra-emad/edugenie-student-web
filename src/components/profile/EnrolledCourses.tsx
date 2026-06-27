function BookOpenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-gray-300"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export default function EnrolledCourses() {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-4">Your courses</h2>
      <div
        className="flex flex-col items-center justify-center gap-3
                   border border-dashed border-gray-200 rounded-2xl py-14 px-6 text-center"
      >
        <BookOpenIcon />
        <p className="text-sm text-gray-500">
          Your enrolled courses will appear here.
        </p>
      </div>
    </section>
  );
}