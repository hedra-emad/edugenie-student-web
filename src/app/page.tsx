import { Code2, Atom, Zap, Palette, LucideIcon } from "lucide-react";
import HeroSection, { MiniCourse } from "@/components/sections/HeroSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import FeaturedCourses from "@/components/sections/FeaturedCourses";
import ChooseUs from "@/components/sections/ChooseUs";
import InstructorCards from "@/components/sections/InstructorCards";
import FinalCTA from "@/components/sections/FinalCTA";
import { fetchCoursesForHome } from "@/lib/api/courses";
import { Course } from "@/types/course";

const ICON_GRADIENT_PAIRS: { icon: LucideIcon; gradient: string }[] = [
  { icon: Code2, gradient: "from-violet-800 to-blue-700" },
  { icon: Atom, gradient: "from-cyan-800 to-sky-600" },
  { icon: Zap, gradient: "from-emerald-900 to-emerald-600" },
  { icon: Palette, gradient: "from-purple-800 to-pink-600" },
];

function toMiniCourses(courses: Course[]): MiniCourse[] {
  return [...courses]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 4)
    .map((course, index) => {
      const instructor = course.instructor ?? course.instructorId;
      const { icon, gradient } = ICON_GRADIENT_PAIRS[index % 4];
      return {
        id: course.id,
        icon,
        gradient,
        title: course.title,
        instructor: instructor
          ? `${instructor.firstName} ${instructor.lastName}`.trim()
          : "EduGenie Instructor",
        lessons: course.totalLessons ?? 0,
        rating: course.ratingAverage ?? 0,
        badge: "new" as const,
      };
    });
}

export default async function Home() {
  // Public featured courses — fetch only what we render (9), cached via ISR.
  const courses = await fetchCoursesForHome(9);
  const miniCourses = toMiniCourses(courses);

  return (
    <div>
      <HeroSection miniCourses={miniCourses} />
      {/* <CategoriesSection /> */}
      <FeaturedCourses courses={courses} limit={9} />
      <ChooseUs />
      <InstructorCards />
      <FinalCTA />
    </div>
  );
}
