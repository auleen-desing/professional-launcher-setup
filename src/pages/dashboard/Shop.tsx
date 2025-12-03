import { useState } from 'react';
import { ShoppingCart, Sparkles, Shield, Sword, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ElementType;
  category: 'weapon' | 'armor' | 'consumable' | 'special';
  discount?: number;
}

const shopItems: ShopItem[] = [
  { id: '1', name: 'Espada Legendaria', description: '+50 ATK', price: 5000, icon: Sword, category: 'weapon' },
  { id: '2', name: 'Armadura Divina', description: '+100 DEF', price: 7500, icon: Shield, category: 'armor', discount: 20 },
  { id: '3', name: 'Elixir de Poder', description: '+20% DMG por 1h', price: 500, icon: Sparkles, category: 'consumable' },
  { id: '4', name: 'Corona Real', description: 'Cosmético exclusivo', price: 10000, icon: Crown, category: 'special' },
  { id: '5', name: 'Daga Sombría', description: '+30 ATK, +10 CRIT', price: 3500, icon: Sword, category: 'weapon' },
  { id: '6', name: 'Escudo del Dragón', description: '+80 DEF, +Fire Resist', price: 6000, icon: Shield, category: 'armor' },
];

const categoryLabels = {
  weapon: { label: 'Arma', color: 'bg-red-500' },
  armor: { label: 'Armadura', color: 'bg-blue-500' },
  consumable: { label: 'Consumible', color: 'bg-green-500' },
  special: { label: 'Especial', color: 'bg-purple-500' },
};

export function Shop() {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, updateCoins } = useAuth();

  const handlePurchase = async (item: ShopItem) => {
    const finalPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;

    if ((user?.coins || 0) < finalPrice) {
      toast({
        title: 'Coins insuficientes',
        description: `Necesitas ${finalPrice.toLocaleString()} coins para comprar este item.`,
        variant: 'destructive',
      });
      return;
    }

    setPurchasing(item.id);

    try {
      // TODO: Replace with your API endpoint
      // const response = await fetch('http://localhost:3000/api/shop/purchase', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ itemId: item.id }),
      // });

      await new Promise(resolve => setTimeout(resolve, 1000));

      updateCoins((user?.coins || 0) - finalPrice);

      toast({
        title: '¡Compra exitosa!',
        description: `Has comprado ${item.name}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar la compra.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Tienda</h1>
        <p className="text-muted-foreground mt-2">Compra items con tus coins</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shopItems.map((item) => {
          const category = categoryLabels[item.category];
          const finalPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;

          return (
            <Card key={item.id} className="hover:border-primary/50 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`${category.color} text-white`}>
                      {category.label}
                    </Badge>
                    {item.discount && (
                      <Badge variant="destructive">-{item.discount}%</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="mt-3">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    {item.discount && (
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
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {purchasing === item.id ? 'Comprando...' : 'Comprar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
