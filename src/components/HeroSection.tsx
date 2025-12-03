import { Download, Play, Users, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import novaScreenshot from '@/assets/novaera-screenshot.png';

export function HeroSection() {
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
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary">Servidor Online • 1,247 Jugadores</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="text-foreground">ÚNETE A LA</span>
              <br />
              <span className="text-gradient-gold">NUEVA ERA</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Experimenta el servidor de Metin2 más épico. PvP intenso, eventos exclusivos, 
              comunidad activa y actualizaciones constantes. Tu aventura comienza aquí.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold-strong text-lg px-8 py-6 font-bold"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar Launcher
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary/50 text-primary hover:bg-primary/10 text-lg px-8 py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Ver Trailer
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">15K+</div>
                <div className="text-sm text-muted-foreground">Jugadores</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Soporte</div>
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
                    alt="NovaEra Evento"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
                      Evento Activo
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    🎮 Torneo PvP de Temporada
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Participa en el torneo más grande del servidor. Premios exclusivos, 
                    títulos únicos y recompensas épicas te esperan.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>256 participantes</span>
                    </div>
                    <Button size="sm" className="bg-primary text-primary-foreground">
                      Inscribirse
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
