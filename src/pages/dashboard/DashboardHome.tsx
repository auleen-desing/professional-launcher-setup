import { Link } from 'react-router-dom';
import { 
  Coins, 
  Ticket, 
  Calendar, 
  Dices, 
  MessageSquare, 
  Bug, 
  User, 
  ShoppingCart, 
  Lock 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  { name: 'Comprar Coins', href: '/dashboard/buy-coins', icon: Coins, description: 'Adquiere coins para el juego' },
  { name: 'Cupón', href: '/dashboard/coupon', icon: Ticket, description: 'Canjea códigos promocionales' },
  { name: 'Diaria', href: '/dashboard/daily', icon: Calendar, description: 'Reclama tu recompensa diaria' },
  { name: 'Ruleta', href: '/dashboard/roulette', icon: Dices, description: 'Prueba tu suerte' },
  { name: 'Tickets', href: '/dashboard/tickets', icon: MessageSquare, description: 'Soporte técnico' },
  { name: 'Unbug', href: '/dashboard/unbug', icon: Bug, description: 'Desbuguea tu personaje' },
  { name: 'Avatar', href: '/dashboard/avatar', icon: User, description: 'Personaliza tu avatar' },
  { name: 'Shop', href: '/dashboard/shop', icon: ShoppingCart, description: 'Tienda de items' },
  { name: 'Password', href: '/dashboard/password', icon: Lock, description: 'Cambia tu contraseña' },
];

export function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Coins Display */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-2xl p-6 text-center">
        <span className="text-muted-foreground text-lg">Coins</span>
        <p className="text-5xl font-bold text-primary mt-2">{user?.coins.toLocaleString()}</p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Link
            key={feature.name}
            to={feature.href}
            className="group bg-card hover:bg-card/80 border border-border hover:border-primary/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex flex-col items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{feature.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
