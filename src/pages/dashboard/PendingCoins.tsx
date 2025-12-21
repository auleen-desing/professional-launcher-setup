import { useState, useEffect } from 'react';
import { Clock, Coins, Gift, Ticket, Dices, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';

interface PendingCoin {
  id: number;
  amount: number;
  source: string;
  detail: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface PendingData {
  total: number;
  count: number;
  items: PendingCoin[];
}

const sourceIcons: Record<string, React.ElementType> = {
  coupon: Ticket,
  admin: Gift,
  donation: CreditCard,
  roulette: Dices,
  refund: Coins,
};

const sourceColors: Record<string, string> = {
  coupon: 'bg-green-500/20 text-green-400 border-green-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  donation: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  roulette: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  refund: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const sourceLabels: Record<string, string> = {
  coupon: 'Coupon',
  admin: 'Admin Gift',
  donation: 'Donation',
  roulette: 'Roulette',
  refund: 'Refund',
};

export function PendingCoins() {
  const { user } = useAuth();
  const [data, setData] = useState<PendingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingCoins();
  }, []);

  const fetchPendingCoins = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/pending/coins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending coins');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending coins');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient-cyan">Pending Coins</h1>
          <p className="text-muted-foreground mt-1">View your pending coin rewards</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient-cyan">Pending Coins</h1>
        <p className="text-muted-foreground mt-1">
          Coins waiting to be credited when you log into the game
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-primary/20 border border-primary/30">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-4xl font-display font-bold text-primary">
                  {data?.total.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {(user?.coins ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          
          {data && data.total > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                These coins will be automatically added when you log into the game
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Pending Transactions
          </CardTitle>
          <CardDescription>
            {data?.count || 0} pending reward{data?.count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : !data?.items || data.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No pending coins</p>
              <p className="text-sm mt-1">All your rewards have been claimed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((item) => {
                const IconComponent = sourceIcons[item.source] || Coins;
                const colorClass = sourceColors[item.source] || 'bg-muted text-muted-foreground';
                const label = sourceLabels[item.source] || item.source;
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${colorClass.split(' ')[0]}`}>
                        <IconComponent className={`h-5 w-5 ${colorClass.split(' ')[1]}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={colorClass}>
                            {label}
                          </Badge>
                          {item.detail && (
                            <span className="text-sm text-muted-foreground">{item.detail}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(item.createdAt)}
                          {item.expiresAt && (
                            <span className="ml-2 text-destructive">
                              Expires: {formatDate(item.expiresAt)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display font-bold text-primary">
                        +{item.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">coins</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="p-2 rounded-lg bg-blue-500/20 h-fit">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">How Pending Coins Work</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Coins from coupons, donations, and rewards are added to pending</li>
                <li>• When you log into the game, pending coins are automatically credited</li>
                <li>• This prevents coin loss from server sync issues</li>
                <li>• If you're already in-game, you may need to relog to receive them</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
