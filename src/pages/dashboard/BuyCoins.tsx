import { useState, useEffect } from 'react';
import { Wallet, Check, Coins, Sparkles, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface CoinPackage {
  id: number;
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

export function BuyCoins() {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SHOP.PACKAGES));
      const data = await response.json();
      
      if (data.success && data.data) {
        // Mark the second package as popular if there are multiple
        const packagesWithPopular = data.data.map((pkg: CoinPackage, index: number) => ({
          ...pkg,
          popular: index === 1 && data.data.length > 1
        }));
        setPackages(packagesWithPopular);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: 'Error',
        description: 'Could not load coin packages.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast({
        title: 'Select a package',
        description: 'Please select a NovaCoins package first.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Open PayPal donation link
      const donationUrl = `https://www.paypal.com/donate/?business=${encodeURIComponent(API_CONFIG.PAYPAL_EMAIL)}&amount=${selectedPackage.price}&currency_code=USD&item_name=${encodeURIComponent(`NovaEra Donation - ${selectedPackage.coins} NovaCoins`)}`;
      window.open(donationUrl, '_blank');
      
      toast({
        title: 'PayPal Donation',
        description: 'After donating, contact us with your transaction ID to receive your NovaCoins.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not process the payment.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPackageName = (coins: number): string => {
    if (coins >= 30000) return 'Ultimate';
    if (coins >= 10000) return 'Premium';
    if (coins >= 5000) return 'Popular';
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
        <p className="text-muted-foreground mt-2">Select a package and donate via PayPal</p>
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
              <CardTitle className="text-xl font-display">{getPackageName(pkg.coins)}</CardTitle>
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

      {packages.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          No coin packages available at the moment.
        </div>
      )}

      {/* PayPal Donation */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display">PayPal Donation</CardTitle>
          <CardDescription>Support us with a donation to receive your NovaCoins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-card rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="h-8 w-8 text-[#0070ba]" />
              <div>
                <h4 className="font-semibold">PayPal Donation</h4>
                <p className="text-sm text-muted-foreground">Support us with a donation</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Make a donation via PayPal. After donating, contact us with your transaction ID to receive your NovaCoins.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Email: <span className="text-primary font-medium">{API_CONFIG.PAYPAL_EMAIL}</span>
            </p>
          </div>

          <Button 
            onClick={handlePurchase}
            className="w-full mt-6 gap-2 glow-cyan"
            size="lg"
            disabled={!selectedPackage || isProcessing}
          >
            {isProcessing ? (
              'Processing...'
            ) : selectedPackage ? (
              <>
                <Wallet className="h-4 w-4" />
                Donate ${selectedPackage.price} via PayPal
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
