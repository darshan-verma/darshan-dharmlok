import LandingPage from "@/components/landing/LandingPage";
import { getHomepageData } from "@/lib/homepage-data";

export default async function Home() {
  const homepageData = await getHomepageData();
  return (
    <LandingPage
      heroSlides={homepageData.heroSlides}
      sections={homepageData.sections}
    />
  );
}
