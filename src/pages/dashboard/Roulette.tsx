import { useState, useEffect } from 'react';
import { Dices, Coins, Gift, Sparkles, Package, Loader2 } from 'lucide-react';
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
}

const prizeColors = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-amber-500',
];

export function Roulette() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [spinCost, setSpinCost] = useState(2500);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
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
        title: 'Insufficient coins',
        description: `You need ${spinCost.toLocaleString()} coins to spin.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSpinning(true);
    setResult(null);

    try {
      const token = localStorage.getItem('auth_token');
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
        const segmentAngle = 360 / prizes.length;
        const targetAngle = prizeIndex * segmentAngle;
        const newRotation = rotation + 1440 + (360 - targetAngle) + Math.random() * (segmentAngle * 0.5);

        setRotation(newRotation);

        setTimeout(() => {
          setIsSpinning(false);
          setResult(wonPrize);
          updateCoins(data.data.newBalance);

          toast({
            title: '🎉 Roulette Result!',
            description: wonPrize.type === 'item' 
              ? `You won ${wonPrize.name}! Check your mail.`
              : `You won ${wonPrize.value.toLocaleString()} coins!`,
          });
        }, 3000);
      } else {
        setIsSpinning(false);
        toast({
          title: 'Error',
          description: data.error || 'Could not spin roulette',
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Lucky Roulette</h1>
        <p className="text-muted-foreground mt-2">Try your luck and win prizes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roulette Wheel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dices className="h-5 w-5 text-primary" />
              Roulette
            </CardTitle>
            <CardDescription>Cost per spin: {spinCost.toLocaleString()} coins</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {/* Wheel */}
            <div className="relative w-64 h-64">
              <div 
                className="w-full h-full rounded-full border-4 border-primary/50 overflow-hidden transition-transform duration-[3000ms] ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {prizes.map((prize, index) => {
                  const segmentAngle = 360 / prizes.length;
                  return (
                    <div
                      key={prize.id}
                      className={`absolute w-1/2 h-1/2 origin-bottom-right ${prizeColors[index % prizeColors.length]}`}
                      style={{
                        transform: `rotate(${index * segmentAngle}deg) skewY(${-(90 - segmentAngle)}deg)`,
                        transformOrigin: '0% 100%',
                      }}
                    />
                  );
                })}
              </div>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-primary" />
            </div>

            <Button 
              onClick={handleSpin} 
              size="lg" 
              className="w-full gap-2"
              disabled={isSpinning}
            >
              {isSpinning ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {isSpinning ? 'Spinning...' : `Spin (${spinCost.toLocaleString()} coins)`}
            </Button>

            {result && !isSpinning && (
              <div className="text-center p-4 bg-primary/20 rounded-lg border border-primary/30 w-full animate-pulse">
                <p className="text-sm text-muted-foreground">You won!</p>
                <p className="text-2xl font-bold text-primary">{result.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prizes List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Available Prizes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prizes.map((prize, index) => (
                <div 
                  key={prize.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className={`w-4 h-4 rounded-full ${prizeColors[index % prizeColors.length]}`} />
                  <span className="flex-1">{prize.name}</span>
                  <span className="text-xs text-muted-foreground">{prize.chance}%</span>
                  {prize.type === 'item' ? (
                    <Package className="h-4 w-4 text-purple-500" />
                  ) : (
                    <Coins className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
