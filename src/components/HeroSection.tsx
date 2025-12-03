import { useState, useEffect } from 'react';
import { Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import novaScreenshot from '@/assets/novaera-screenshot.png';
import { API_CONFIG, buildApiUrl } from '@/config/api';

export function HeroSection() {
  const [serverStatus, setServerStatus] = useState<{ online: boolean; players: number }>({
    online: false,
    players: 0
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SERVER.STATUS));
        const data = await response.json();
        if (data.success) {
          const onlineChannels = data.data.channels.filter((ch: any) => ch.status === 'online');
          setServerStatus({
            online: onlineChannels.length > 0,
            players: data.data.totalPlayers
          });
        }
      } catch (err) {
        console.error('Failed to fetch server status:', err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen pt-20 overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <img
          src={novaScreenshot}
          alt="NovaEra Gameplay"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[calc(100vh-5rem)] py-12 gap-12">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <span className={`w-2 h-2 rounded-full animate-pulse ${serverStatus.online ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-primary">
                {serverStatus.online ? `Server Online • ${serverStatus.players} Players` : 'Server Offline'}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="text-foreground">JOIN THE</span>
              <br />
              <span className="text-gradient-gold">NEW ERA</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Experience the most epic NosTale private server. Intense PvP, exclusive events, 
              active community and constant updates. Your adventure starts here.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold-strong text-lg px-8 py-6 font-bold"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Launcher
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 max-w-xs mx-auto lg:mx-0">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>
          </div>

          {/* Right Content - Featured Card */}
          <div className="flex-1 max-w-lg w-full">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/20 rounded-2xl blur-lg" />
              <div className="relative bg-card border border-border rounded-2xl overflow-hidden">
                <div className="relative">
                  <img
                    src={novaScreenshot}
                    alt="NovaEra Event"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
                      Active Event
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    🎉 Invitation Event!
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Bring friends and Earn Exclusive Rewards! Invite your friends to NovaEra 
                    and unlock amazing prizes together.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Join now</span>
                    </div>
                    <Button size="sm" className="bg-primary text-primary-foreground">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
