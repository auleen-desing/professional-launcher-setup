import { Link } from 'react-router-dom';
import { 
  Coins, 
  Ticket, 
  Calendar, 
  Dices, 
  MessageSquare, 
  ShoppingCart, 
  TrendingUp,
  Gift,
  Users,
  Trophy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ServerStatus } from '@/components/ServerStatus';
import { ServerRates } from '@/components/ServerRates';

const features = [
  { name: 'My Characters', href: '/dashboard/characters', icon: Users, description: 'View your characters', color: 'from-indigo-500 to-purple-500' },
  { name: 'Rankings', href: '/dashboard/rankings', icon: Trophy, description: 'Top players', color: 'from-yellow-500 to-amber-500' },
  { name: 'Buy NovaCoins', href: '/dashboard/buy-coins', icon: Coins, description: 'Stripe, PayPal, Paysafecard', color: 'from-cyan-500 to-blue-500' },
  { name: 'Coupon', href: '/dashboard/coupon', icon: Ticket, description: 'Redeem codes', color: 'from-purple-500 to-pink-500' },
  { name: 'Roulette', href: '/dashboard/roulette', icon: Dices, description: 'Try your luck', color: 'from-orange-500 to-red-500' },
  { name: 'Tickets', href: '/dashboard/tickets', icon: MessageSquare, description: 'Technical support', color: 'from-blue-500 to-indigo-500' },
  { name: 'Shop', href: '/dashboard/shop', icon: ShoppingCart, description: 'Item shop', color: 'from-amber-500 to-orange-500' },
];

const quickStats = [
  { label: 'Purchases this month', value: '3', icon: ShoppingCart },
  { label: 'Open tickets', value: '1', icon: MessageSquare },
  { label: 'Consecutive days', value: '7', icon: Calendar },
];

export function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome & Coins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Coins Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-accent/20 border border-primary/30 p-8">
          <div className="relative z-10">
            <p className="text-muted-foreground mb-1">Welcome back,</p>
            <h1 className="text-3xl font-display font-bold text-foreground mb-6">{user?.username}</h1>
            
            <div className="flex items-end gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your NovaCoins</p>
                <p className="text-5xl sm:text-6xl font-display font-black text-gradient-cyan">
                  {(user?.coins ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 text-neon-green mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">+500 this week</span>
              </div>
            </div>
          </div>
          
          {/* Decorative */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <Coins className="absolute right-8 bottom-8 h-24 w-24 text-primary/20" />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          {quickStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="p-3 rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Banner */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30">
        <div className="flex items-center gap-3">
          <Gift className="h-6 w-6 text-accent" />
          <div>
            <p className="font-medium text-foreground">Claim your daily reward!</p>
            <p className="text-sm text-muted-foreground">Today you can earn up to 150 NovaCoins</p>
          </div>
        </div>
        <Link to="/dashboard/daily" className="ml-auto">
          <button className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors">
            Claim
          </button>
        </Link>
      </div>

      {/* Feature Grid */}
      <div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.href}
              className="group relative overflow-hidden rounded-xl bg-card border border-border/50 p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </div>
              
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      {/* Server Status */}
      <div className="grid md:grid-cols-2 gap-6">
        <ServerStatus />
        <ServerRates />
      </div>
    </div>
  );
}
