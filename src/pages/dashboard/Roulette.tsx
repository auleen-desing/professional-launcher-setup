import { useState } from 'react';
import { Dices, Coins, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const prizes = [
  { id: 1, name: '50 Coins', value: 50, color: 'bg-blue-500' },
  { id: 2, name: '100 Coins', value: 100, color: 'bg-green-500' },
  { id: 3, name: '200 Coins', value: 200, color: 'bg-yellow-500' },
  { id: 4, name: '500 Coins', value: 500, color: 'bg-orange-500' },
  { id: 5, name: '1000 Coins', value: 1000, color: 'bg-red-500' },
  { id: 6, name: 'Special Item', value: 0, color: 'bg-purple-500', special: true },
];

export function Roulette() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof prizes[0] | null>(null);
  const { toast } = useToast();
  const { updateCoins, user } = useAuth();

  const spinCost = 100;

  const handleSpin = async () => {
    if ((user?.coins || 0) < spinCost) {
      toast({
        title: 'Insufficient coins',
        description: `You need ${spinCost} coins to spin the roulette.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSpinning(true);
    setResult(null);

    // Deduct spin cost
    updateCoins((user?.coins || 0) - spinCost);

    // Calculate random result
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    const newRotation = rotation + 1440 + Math.random() * 360; // At least 4 full spins

    setRotation(newRotation);

    // Wait for animation to complete
    setTimeout(() => {
      setIsSpinning(false);
      setResult(randomPrize);
      
      if (randomPrize.value > 0) {
        updateCoins((user?.coins || 0) + randomPrize.value);
      }

      toast({
        title: 'Roulette Result!',
        description: randomPrize.special 
          ? `You won a ${randomPrize.name}!` 
          : `You won ${randomPrize.value} coins!`,
      });
    }, 3000);
  };

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
            <CardDescription>Cost per spin: {spinCost} coins</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {/* Wheel */}
            <div className="relative w-64 h-64">
              <div 
                className="w-full h-full rounded-full border-4 border-primary/50 overflow-hidden transition-transform duration-[3000ms] ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {prizes.map((prize, index) => (
                  <div
                    key={prize.id}
                    className={`absolute w-1/2 h-1/2 origin-bottom-right ${prize.color}`}
                    style={{
                      transform: `rotate(${index * 60}deg) skewY(-30deg)`,
                      transformOrigin: '0% 100%',
                    }}
                  />
                ))}
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
              <Sparkles className="h-5 w-5" />
              {isSpinning ? 'Spinning...' : `Spin (${spinCost} coins)`}
            </Button>

            {result && !isSpinning && (
              <div className="text-center p-4 bg-primary/20 rounded-lg border border-primary/30 w-full">
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
              {prizes.map((prize) => (
                <div 
                  key={prize.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className={`w-4 h-4 rounded-full ${prize.color}`} />
                  <span className="flex-1">{prize.name}</span>
                  {prize.special ? (
                    <Sparkles className="h-4 w-4 text-purple-500" />
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
