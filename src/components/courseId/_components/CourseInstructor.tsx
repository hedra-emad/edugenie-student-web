// _components/CourseInstructor.tsx
import Avatar from "@/components/ui/Avatar";
import type { Instructor } from "../../../app/courses/[courseId]/types/course";

export default function CourseInstructor({ instructor }: { instructor: Instructor }) {
  const fullName = `${instructor.firstName} ${instructor.lastName}`;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-[15px] font-bold text-slate-900 mb-5">Your Instructor</h2>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar
          src={instructor.avatar}
          name={instructor.firstName}
          className="w-16 h-16 flex-shrink-0 border border-slate-200"
          textSizeClassName="text-xl"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-slate-900">{fullName}</h3>
          <p className="text-[12.5px] text-slate-400 mt-0.5">Instructor</p>
        </div>
      </div>
    </section>
  );
}