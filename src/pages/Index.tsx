import SmoothScroll from "@/components/SmoothScroll";
import SplashIntro from "@/components/SplashIntro";
import Navbar from "@/components/verimat/Navbar";
import Hero from "@/components/verimat/Hero";
import ScanningSection from "@/components/verimat/ScanningSection";
import ProblemSection from "@/components/verimat/ProblemSection";
import HowItWorks from "@/components/verimat/HowItWorks";
import Features from "@/components/verimat/Features";
import Technology from "@/components/verimat/Technology";
import CTASection from "@/components/verimat/CTASection";
import Footer from "@/components/verimat/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SmoothScroll />
      <SplashIntro />
      <Navbar />
      <main>
        <Hero />
        <ScanningSection />
        <ProblemSection />
        <HowItWorks />
        <Features />
        <Technology />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
