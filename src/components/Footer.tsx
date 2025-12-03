import { MessageSquare, Youtube, Instagram, Twitter } from 'lucide-react';
import novaLogo from '@/assets/novaera-logo.png';

const footerLinks = {
  game: [
    { name: 'Download', href: '#download' },
    { name: 'Guides', href: '#' },
    { name: 'Wiki', href: '#' },
    { name: 'Rankings', href: '#' },
  ],
  community: [
    { name: 'Discord', href: '#' },
    { name: 'Forum', href: '#' },
    { name: 'Events', href: '#' },
    { name: 'News', href: '#news' },
  ],
  support: [
    { name: 'Help Centre', href: '#' },
    { name: 'Report Bug', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'FAQ', href: '#' },
  ],
  legal: [
    { name: 'Terms of Use', href: '#' },
    { name: 'Privacy', href: '#' },
    { name: 'Game Rules', href: '#' },
    { name: 'DMCA', href: '#' },
  ],
};

const socialLinks = [
  { icon: MessageSquare, href: '#', label: 'Discord' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
];

export function Footer() {
  return (
    <footer className="bg-card/80 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={novaLogo} alt="NovaEra" className="h-10 w-auto" />
              <span className="font-bold text-xl text-gradient-gold font-['Orbitron']">NOVAERA</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              The ultimate NosTale private server. Join thousands of players in the most epic adventure.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">Game</h4>
            <ul className="space-y-2">
              {footerLinks.game.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 NovaEra. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              NovaEra is not affiliated with Entwell Co., Ltd.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
