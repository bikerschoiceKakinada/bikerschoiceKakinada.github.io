import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SignatureWork from "@/components/SignatureWork";
import SocialSection from "@/components/SocialSection";
import ServicesSection from "@/components/ServicesSection";
import GallerySection from "@/components/GallerySection";
import OnlineDelivery from "@/components/OnlineDelivery";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <SignatureWork />
      <SocialSection />
      <ServicesSection />
      <GallerySection />
      <OnlineDelivery />
      <AboutSection />
      <ContactSection />
      <FooterSection />
    </div>
  );
};

export default Index;
