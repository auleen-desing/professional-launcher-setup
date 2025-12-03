import { useState } from 'react';
import { Calendar, Gift, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const dailyRewards = [
  { day: 1, coins: 50, claimed: true },
  { day: 2, coins: 75, claimed: true },
  { day: 3, coins: 100, claimed: true },
  { day: 4, coins: 150, claimed: false, current: true },
  { day: 5, coins: 200, claimed: false },
  { day: 6, coins: 300, claimed: false },
  { day: 7, coins: 500, claimed: false, special: true },
];

export function DailyReward() {
  const [claimed, setClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { updateCoins, user } = useAuth();

  const currentReward = dailyRewards.find(r => r.current);

  const handleClaim = async () => {
    setIsLoading(true);

    try {
      // TODO: Replace with your API endpoint
      // const response = await fetch('http://localhost:3000/api/daily/claim', {
      //   method: 'POST',
      // });
      // const data = await response.json();

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (currentReward) {
        updateCoins((user?.coins || 0) + currentReward.coins);
        setClaimed(true);
        toast({
          title: '¡Recompensa reclamada!',
          description: `Has recibido ${currentReward.coins} coins.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ya has reclamado tu recompensa hoy.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Recompensa Diaria</h1>
        <p className="text-muted-foreground mt-2">Reclama tu recompensa cada día</p>
      </div>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Progreso Semanal
          </CardTitle>
          <CardDescription>Entra cada día para aumentar tus recompensas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {dailyRewards.map((reward) => (
              <div
                key={reward.day}
                className={`relative p-3 rounded-lg border text-center transition-all ${
                  reward.claimed 
                    ? 'bg-primary/20 border-primary/50' 
                    : reward.current
                      ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                      : 'bg-muted/50 border-border'
                } ${reward.special ? 'ring-2 ring-yellow-500/50' : ''}`}
              >
                {reward.claimed && (
                  <CheckCircle className="absolute -top-2 -right-2 h-5 w-5 text-primary bg-background rounded-full" />
                )}
                <p className="text-xs text-muted-foreground">Día {reward.day}</p>
                <p className={`text-lg font-bold ${reward.special ? 'text-yellow-500' : 'text-foreground'}`}>
                  {reward.coins}
                </p>
                {reward.special && (
                  <Gift className="h-4 w-4 mx-auto text-yellow-500 mt-1" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Claim Button */}
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {claimed ? (
            <div className="space-y-2">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <p className="text-lg font-medium">¡Recompensa reclamada!</p>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Vuelve mañana para tu próxima recompensa</span>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Gift className="h-16 w-16 text-primary mx-auto animate-bounce" />
                <p className="text-lg font-medium">¡Tu recompensa está lista!</p>
                <p className="text-3xl font-bold text-primary">{currentReward?.coins} Coins</p>
              </div>
              <Button 
                onClick={handleClaim} 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Reclamando...' : 'Reclamar Recompensa'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
