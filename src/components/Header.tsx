import { useState } from 'react';
import { Menu, X, Download, Users, Newspaper, ShoppingBag, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import novaLogo from '@/assets/novaera-logo.png';

const navItems = [
  { name: 'Inicio', href: '#', icon: null },
  { name: 'Descargar', href: '#download', icon: Download },
  { name: 'Comunidad', href: '#community', icon: Users },
  { name: 'Noticias', href: '#news', icon: Newspaper },
  { name: 'Tienda', href: '#shop', icon: ShoppingBag },
  { name: 'Discord', href: '#discord', icon: MessageSquare },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={novaLogo} alt="NovaEra" className="h-10 md:h-14 w-auto" />
            <span className="font-bold text-xl md:text-2xl text-gradient-gold font-['Orbitron']">
              NOVAERA
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold font-semibold">
              <Download className="w-4 h-4 mr-2" />
              Jugar Ahora
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-secondary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon && <item.icon className="w-5 h-5 text-primary" />}
                  {item.name}
                </a>
              ))}
              <Button className="mt-4 bg-primary text-primary-foreground">
                <Download className="w-4 h-4 mr-2" />
                Jugar Ahora
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
