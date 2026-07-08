import CourseCard from "@/components/courses/CourseCard";
import { fetchInstructorCourses } from "@/lib/api/instructors";

export default async function InstructorCoursesPage({
  params,
}: {
  params: Promise<{ instructorId: string }>;
}) {
  const { instructorId } = await params;
  const courses = await fetchInstructorCourses(instructorId);

  return (
    <section className="bg-[#f0f2f5] py-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <h1
          className="text-[1.85rem] leading-tight tracking-tight mb-8 text-slate-900"
          style={{ fontWeight: 800 }}
        >
          Courses by this instructor
        </h1>

        {courses.length > 0 ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="text-base font-semibold">No courses available yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
