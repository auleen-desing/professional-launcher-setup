import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Coins, 
  Megaphone, 
  Shield, 
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  ChevronRight,
  Bell,
  Search,
  BarChart3,
  Ticket,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import novaLogo from '@/assets/novaera-logo.png';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'IP Ban', href: '/admin/ipban', icon: Globe },
  { name: 'NovaCoins', href: '/admin/coins', icon: Coins },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Moderation', href: '/admin/moderation', icon: Shield, badge: 3 },
  { name: 'Statistics', href: '/admin/stats', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/50 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/admin" className="flex items-center gap-2">
              <img src={novaLogo} alt="NovaEra" className="h-8 w-auto" />
              <div className="hidden sm:block">
                <span className="text-lg font-display font-bold text-gradient-cyan">NOVAERA</span>
                <span className="text-xs text-destructive font-bold ml-2 px-2 py-0.5 bg-destructive/20 rounded">ADMIN</span>
              </div>
            </Link>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users, IPs..." 
                className="pl-10 bg-background/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Go to site</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-16 left-0 bottom-0 w-64 bg-card/95 backdrop-blur-xl border-r border-border/50 z-40 transform transition-transform duration-300 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <nav className="p-4 space-y-1 h-full flex flex-col">
          <div className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive border border-destructive/30" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive && "text-destructive"
                  )} />
                  <span className="font-medium flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </Link>
              );
            })}
          </div>
          
          <div className="pt-4 border-t border-border/50">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <Users className="h-5 w-5" />
              User Panel
            </Link>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 w-full transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
