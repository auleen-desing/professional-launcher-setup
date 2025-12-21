import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Coins, 
  Ticket, 
  Calendar, 
  Dices, 
  MessageSquare, 
  Bug, 
  User, 
  ShoppingCart, 
  Lock,
  Menu,
  X,
  LogOut,
  Home,
  RefreshCw,
  ChevronRight,
  Gamepad2,
  Users,
  Trophy,
  Shield,
  Crown,
  Gift,
  History,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import novaLogo from '@/assets/novaera-logo.png';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Characters', href: '/dashboard/characters', icon: Users },
  { name: 'Rankings', href: '/dashboard/rankings', icon: Trophy },
  { name: 'Buy NovaCoins', href: '/dashboard/buy-coins', icon: Coins },
  { name: 'Pending Coins', href: '/dashboard/pending', icon: Clock },
  { name: 'Send Gift', href: '/dashboard/gifts', icon: Gift },
  { name: 'Transactions', href: '/dashboard/transactions', icon: History },
  { name: 'Coupon', href: '/dashboard/coupon', icon: Ticket },
  { name: 'Daily Reward', href: '/dashboard/daily', icon: Calendar },
  { name: 'Title Shop', href: '/dashboard/titles', icon: Crown },
  { name: 'Roulette', href: '/dashboard/roulette', icon: Dices },
  { name: 'Shop', href: '/dashboard/shop', icon: ShoppingCart },
  { name: 'Tickets', href: '/dashboard/tickets', icon: MessageSquare },
  { name: 'Unbug', href: '/dashboard/unbug', icon: Bug },
  { name: 'Avatar', href: '/dashboard/avatar', icon: User },
  { name: 'Password', href: '/dashboard/password', icon: Lock },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            <Link to="/" className="flex items-center gap-2">
              <img src={novaLogo} alt="NovaEra" className="h-8 w-auto" />
              <span className="text-xl font-display font-bold text-gradient-cyan hidden sm:block">NOVAERA</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2 text-sm text-primary">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            {/* Coins Display */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-lg px-4 py-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-display font-bold text-primary">{user?.coins.toLocaleString()}</span>
            </div>
            
            {/* User */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground">User</p>
              </div>
            </div>
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
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-gradient-to-r from-primary/20 to-accent/10 text-primary border border-primary/30" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive && "text-primary"
                  )} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}
          </div>
          
          <div className="pt-4 border-t border-border/50 space-y-2">
            {isAdmin && (
              <Button variant="outline" className="w-full gap-2 justify-start border-primary/30 text-primary hover:bg-primary/10" asChild>
                <Link to="/admin">
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Link>
              </Button>
            )}
            <Button variant="outline" className="w-full gap-2 justify-start" asChild>
              <a href="#">
                <Gamepad2 className="h-4 w-4" />
                Play Now
              </a>
            </Button>
            <button
              onClick={handleLogout}
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
