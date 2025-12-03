import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { NewsSection } from '@/components/NewsSection';
import { DownloadSection } from '@/components/DownloadSection';
import { Footer } from '@/components/Footer';
import { ServerStatus } from '@/components/ServerStatus';
import { ServerRates } from '@/components/ServerRates';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        {/* Server Info Section */}
        <section className="py-16 px-4 bg-card/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-8">
              Estado del <span className="text-gradient-cyan">Servidor</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <ServerStatus />
              <ServerRates />
            </div>
          </div>
        </section>
        
        <FeaturesSection />
        <NewsSection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
