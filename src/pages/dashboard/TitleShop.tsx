import { useState, useEffect } from 'react';
import { Crown, Sparkles, Star, Shield, Flame, Zap, Heart, Skull, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/config/api';

interface Title {
  id: number;
  name: string;
  displayName: string;
  description: string;
  price: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  color: string;
  owned?: boolean;
  equipped?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  crown: Crown,
  sparkles: Sparkles,
  star: Star,
  shield: Shield,
  flame: Flame,
  zap: Zap,
  heart: Heart,
  skull: Skull,
};

const rarityColors: Record<string, string> = {
  common: 'text-muted-foreground border-muted-foreground/30 bg-muted/20',
  uncommon: 'text-green-400 border-green-400/30 bg-green-400/10',
  rare: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  epic: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  legendary: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
};

const rarityGlow: Record<string, string> = {
  common: '',
  uncommon: 'shadow-green-400/20',
  rare: 'shadow-blue-400/20',
  epic: 'shadow-purple-400/20',
  legendary: 'shadow-yellow-400/30 shadow-lg',
};

// Mock titles for display - will be replaced with API data
const mockTitles: Title[] = [
  { id: 1, name: 'novice', displayName: 'Novice', description: 'A beginner adventurer', price: 100, rarity: 'common', icon: 'star', color: '#9ca3af' },
  { id: 2, name: 'warrior', displayName: 'Warrior', description: 'Battle-hardened fighter', price: 500, rarity: 'uncommon', icon: 'shield', color: '#4ade80' },
  { id: 3, name: 'champion', displayName: 'Champion', description: 'Victor of many battles', price: 1500, rarity: 'rare', icon: 'crown', color: '#60a5fa' },
  { id: 4, name: 'legend', displayName: 'Legend', description: 'Stories are told about you', price: 5000, rarity: 'epic', icon: 'sparkles', color: '#c084fc' },
  { id: 5, name: 'immortal', displayName: 'Immortal', description: 'Beyond life and death', price: 15000, rarity: 'legendary', icon: 'flame', color: '#facc15' },
  { id: 6, name: 'destroyer', displayName: 'Destroyer', description: 'Leave nothing standing', price: 3000, rarity: 'rare', icon: 'skull', color: '#f87171' },
  { id: 7, name: 'beloved', displayName: 'Beloved', description: 'Loved by all', price: 2000, rarity: 'uncommon', icon: 'heart', color: '#fb7185' },
  { id: 8, name: 'lightning', displayName: 'Lightning', description: 'Fast as thunder', price: 8000, rarity: 'epic', icon: 'zap', color: '#fbbf24' },
];

export function TitleShop() {
  const [titles, setTitles] = useState<Title[]>(mockTitles);
  const [isLoading, setIsLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [equippingId, setEquippingId] = useState<number | null>(null);
  const { toast } = useToast();
  const { user, updateCoins } = useAuth();

  const fetchTitles = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/titles'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setTitles(data.data);
      }
    } catch (error) {
      console.error('Error fetching titles:', error);
      // Keep mock data on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, []);

  const handlePurchase = async (title: Title) => {
    if (!user || user.coins < title.price) {
      toast({
        title: 'Insufficient Coins',
        description: `You need ${title.price - (user?.coins || 0)} more coins to purchase this title.`,
        variant: 'destructive',
      });
      return;
    }

    setPurchasingId(title.id);
    
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/titles/purchase'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ titleId: title.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        updateCoins(data.data.newBalance);
        setTitles(prev => prev.map(t => 
          t.id === title.id ? { ...t, owned: true } : t
        ));
        
        toast({
          title: 'Title Purchased!',
          description: `You now own the "${title.displayName}" title!`,
        });
      } else {
        throw new Error(data.error || 'Purchase failed');
      }
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Could not complete purchase',
        variant: 'destructive',
      });
    } finally {
      setPurchasingId(null);
    }
  };

  const handleEquip = async (title: Title) => {
    setEquippingId(title.id);
    
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/titles/equip'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ titleId: title.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTitles(prev => prev.map(t => ({
          ...t,
          equipped: t.id === title.id
        })));
        
        toast({
          title: 'Title Equipped!',
          description: `You are now known as "${title.displayName}"`,
        });
      } else {
        throw new Error(data.error || 'Equip failed');
      }
    } catch (error: any) {
      toast({
        title: 'Equip Failed',
        description: error.message || 'Could not equip title',
        variant: 'destructive',
      });
    } finally {
      setEquippingId(null);
    }
  };

  if (isLoading && titles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Title Shop</h1>
        <p className="text-muted-foreground mt-2">Purchase exclusive titles to show off your status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Titles Owned</p>
                <p className="text-2xl font-bold">{titles.filter(t => t.owned).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Titles</p>
                <p className="text-2xl font-bold">{titles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Star className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currently Equipped</p>
                <p className="text-2xl font-bold">{titles.find(t => t.equipped)?.displayName || 'None'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Titles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {titles.map((title) => {
          const IconComponent = iconMap[title.icon] || Star;
          const isProcessing = purchasingId === title.id || equippingId === title.id;
          
          return (
            <Card 
              key={title.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${rarityGlow[title.rarity]} ${title.equipped ? 'ring-2 ring-primary' : ''}`}
            >
              {title.equipped && (
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    <Check className="h-3 w-3 mr-1" />
                    Equipped
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className={`p-3 rounded-xl border ${rarityColors[title.rarity]}`}
                    style={{ borderColor: `${title.color}40` }}
                  >
                    <IconComponent className="h-6 w-6" style={{ color: title.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg" style={{ color: title.color }}>
                      {title.displayName}
                    </CardTitle>
                    <Badge variant="outline" className={`text-xs capitalize ${rarityColors[title.rarity]}`}>
                      {title.rarity}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription>{title.description}</CardDescription>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-primary font-bold">
                    <span>{title.price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">coins</span>
                  </div>
                  
                  {title.owned ? (
                    <Button
                      size="sm"
                      variant={title.equipped ? "secondary" : "outline"}
                      onClick={() => handleEquip(title)}
                      disabled={isProcessing || title.equipped}
                    >
                      {equippingId === title.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : title.equipped ? (
                        'Equipped'
                      ) : (
                        'Equip'
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(title)}
                      disabled={isProcessing || (user?.coins || 0) < title.price}
                    >
                      {purchasingId === title.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Buy'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
