import type { Metadata } from "next";
import HeroV2 from "@/components/home-v2/HeroV2";
import MasteryPath from "@/components/home-v2/MasteryPath";
import FeaturesBento from "@/components/home-v2/FeaturesBento";
import FeaturedV2 from "@/components/home-v2/FeaturedV2";
import InstructorCards from "@/components/sections/InstructorCards";
import FinalCtaV2 from "@/components/home-v2/FinalCtaV2";
import { fetchCoursesForHome } from "@/lib/api/courses";

export const metadata: Metadata = {
  title: "EduGenie — Master it, don't just watch it",
  description:
    "An AI-guided learning path from your first lesson to the role you want: placement, a three-tier AI tutor, mastery-gated progress, and verified certificates.",
};

export default async function HomeV2() {
  // Same public feed the current home uses — real, ISR-cached courses.
  const courses = await fetchCoursesForHome(6);

  return (
    <div>
      <HeroV2 />
      <MasteryPath />
      <FeaturesBento />
      <FeaturedV2 courses={courses} limit={6} />
      <InstructorCards />
      <FinalCtaV2 />
    </div>
  );
}
