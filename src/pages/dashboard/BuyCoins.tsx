import { useState, useEffect } from 'react';
import { Wallet, Check, Coins, Sparkles, Zap, Loader2, Heart } from 'lucide-react';
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

  // PayPal donation config
  const PAYPAL_EMAIL = 'pincjx771@gmail.com';
  const RETURN_URL = `${window.location.origin}/dashboard/buy-coins?donation=success`;
  const CANCEL_URL = `${window.location.origin}/dashboard/buy-coins?donation=canceled`;
  // IPN URL must be absolute for PayPal
  const IPN_URL = `${window.location.origin}/api/payments/paypal/ipn`;

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
        // Fallback packages if database is empty
        setPackages([
          { id: '1', name: 'Básico', coins: 8000, price: 10 },
          { id: '2', name: 'Popular', coins: 24500, price: 30, popular: true },
          { id: '3', name: 'Premium', coins: 55000, price: 50 },
          { id: '4', name: 'Élite', coins: 110000, price: 100 },
          { id: '5', name: 'Ultimate', coins: 240000, price: 200 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([
        { id: '1', name: 'Básico', coins: 8000, price: 10 },
        { id: '2', name: 'Popular', coins: 24500, price: 30, popular: true },
        { id: '3', name: 'Premium', coins: 55000, price: 50 },
        { id: '4', name: 'Élite', coins: 110000, price: 100 },
        { id: '5', name: 'Ultimate', coins: 240000, price: 200 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonation = async () => {
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
        description: 'Please login to donate.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create pending donation in database
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/payments/paypal/create-donation'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          packageId: String(selectedPackage.id),
          coins: selectedPackage.coins + (selectedPackage.bonus || 0),
          amount: selectedPackage.price
        }),
      });

      const data = await response.json();

      if (!data.success || !data.transactionId) {
        throw new Error(data.error || 'Failed to create donation record');
      }

      const transactionId = data.transactionId;
      const totalCoins = selectedPackage.coins + (selectedPackage.bonus || 0);

      // Store pending donation info locally
      localStorage.setItem('pendingDonation', JSON.stringify({
        transactionId,
        coins: totalCoins,
        amount: selectedPackage.price,
      }));

      // Create and submit PayPal form (POST method like the working PHP version)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://www.paypal.com/cgi-bin/webscr';

      const fields = {
        cmd: '_donations',
        business: PAYPAL_EMAIL,
        item_name: 'Server donation',
        amount: selectedPackage.price.toString(),
        custom: transactionId,
        currency_code: 'EUR',
        notify_url: IPN_URL,
        item_number: String(selectedPackage.id),
        return: RETURN_URL,
        cancel_return: CANCEL_URL,
        rm: '2', // Return method - POST data and auto-redirect
        no_shipping: '1', // No shipping address required
        no_note: '1', // No note field
      };

      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Donation error:', error);
      toast({
        title: 'Error',
        description: 'Could not initiate donation. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  // Check for donation return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const donationStatus = urlParams.get('donation');

    if (donationStatus === 'success') {
      const pendingDonation = localStorage.getItem('pendingDonation');
      if (pendingDonation) {
        const { coins } = JSON.parse(pendingDonation);
        toast({
          title: 'Thank you for your donation!',
          description: `Your ${coins.toLocaleString()} NovaCoins will be credited once PayPal confirms the payment.`,
        });
        localStorage.removeItem('pendingDonation');
      }
      // Refresh user to check if coins were already credited
      refreshUser();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (donationStatus === 'canceled') {
      toast({
        title: 'Donation Canceled',
        description: 'Your donation was canceled.',
        variant: 'destructive',
      });
      localStorage.removeItem('pendingDonation');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
        <h1 className="text-3xl font-display font-bold text-gradient-cyan">Support NovaEra</h1>
        <p className="text-muted-foreground mt-2">Donate to receive NovaCoins - PayPal donations only</p>
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
              <p className="text-4xl font-display font-black text-primary">€{pkg.price}</p>
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
            
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        ))}
      </div>

      {/* Donation Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            PayPal Donation
          </CardTitle>
          <CardDescription>Support the server with a donation and receive NovaCoins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-card rounded-xl p-6 border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="h-8 w-8 text-[#0070ba]" />
              <div>
                <h4 className="font-semibold">PayPal Donation</h4>
                <p className="text-sm text-muted-foreground">Secure donation via PayPal</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your NovaCoins will be credited automatically once PayPal confirms your donation (usually within a few minutes).
            </p>
          </div>

          <Button 
            onClick={handleDonation}
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
                <Heart className="h-4 w-4" />
                Donate €{selectedPackage.price} via PayPal
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
