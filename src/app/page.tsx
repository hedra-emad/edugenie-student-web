import { cookies } from "next/headers";
import HeroSection from "@/components/sections/HeroSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import FeaturedCourses from "@/components/sections/FeaturedCourses";
import ChooseUs from "@/components/sections/ChooseUs";
import InstructorCards from "@/components/sections/InstructorCards";
import FinalCTA from "@/components/sections/FinalCTA";
import { fetchCoursesForHome } from "@/lib/api/courses";

export default async function Home() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("access_token")?.value ??
    cookieStore.get("token")?.value ??
    cookieStore.get("accessToken")?.value ??
    undefined;

  // Fetch real courses — slice to 9 in FeaturedCourses, keep function generic
  const courses = await fetchCoursesForHome(token);

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
