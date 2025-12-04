import { useState, useEffect } from 'react';
import { Wallet, Check, Coins, Sparkles, Zap, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface CoinPackage {
  id: number | string;
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  name?: string;
}

export function BuyCoins() {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SHOP.PACKAGES));
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const packagesWithPopular = data.data.map((pkg: CoinPackage, index: number) => ({
          ...pkg,
          popular: index === 1 && data.data.length > 1
        }));
        setPackages(packagesWithPopular);
      } else {
        // Fallback to default packages if API fails
        setPackages([
          { id: '1', name: 'Starter', coins: 1000, price: 5 },
          { id: '2', name: 'Popular', coins: 5000, price: 20, bonus: 500, popular: true },
          { id: '3', name: 'Premium', coins: 12000, price: 45, bonus: 2000 },
          { id: '4', name: 'Ultimate', coins: 30000, price: 100, bonus: 8000 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      // Fallback packages
      setPackages([
        { id: '1', name: 'Starter', coins: 1000, price: 5 },
        { id: '2', name: 'Popular', coins: 5000, price: 20, bonus: 500, popular: true },
        { id: '3', name: 'Premium', coins: 12000, price: 45, bonus: 2000 },
        { id: '4', name: 'Ultimate', coins: 30000, price: 100, bonus: 8000 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPalCheckout = async () => {
    if (!selectedPackage) {
      toast({
        title: 'Select a package',
        description: 'Please select a NovaCoins package first.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to purchase coins.',
        variant: 'destructive',
      });
      return;
    }

    const token = localStorage.getItem('novaera_token');

    setIsProcessing(true);

    try {
      // Create PayPal order
      const response = await fetch(buildApiUrl('/api/payments/paypal/create-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: String(selectedPackage.id) }),
      });

      const data = await response.json();

      if (data.success && data.approveUrl) {
        // Store order ID for capture after return
        localStorage.setItem('pendingPayPalOrder', JSON.stringify({
          orderId: data.orderId,
          packageId: selectedPackage.id,
          coins: selectedPackage.coins + (selectedPackage.bonus || 0),
        }));
        
        // Redirect to PayPal
        window.location.href = data.approveUrl;
      } else {
        throw new Error(data.error || 'Failed to create PayPal order');
      }
    } catch (error) {
      console.error('PayPal checkout error:', error);
      toast({
        title: 'Error',
        description: 'Could not initiate PayPal checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for PayPal return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paypalSuccess = urlParams.get('paypal_success');
    const paypalCanceled = urlParams.get('paypal_canceled');

    if (paypalSuccess === '1') {
      capturePayPalOrder();
    } else if (paypalCanceled === '1') {
      toast({
        title: 'Payment Canceled',
        description: 'Your PayPal payment was canceled.',
        variant: 'destructive',
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const capturePayPalOrder = async () => {
    const pendingOrder = localStorage.getItem('pendingPayPalOrder');
    if (!pendingOrder) return;

    const { orderId, coins } = JSON.parse(pendingOrder);
    const token = localStorage.getItem('novaera_token');
    setIsProcessing(true);

    try {
      const response = await fetch(buildApiUrl('/api/payments/paypal/capture-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Payment Successful!',
          description: `${coins.toLocaleString()} NovaCoins have been added to your account!`,
        });
        
        // Refresh user profile to update coin balance
        await refreshUser();
      } else {
        throw new Error(data.error || 'Payment capture failed');
      }
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: 'Error',
        description: 'Could not complete payment. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      localStorage.removeItem('pendingPayPalOrder');
      setIsProcessing(false);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const getPackageName = (pkg: CoinPackage): string => {
    if (pkg.name) return pkg.name;
    if (pkg.coins >= 30000) return 'Ultimate';
    if (pkg.coins >= 10000) return 'Premium';
    if (pkg.coins >= 5000) return 'Popular';
    return 'Starter';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient-cyan">Buy NovaCoins</h1>
        <p className="text-muted-foreground mt-2">Select a package and pay securely with PayPal</p>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id}
            className={`relative cursor-pointer transition-all duration-300 overflow-hidden group ${
              selectedPackage?.id === pkg.id 
                ? 'border-primary ring-2 ring-primary/30 bg-primary/5' 
                : 'border-border/50 hover:border-primary/50'
            }`}
            onClick={() => setSelectedPackage(pkg)}
          >
            {pkg.popular && (
              <div className="absolute -right-8 top-4 rotate-45 bg-gradient-to-r from-accent to-primary text-primary-foreground text-xs px-10 py-1 font-bold">
                POPULAR
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <div className={`mx-auto p-3 rounded-xl mb-2 ${
                pkg.popular ? 'bg-gradient-to-br from-accent to-primary' : 'bg-primary/10'
              }`}>
                {pkg.popular ? <Sparkles className="h-6 w-6 text-white" /> : <Coins className="h-6 w-6 text-primary" />}
              </div>
              <CardTitle className="text-xl font-display">{getPackageName(pkg)}</CardTitle>
              <CardDescription className="text-lg font-semibold text-foreground">
                {pkg.coins.toLocaleString()} NovaCoins
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <p className="text-4xl font-display font-black text-primary">${pkg.price}</p>
              {pkg.bonus && pkg.bonus > 0 && (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-green/20 text-neon-green text-sm font-medium">
                  <Zap className="h-3 w-3" />
                  +{pkg.bonus.toLocaleString()} bonus
                </div>
              )}
              {selectedPackage?.id === pkg.id && (
                <div className="flex items-center justify-center gap-2 text-primary pt-2">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Selected</span>
                </div>
              )}
            </CardContent>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        ))}
      </div>

      {/* PayPal Checkout */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Secure Payment
          </CardTitle>
          <CardDescription>Pay securely with PayPal - coins are credited instantly!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-card rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="h-8 w-8 text-[#0070ba]" />
              <div>
                <h4 className="font-semibold">PayPal Checkout</h4>
                <p className="text-sm text-muted-foreground">Instant delivery of NovaCoins</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your NovaCoins will be credited automatically after payment confirmation.
            </p>
          </div>

          <Button 
            onClick={handlePayPalCheckout}
            className="w-full mt-6 gap-2 glow-cyan"
            size="lg"
            disabled={!selectedPackage || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : selectedPackage ? (
              <>
                <Wallet className="h-4 w-4" />
                Pay ${selectedPackage.price} with PayPal
              </>
            ) : (
              'Select a package'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
