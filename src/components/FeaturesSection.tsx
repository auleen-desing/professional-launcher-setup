import { Swords, Shield, Users, Zap, Trophy, Gift, Sparkles, Target } from 'lucide-react';

const features = [
  {
    icon: Swords,
    title: 'Intense PvP',
    description: 'Optimised combat system with weekly tournaments and competitive rankings.',
  },
  {
    icon: Shield,
    title: 'Advanced Anti-Cheat',
    description: 'State-of-the-art protection to guarantee a fair experience for everyone.',
  },
  {
    icon: Users,
    title: 'Active Community',
    description: 'Active players with daily events and 24/7 support.',
  },
  {
    icon: Zap,
    title: 'Constant Updates',
    description: 'New content every week: dungeons, items, events and improvements.',
  },
  {
    icon: Trophy,
    title: 'Ranking System',
    description: 'Climb the rankings and unlock exclusive rewards and unique titles.',
  },
  {
    icon: Gift,
    title: 'Exclusive Events',
    description: 'Participate in unique events with real prizes and legendary items.',
  },
  {
    icon: Sparkles,
    title: 'Exclusive Content',
    description: 'Dungeons, bosses and quests designed exclusively for NovaEra.',
  },
  {
    icon: Target,
    title: 'Perfect Balance',
    description: 'Constant balance between classes for competitive PvP and PvE.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">Why choose </span>
            <span className="text-gradient-gold">NovaEra</span>
            <span className="text-foreground">?</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover all the features that make NovaEra the ultimate server for NosTale fans.
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
