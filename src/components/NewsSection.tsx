import { Clock, MessageSquare, ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

const newsItems = [
  {
    id: 1,
    title: 'Actualización v3.5 - Nuevas Mazmorras',
    excerpt: 'Explora las nuevas mazmorras del Reino Oscuro con enemigos desafiantes y recompensas únicas...',
    date: '3 Dic 2025',
    comments: 47,
    category: 'Actualización',
    hot: true,
  },
  {
    id: 2,
    title: 'Evento de Navidad 2025',
    excerpt: 'Celebra las fiestas con eventos especiales, misiones temáticas y premios exclusivos...',
    date: '1 Dic 2025',
    comments: 89,
    category: 'Evento',
    hot: true,
  },
  {
    id: 3,
    title: 'Balance de Clases - Guerrero',
    excerpt: 'Ajustes importantes en las habilidades del guerrero para mejorar el equilibrio PvP...',
    date: '28 Nov 2025',
    comments: 124,
    category: 'Balance',
    hot: false,
  },
  {
    id: 4,
    title: 'Nuevo Sistema de Misiones Diarias',
    excerpt: 'Completa misiones cada día para obtener recompensas exclusivas y experiencia bonus...',
    date: '25 Nov 2025',
    comments: 56,
    category: 'Sistema',
    hot: false,
  },
];

const hotTopics = [
  { id: 1, title: 'Guía completa Guerrero Cuerpo', views: 12453, author: 'ProPlayer99' },
  { id: 2, title: 'Mejores builds Ninja PvP', views: 9876, author: 'ShadowMaster' },
  { id: 3, title: 'Farmeo eficiente nivel 100+', views: 8234, author: 'GoldHunter' },
  { id: 4, title: 'Tier list armas legendarias', views: 7654, author: 'WeaponExpert' },
  { id: 5, title: 'Consejos para principiantes', views: 6543, author: 'NovaHelper' },
];

export function NewsSection() {
  return (
    <section id="news" className="py-20 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* News Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full" />
                Últimas Noticias
              </h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                Ver todas <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="space-y-4">
              {newsItems.map((news) => (
                <article
                  key={news.id}
                  className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                          {news.category}
                        </span>
                        {news.hot && (
                          <span className="flex items-center gap-1 text-orange-500 text-xs font-semibold">
                            <Flame className="w-3 h-3" /> HOT
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                        {news.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {news.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {news.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {news.comments} comentarios
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hot Topics */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-transparent p-4 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  Hot Topics
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {hotTopics.map((topic, index) => (
                    <a
                      key={topic.id}
                      href="#"
                      className="flex items-start gap-3 group"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary text-xs font-bold rounded flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {topic.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {topic.views.toLocaleString()} views • {topic.author}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Discord Widget */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#5865F2]/20 to-transparent p-4 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                  Discord
                </h3>
              </div>
              <div className="p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">3,842</div>
                  <div className="text-sm text-muted-foreground mb-4">miembros online</div>
                  <Button className="w-full bg-[#5865F2] hover:bg-[#5865F2]/90 text-white">
                    Unirse al Discord
                  </Button>
                </div>
              </div>
            </div>

            {/* Server Status */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Estado del Servidor
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Canal 1</span>
                  <span className="text-sm font-medium text-green-500">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Canal 2</span>
                  <span className="text-sm font-medium text-green-500">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Canal 3</span>
                  <span className="text-sm font-medium text-green-500">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Canal PvP</span>
                  <span className="text-sm font-medium text-yellow-500">Alto tráfico</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
