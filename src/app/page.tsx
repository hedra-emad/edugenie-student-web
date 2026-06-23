import HeroSection from "@/components/sections/HeroSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import FeaturedCourses from "@/components/sections/FeaturedCourses";
import ChooseUs from "@/components/sections/ChooseUs";
import InstructorCards from "@/components/sections/InstructorCards";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <CategoriesSection />
      <FeaturedCourses />
      <ChooseUs />
      <InstructorCards />
      <FinalCTA />
      {/* <h1  >Hello in EDU GENIE Home</h1> */}
      {/* <LoginPage /> */}
    </div>
  );
}
