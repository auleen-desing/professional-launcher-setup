import { Swords, Shield, Users, Zap, Trophy, Gift, Sparkles, Target } from 'lucide-react';

const features = [
  {
    icon: Swords,
    title: 'PvP Intenso',
    description: 'Sistema de combate optimizado con torneos semanales y rankings competitivos.',
  },
  {
    icon: Shield,
    title: 'Anti-Cheat Avanzado',
    description: 'Protección de última generación para garantizar una experiencia justa para todos.',
  },
  {
    icon: Users,
    title: 'Comunidad Activa',
    description: 'Más de 15,000 jugadores activos con eventos diarios y soporte 24/7.',
  },
  {
    icon: Zap,
    title: 'Actualizaciones Constantes',
    description: 'Nuevo contenido cada semana: dungeons, items, eventos y mejoras.',
  },
  {
    icon: Trophy,
    title: 'Sistema de Ranks',
    description: 'Escala en el ranking y desbloquea recompensas exclusivas y títulos únicos.',
  },
  {
    icon: Gift,
    title: 'Eventos Exclusivos',
    description: 'Participa en eventos únicos con premios reales y items legendarios.',
  },
  {
    icon: Sparkles,
    title: 'Contenido Exclusivo',
    description: 'Mazmorras, jefes y misiones diseñadas exclusivamente para NovaEra.',
  },
  {
    icon: Target,
    title: 'Balance Perfecto',
    description: 'Equilibrio constante entre clases para PvP y PvE competitivo.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">¿Por qué elegir </span>
            <span className="text-gradient-gold">NovaEra</span>
            <span className="text-foreground">?</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre todas las características que hacen de NovaEra el servidor definitivo para los fans de Metin2.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <div className="relative">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
