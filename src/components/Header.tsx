import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Download, Users, Newspaper, ShoppingBag, MessageSquare, LayoutDashboard, Home, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import novaLogo from '@/assets/novaera-logo.png';

const navItems = [
  { name: 'Inicio', href: '#', icon: Home },
  { name: 'Descargar', href: '#download', icon: Download },
  { name: 'Comunidad', href: '#community', icon: Users },
  { name: 'Noticias', href: '#news', icon: Newspaper },
  { name: 'Tienda', href: '#shop', icon: ShoppingBag },
  { name: 'Discord', href: 'https://discord.gg/', icon: MessageSquare },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src={novaLogo} alt="NovaEra" className="h-10 md:h-12 w-auto relative z-10" />
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl md:text-2xl text-gradient-cyan hidden sm:block">
              NOVAERA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 rounded-lg hover:bg-primary/5"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Button className="gap-2 glow-cyan">
              <Gamepad2 className="w-4 h-4" />
              Jugar Ahora
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  {item.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button className="w-full gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  Jugar Ahora
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
