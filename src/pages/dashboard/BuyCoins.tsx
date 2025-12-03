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
        title: 'Selecciona un paquete',
        description: 'Por favor selecciona un paquete de NovaCoins primero.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Replace with your API endpoint
      // const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENTS.CREATE}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     packageId: selectedPackage.id, 
      //     paymentMethod 
      //   }),
      // });

      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: 'Procesando pago...',
        description: `Redirigiendo a ${paymentMethod}...`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo procesar el pago.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient-cyan">Comprar NovaCoins</h1>
        <p className="text-muted-foreground mt-2">Selecciona un paquete y método de pago</p>
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
                  <span className="font-medium">Seleccionado</span>
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
          <CardTitle className="font-display">Método de Pago</CardTitle>
          <CardDescription>Selecciona cómo deseas pagar</CardDescription>
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
                    <h4 className="font-semibold">Tarjeta de Crédito/Débito</h4>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Paga de forma segura con tarjeta a través de Stripe. Transacción instantánea.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="paypal" className="mt-6">
              <div className="bg-card rounded-xl p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Wallet className="h-8 w-8 text-[#0070ba]" />
                  <div>
                    <h4 className="font-semibold">PayPal</h4>
                    <p className="text-sm text-muted-foreground">Paga con tu cuenta PayPal</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Usa tu saldo de PayPal o tarjeta vinculada. Rápido y seguro.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="paysafecard" className="mt-6">
              <div className="bg-card rounded-xl p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-8 w-8 text-[#00a3e0]" />
                  <div>
                    <h4 className="font-semibold">Paysafecard</h4>
                    <p className="text-sm text-muted-foreground">Pago con código prepago</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compra una tarjeta Paysafecard en cualquier punto de venta y usa el código.
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
              'Procesando...'
            ) : selectedPackage ? (
              <>
                <CreditCard className="h-4 w-4" />
                Pagar ${selectedPackage.price} con {paymentMethod}
              </>
            ) : (
              'Selecciona un paquete'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
