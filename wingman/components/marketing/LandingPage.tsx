import { CategoryGrid } from "@/components/marketing/CategoryGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { Features } from "@/components/marketing/Features";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Navbar } from "@/components/marketing/Navbar";
import { StatsRow } from "@/components/marketing/StatsRow";
import { Testimonials } from "@/components/marketing/Testimonials";
import { TrustBar } from "@/components/marketing/TrustBar";
import { WhyWingman } from "@/components/marketing/WhyWingman";

export function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <StatsRow />
        <CategoryGrid />
        <WhyWingman />
        <Features />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
