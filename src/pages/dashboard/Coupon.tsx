import { useState } from 'react';
import { Ticket, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function Coupon() {
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { updateCoins, user } = useAuth();

  const handleRedeem = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a coupon code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with your API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (couponCode.toUpperCase() === 'NOVAERA2024') {
        const bonus = 500;
        updateCoins((user?.coins || 0) + bonus);
        toast({
          title: 'Coupon redeemed!',
          description: `You received ${bonus} coins.`,
        });
        setCouponCode('');
      } else {
        toast({
          title: 'Invalid coupon',
          description: 'The code entered is not valid or has expired.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error redeeming the coupon. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Redeem Coupon</h1>
        <p className="text-muted-foreground mt-2">Enter your promotional code</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Coupon Code</CardTitle>
              <CardDescription>Enter the code to receive your rewards</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter your code here..."
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="text-center text-lg tracking-widest"
          />
          <Button 
            onClick={handleRedeem} 
            className="w-full gap-2"
            disabled={isLoading}
          >
            <Gift className="h-4 w-4" />
            {isLoading ? 'Redeeming...' : 'Redeem Coupon'}
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-md bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Coupons can be obtained from special events, 
            social media or server promotions. Each coupon can only be used once per account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
