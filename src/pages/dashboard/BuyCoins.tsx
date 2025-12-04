import { useState } from 'react';
import { CreditCard, Wallet, Shield, Check, Coins, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CoinPackage } from '@/types/user';
import { API_CONFIG } from '@/config/api';

const coinPackages: CoinPackage[] = [
  { id: '1', name: 'Starter', coins: 1000, price: 5 },
  { id: '2', name: 'Popular', coins: 5000, price: 20, bonus: 500, popular: true },
  { id: '3', name: 'Premium', coins: 12000, price: 45, bonus: 2000 },
  { id: '4', name: 'Ultimate', coins: 30000, price: 100, bonus: 8000 },
];

export function BuyCoins() {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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
      if (paymentMethod === 'paypal') {
        // Open PayPal donation link
        const donationUrl = `https://www.paypal.com/donate/?business=${encodeURIComponent(API_CONFIG.PAYPAL_EMAIL)}&amount=${selectedPackage.price}&currency_code=USD&item_name=${encodeURIComponent(`NovaEra Donation - ${selectedPackage.coins} NovaCoins`)}`;
        window.open(donationUrl, '_blank');
        
        toast({
          title: 'PayPal Donation',
          description: 'After donating, contact us with your transaction ID to receive your NovaCoins.',
        });
      } else {
        // TODO: Implement other payment methods
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({
          title: 'Processing payment...',
          description: `Redirecting to ${paymentMethod}...`,
        });
      }
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient-cyan">Buy NovaCoins</h1>
        <p className="text-muted-foreground mt-2">Select a package and payment method</p>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coinPackages.map((pkg) => (
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
              <CardTitle className="text-xl font-display">{pkg.name}</CardTitle>
              <CardDescription className="text-lg font-semibold text-foreground">
                {pkg.coins.toLocaleString()} NovaCoins
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <p className="text-4xl font-display font-black text-primary">${pkg.price}</p>
              {pkg.bonus && (
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

      {/* Payment Methods */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display">Payment Method</CardTitle>
          <CardDescription>Select how you want to pay</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
            <TabsList className="grid grid-cols-3 w-full h-auto p-1">
              <TabsTrigger value="stripe" className="gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Stripe</span>
              </TabsTrigger>
              <TabsTrigger value="paypal" className="gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">PayPal</span>
              </TabsTrigger>
              <TabsTrigger value="paysafecard" className="gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Paysafecard</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stripe" className="mt-6">
              <div className="bg-card rounded-xl p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">Credit/Debit Card</h4>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pay securely by card through Stripe. Instant transaction.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="paypal" className="mt-6">
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
            </TabsContent>
            
            <TabsContent value="paysafecard" className="mt-6">
              <div className="bg-card rounded-xl p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-8 w-8 text-[#00a3e0]" />
                  <div>
                    <h4 className="font-semibold">Paysafecard</h4>
                    <p className="text-sm text-muted-foreground">Prepaid code payment</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Buy a Paysafecard at any point of sale and use the code.
                </p>
              </div>
            </TabsContent>
          </Tabs>

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
                {paymentMethod === 'paypal' ? <Wallet className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                {paymentMethod === 'paypal' 
                  ? `Donate $${selectedPackage.price} via PayPal`
                  : `Pay $${selectedPackage.price} with ${paymentMethod}`
                }
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
