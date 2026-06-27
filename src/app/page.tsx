import HeroSection from "@/components/sections/HeroSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import FeaturedCourses from "@/components/sections/FeaturedCourses";
import ChooseUs from "@/components/sections/ChooseUs";
import InstructorCards from "@/components/sections/InstructorCards";
import FinalCTA from "@/components/sections/FinalCTA";
import { fetchCoursesForHome } from "@/lib/api/courses";

export default async function Home() {
  // Public featured courses — fetch only what we render (9), cached via ISR.
  const courses = await fetchCoursesForHome(9);

  return (
    <div>
      <HeroSection />
      {/* <CategoriesSection /> */}
      <FeaturedCourses courses={courses} limit={9} />
      <ChooseUs />
      <InstructorCards />
      <FinalCTA />
    </div>
  );
}
