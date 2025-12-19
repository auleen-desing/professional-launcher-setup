import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/config/api';
import { 
  History, RefreshCw, ArrowUpRight, ArrowDownLeft, Gift, 
  ShoppingCart, Ticket, Dices, Calendar, ChevronLeft, ChevronRight,
  CreditCard, Coins
} from 'lucide-react';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  referenceId?: string;
  targetUsername?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  purchase: { label: 'Purchase', icon: CreditCard, color: 'text-green-400' },
  gift_sent: { label: 'Gift Sent', icon: Gift, color: 'text-red-400' },
  gift_received: { label: 'Gift Received', icon: Gift, color: 'text-green-400' },
  coupon: { label: 'Coupon', icon: Ticket, color: 'text-blue-400' },
  daily_reward: { label: 'Daily Reward', icon: Calendar, color: 'text-yellow-400' },
  roulette: { label: 'Roulette', icon: Dices, color: 'text-purple-400' },
  shop_purchase: { label: 'Shop Purchase', icon: ShoppingCart, color: 'text-orange-400' },
  admin_add: { label: 'Admin Add', icon: Coins, color: 'text-cyan-400' },
  admin_remove: { label: 'Admin Remove', icon: Coins, color: 'text-red-400' },
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('novaera_token');
      const url = buildApiUrl(`/transactions?page=${page}&limit=15&type=${filter}`);
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Transactions error:', error);
      toast({ title: 'Error', description: 'Failed to load transactions', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [filter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Transaction History
          </h1>
          <p className="text-muted-foreground">View your coin transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchTransactions(pagination?.page || 1)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
                <SelectItem value="gift_sent">Gifts Sent</SelectItem>
                <SelectItem value="gift_received">Gifts Received</SelectItem>
                <SelectItem value="coupon">Coupons</SelectItem>
                <SelectItem value="daily_reward">Daily Rewards</SelectItem>
                <SelectItem value="roulette">Roulette</SelectItem>
                <SelectItem value="shop_purchase">Shop Purchases</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const config = typeConfig[tx.type] || { label: tx.type, icon: Coins, color: 'text-muted-foreground' };
                const Icon = config.icon;
                const isPositive = tx.amount > 0;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-background border border-border/50 ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          {tx.targetUsername && (
                            <span className="text-sm text-muted-foreground">
                              {tx.type === 'gift_sent' ? `to ${tx.targetUsername}` : `from ${tx.targetUsername}`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{tx.description}</p>
                        <p className="text-xs text-muted-foreground/70">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 font-bold text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                      {isPositive ? '+' : ''}{tx.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTransactions(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTransactions(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
