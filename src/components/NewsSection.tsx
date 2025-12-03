import { Clock, MessageSquare, ArrowRight, Flame, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const newsItems = [
  {
    id: 1,
    title: 'Welcome to NovaEra!',
    excerpt: 'Your new adventure begins here. Check out all the features and start your journey...',
    date: '3 Dec 2025',
    comments: 0,
    category: 'Announcement',
    hot: true,
  },
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
                Latest News
              </h2>
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                View all <ArrowRight className="w-4 h-4 ml-2" />
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
                          {news.comments} comments
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
            {/* Hot Topics - Empty */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-transparent p-4 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  Hot Topics
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground text-center py-4">
                  No topics yet
                </p>
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
                  <div className="text-sm text-muted-foreground mb-4">members online</div>
                  <Button className="w-full bg-[#5865F2] hover:bg-[#5865F2]/90 text-white">
                    Join Discord
                  </Button>
                </div>
              </div>
            </div>

            {/* EPVP Link */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500/20 to-transparent p-4 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-orange-500" />
                  EPVP
                </h3>
              </div>
              <div className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Check our official thread</p>
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-500/90 text-white"
                    asChild
                  >
                    <a 
                      href="https://www.elitepvpers.com/forum/nostale-pserver-advertising/5331213-novaera-international-pserver-release.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Visit EPVP Thread
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Server Status */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Server Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Channel 1</span>
                  <span className="text-sm font-medium text-green-500">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Channel 2</span>
                  <span className="text-sm font-medium text-green-500">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Channel 3</span>
                  <span className="text-sm font-medium text-green-500">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">PvP Channel</span>
                  <span className="text-sm font-medium text-yellow-500">High traffic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
