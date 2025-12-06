import { useState, useEffect } from 'react';
import { Calendar, Gift, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/config/api';

interface DailyRewardItem {
  day: number;
  coins: number;
  itemVNum?: number;
  itemAmount?: number;
  special?: boolean;
  claimed?: boolean;
  current?: boolean;
}

interface DailyStatus {
  canClaim: boolean;
  streak: number;
  currentDay: number;
  rewards: DailyRewardItem[];
  nextReward: DailyRewardItem | null;
}

export function DailyReward() {
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();
  const { updateCoins, user } = useAuth();

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/daily/status'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
      } else {
        throw new Error(data.error || 'Error fetching status');
      }
    } catch (error) {
      console.error('Error fetching daily status:', error);
      toast({
        title: 'Error',
        description: 'Could not load daily rewards status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleClaim = async () => {
    setIsClaiming(true);

    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/daily/claim'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const { coinsReward, newBalance, day, itemVNum, itemAmount } = data.data;
        
        updateCoins(newBalance);
        
        let description = `You received ${coinsReward} coins!`;
        if (itemVNum && itemAmount > 0) {
          description += ` + ${itemAmount} item(s)`;
        }
        
        toast({
          title: `Day ${day} Reward Claimed!`,
          description,
        });
        
        // Refresh status
        await fetchStatus();
      } else {
        throw new Error(data.error || 'Error claiming reward');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not claim reward',
        variant: 'destructive',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const rewards = status?.rewards || [];
  const currentReward = status?.nextReward;
  const canClaim = status?.canClaim || false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Daily Reward</h1>
        <p className="text-muted-foreground mt-2">Claim your reward every day</p>
      </div>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Progress
          </CardTitle>
          <CardDescription>
            Current streak: {status?.streak || 0} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {rewards.map((reward) => (
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
                <p className="text-xs text-muted-foreground">Day {reward.day}</p>
                <p className={`text-lg font-bold ${reward.special ? 'text-yellow-500' : 'text-foreground'}`}>
                  {reward.coins}
                </p>
                {reward.itemVNum && (
                  <p className="text-xs text-muted-foreground">+Item</p>
                )}
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
          {!canClaim ? (
            <div className="space-y-2">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <p className="text-lg font-medium">Reward claimed!</p>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Come back tomorrow for your next reward</span>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Gift className="h-16 w-16 text-primary mx-auto animate-bounce" />
                <p className="text-lg font-medium">Your reward is ready!</p>
                <p className="text-3xl font-bold text-primary">
                  {currentReward?.coins || 0} Coins
                </p>
                {currentReward?.itemVNum && currentReward?.itemAmount && (
                  <p className="text-sm text-muted-foreground">
                    + {currentReward.itemAmount} Item(s)
                  </p>
                )}
              </div>
              <Button 
                onClick={handleClaim} 
                size="lg" 
                className="w-full"
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  'Claim Reward'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
