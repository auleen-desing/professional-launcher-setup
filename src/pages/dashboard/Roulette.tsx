import { useState, useEffect } from 'react';
import { Dices, Coins, Gift, Sparkles, Package, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface Prize {
  id: number;
  name: string;
  type: 'coins' | 'item';
  value: number;
  chance: number;
  color?: string;
}

export function Roulette() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [spinCost, setSpinCost] = useState(500);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<Prize | null>(null);
  const { toast } = useToast();
  const { updateCoins, user } = useAuth();

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ROULETTE.PRIZES));
      const data = await response.json();
      
      if (data.success) {
        setPrizes(data.data.prizes);
        setSpinCost(data.data.spinCost);
      }
    } catch (error) {
      console.error('Failed to fetch prizes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpin = async () => {
    if ((user?.coins || 0) < spinCost) {
      toast({
        title: 'Insufficient Coins',
        description: `You need ${spinCost.toLocaleString()} coins to spin.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSpinning(true);
    setResult(null);
    setSelectedIndex(null);

    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ROULETTE.SPIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const wonPrize = data.data.prize;
        const prizeIndex = prizes.findIndex(p => p.id === wonPrize.id);
        
        // Animate through prizes
        let currentIndex = 0;
        const totalSpins = 20 + prizeIndex; // Spin through items multiple times
        const spinInterval = setInterval(() => {
          setSelectedIndex(currentIndex % prizes.length);
          currentIndex++;
          
          if (currentIndex >= totalSpins) {
            clearInterval(spinInterval);
            setSelectedIndex(prizeIndex);
            setIsSpinning(false);
            setResult(wonPrize);
            updateCoins(data.data.newBalance);

            toast({
              title: '🎉 Congratulations!',
              description: wonPrize.type === 'item' 
                ? `You won ${wonPrize.name}! Check your in-game mail.`
                : `You won ${wonPrize.value.toLocaleString()} coins!`,
            });
          }
        }, 100 + (currentIndex * 5)); // Slow down gradually

      } else {
        setIsSpinning(false);
        toast({
          title: 'Error',
          description: data.error || 'Could not spin the roulette',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setIsSpinning(false);
      toast({
        title: 'Error',
        description: 'Could not connect to server',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Lucky Roulette</h1>
          <p className="text-muted-foreground mt-2">Try your luck and win prizes</p>
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Lucky Roulette</h1>
        <p className="text-muted-foreground mt-2">Try your luck and win amazing prizes</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Prizes Grid */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Available Prizes
            </CardTitle>
            <CardDescription>
              Cost per spin: <span className="text-primary font-bold">{spinCost.toLocaleString()} coins</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {prizes.map((prize, index) => (
                <div 
                  key={prize.id}
                  className={`
                    relative p-4 rounded-xl border-2 text-center transition-all duration-200
                    ${selectedIndex === index 
                      ? 'border-primary bg-primary/20 scale-105 shadow-lg shadow-primary/30' 
                      : 'border-border bg-card hover:border-primary/50'
                    }
                    ${result?.id === prize.id && !isSpinning
                      ? 'ring-4 ring-primary ring-offset-2 ring-offset-background animate-pulse'
                      : ''
                    }
                  `}
                >
                  {/* Prize Icon */}
                  <div className={`
                    w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center
                    ${prize.type === 'coins' ? 'bg-yellow-500/20' : 'bg-purple-500/20'}
                  `}>
                    {prize.type === 'coins' ? (
                      <Coins className="h-6 w-6 text-yellow-500" />
                    ) : (
                      <Package className="h-6 w-6 text-purple-500" />
                    )}
                  </div>
                  
                  {/* Prize Name */}
                  <p className="font-semibold text-sm mb-1 line-clamp-2">{prize.name}</p>
                  
                  {/* Chance */}
                  <p className="text-xs text-muted-foreground">{prize.chance}% prob.</p>
                  
                  {/* Winner Badge */}
                  {result?.id === prize.id && !isSpinning && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-bold">
                      WINNER!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spin Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dices className="h-5 w-5 text-primary" />
              Spin Roulette
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Balance */}
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Your balance</p>
              <p className="text-2xl font-bold text-primary">
                {(user?.coins || 0).toLocaleString()} <span className="text-sm">coins</span>
              </p>
            </div>

            {/* Spin Cost */}
            <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Cost per spin</p>
              <p className="text-xl font-bold">{spinCost.toLocaleString()} coins</p>
            </div>

            {/* Spin Button */}
            <Button 
              onClick={handleSpin} 
              size="lg" 
              className="w-full gap-2 h-14 text-lg"
              disabled={isSpinning || (user?.coins || 0) < spinCost}
            >
              {isSpinning ? (
                <>
                  <RotateCcw className="h-5 w-5 animate-spin" />
                  Spinning...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Spin!
                </>
              )}
            </Button>

            {(user?.coins || 0) < spinCost && (
              <p className="text-sm text-destructive text-center">
                You don't have enough coins to spin
              </p>
            )}

            {/* Result Display */}
            {result && !isSpinning && (
              <div className="p-4 bg-gradient-to-r from-primary/20 to-yellow-500/20 rounded-lg border border-primary/30 text-center animate-fade-in">
                <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">You won!</p>
                <p className="text-xl font-bold text-primary">{result.name}</p>
                {result.type === 'coins' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    +{result.value.toLocaleString()} coins added
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>💡 Tip:</strong> The roulette randomly selects a prize based on the displayed probabilities. 
            Item prizes are automatically sent to your main character's in-game mail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
