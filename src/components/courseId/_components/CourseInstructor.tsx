// _components/CourseInstructor.tsx
import Image from "next/image";
import type { Instructor } from "../../../app/courses/[courseId]/types/course";

export default function CourseInstructor({ instructor }: { instructor: Instructor }) {
  const fullName = `${instructor.firstName} ${instructor.lastName}`;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-[15px] font-bold text-slate-900 mb-5">Your Instructor</h2>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
          {instructor.avatar ? (
            <Image
              src={instructor.avatar}
              alt={fullName}
              fill
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-slate-600">
              {instructor.firstName[0]}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-slate-900">{fullName}</h3>
          <p className="text-[12.5px] text-slate-400 mt-0.5">Instructor</p>
        </div>
      </div>
    </section>
  );
}