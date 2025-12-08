import { useState } from 'react';
import { Youtube, FileText, HelpCircle, ShoppingCart, MessageCircle, Download, User, Settings, ChevronLeft, ChevronRight, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import launcherBg from '@/assets/launcher-bg.jpg';
import logoImg from '@/assets/novaera-logo.png';

const menuItems = [
  { icon: Youtube, label: 'DISCOVER NOVAERA', href: '#', isYoutube: true },
  { icon: FileText, label: 'Read Game Rules', href: '#' },
  { icon: HelpCircle, label: 'Contact Support', href: '/dashboard/tickets' },
  { icon: ShoppingCart, label: 'Browse our shop', href: '/dashboard/shop' },
  { icon: MessageCircle, label: 'Join us on Discord!', href: '#' },
];

const newsItems = [
  { title: 'PATCH NOTES', subtitle: 'NOVAERA', date: 'Patch Note - 2025-05-19', type: 'patch' },
  { title: 'PATCH NOTES', subtitle: 'NOVAERA', date: 'Patch Note - 2025-05-11', type: 'patch' },
  { title: 'Shop Rotation', subtitle: 'NOVAERA', date: 'Shop Rotation - 11/05/2025', type: 'shop', highlighted: true },
  { title: 'PATCH NOTES', subtitle: 'NOVAERA', date: 'Patch Note - 2025-04-27', type: 'patch' },
  { title: 'SPRING EVENT', subtitle: 'NOVAERA', date: 'Spring Event - 2025-04-20', type: 'event' },
];

export default function Launcher() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const username = 'Player';

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, newsItems.length - 4));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.max(1, newsItems.length - 4)) % Math.max(1, newsItems.length - 4));
  };

  return (
    <div 
      className="h-screen w-screen flex flex-col overflow-hidden select-none"
      style={{
        backgroundImage: `url(${launcherBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-primary/30">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NovaEra" className="h-8 w-8" />
          <span className="text-primary font-bold text-xl tracking-wider">NOVAERA</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="text-foreground font-medium">{username}</span>
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
              <Minus className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Left Sidebar */}
        <div className="absolute left-0 top-0 bottom-0 w-72 p-6 flex flex-col gap-2 z-10">
          <h1 className="text-3xl font-display italic text-foreground mb-6">Novaera</h1>
          
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                item.isYoutube 
                  ? 'bg-red-600 hover:bg-red-700 text-white font-semibold' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </a>
          ))}
        </div>

        {/* News Carousel */}
        <div className="absolute bottom-24 left-0 right-0 px-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors border border-white/10"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex-1 flex gap-3 overflow-hidden">
              {newsItems.slice(currentSlide, currentSlide + 5).map((news, index) => (
                <div
                  key={index}
                  className={`flex-1 min-w-0 p-4 rounded-lg border transition-all cursor-pointer ${
                    news.highlighted 
                      ? 'bg-black/40 border-primary/50 hover:border-primary' 
                      : 'bg-black/30 border-white/10 hover:border-white/30'
                  }`}
                >
                  <h3 className={`font-bold text-sm mb-1 ${
                    news.highlighted || news.type === 'event' ? 'text-primary' : 'text-foreground'
                  }`}>
                    {news.title}
                  </h3>
                  <p className="text-primary/70 text-xs mb-2">{news.subtitle}</p>
                  <p className="text-muted-foreground text-xs">{news.date}</p>
                </div>
              ))}
            </div>
            
            <button 
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors border border-white/10"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <footer className="flex items-center justify-between px-6 py-3 bg-black/90 backdrop-blur-sm border-t border-primary/30">
        <a href="/NovaeraUP.exe" download="NovaeraUP.exe" className="text-muted-foreground text-sm hover:text-foreground transition-colors cursor-pointer">Click to download</a>
        
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10">
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 text-black font-bold px-8 gap-2"
            asChild
          >
            <a href="/NovaeraUP.exe" download="NovaeraUP.exe">
              <Download className="w-5 h-5" />
              DOWNLOAD
            </a>
          </Button>
        </div>
      </footer>
    </div>
  );
}
