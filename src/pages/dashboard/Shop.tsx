import { useState, useEffect } from 'react';
import { ShoppingCart, Sparkles, Shield, Sword, Crown, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  itemVNum: number;
  quantity: number;
  category: string;
  discount?: number;
}

const categoryIcons: Record<string, any> = {
  weapon: Sword,
  armor: Shield,
  consumable: Sparkles,
  special: Crown,
  default: Package,
};

const categoryColors: Record<string, string> = {
  weapon: 'bg-red-500',
  armor: 'bg-blue-500',
  consumable: 'bg-green-500',
  special: 'bg-purple-500',
  default: 'bg-gray-500',
};

export function Shop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const { toast } = useToast();
  const { user, updateCoins, refreshUser } = useAuth();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SHOP.ITEMS));
      const data = await response.json();
      
      if (data.success) {
        setItems(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load shop items',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Shop error:', error);
      toast({
        title: 'Error',
        description: 'Could not connect to server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    const finalPrice = item.discount ? Math.floor(item.price * (1 - item.discount / 100)) : item.price;

    if ((user?.coins || 0) < finalPrice) {
      toast({
        title: 'Insufficient coins',
        description: `You need ${finalPrice.toLocaleString()} coins to buy this item.`,
        variant: 'destructive',
      });
      return;
    }

    setPurchasing(item.id);

    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SHOP.PURCHASE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: item.id }),
      });

      const data = await response.json();

      if (data.success) {
        updateCoins(data.data.newBalance);
        toast({
          title: 'Purchase successful!',
          description: `You bought ${item.name}. Check your in-game mail!`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Could not complete the purchase.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not connect to server',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Shop</h1>
          <p className="text-muted-foreground mt-2">Buy items with your coins</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Shop</h1>
        <p className="text-muted-foreground mt-2">Buy items with your coins</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No items available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const IconComponent = categoryIcons[item.category] || categoryIcons.default;
            const categoryColor = categoryColors[item.category] || categoryColors.default;
            const finalPrice = item.discount ? Math.floor(item.price * (1 - item.discount / 100)) : item.price;

            return (
              <Card key={item.id} className="hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <img 
                        src={`/items/${item.itemVNum}.png`} 
                        alt={item.name}
                        className="h-12 w-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <IconComponent className="h-8 w-8 text-primary hidden" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${categoryColor} text-white`}>
                        {item.category}
                      </Badge>
                      {item.discount && item.discount > 0 && (
                        <Badge variant="destructive">-{item.discount}%</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-3">{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">Quantity: x{item.quantity}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      {item.discount && item.discount > 0 && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                          {item.price.toLocaleString()}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-primary">
                        {finalPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">coins</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handlePurchase(item)}
                      disabled={purchasing === item.id}
                    >
                      {purchasing === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Buy
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
