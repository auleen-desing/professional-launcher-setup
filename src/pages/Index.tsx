import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { NewsSection } from '@/components/NewsSection';
import { DownloadSection } from '@/components/DownloadSection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <NewsSection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
