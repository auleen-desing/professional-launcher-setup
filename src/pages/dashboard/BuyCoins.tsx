import { useState } from 'react';
import { CreditCard, Wallet, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CoinPackage } from '@/types/user';

const coinPackages: CoinPackage[] = [
  { id: '1', name: 'Starter', coins: 1000, price: 5 },
  { id: '2', name: 'Popular', coins: 5000, price: 20, bonus: 500, popular: true },
  { id: '3', name: 'Premium', coins: 12000, price: 45, bonus: 2000 },
  { id: '4', name: 'Ultimate', coins: 30000, price: 100, bonus: 8000 },
];

export function BuyCoins() {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const { toast } = useToast();

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast({
        title: 'Selecciona un paquete',
        description: 'Por favor selecciona un paquete de coins primero.',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Replace with your API endpoint
    // const response = await fetch('http://localhost:3000/api/payments/create', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     packageId: selectedPackage.id, 
    //     paymentMethod 
    //   }),
    // });

    toast({
      title: 'Procesando pago...',
      description: `Redirigiendo a ${paymentMethod}...`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Comprar Coins</h1>
        <p className="text-muted-foreground mt-2">Selecciona un paquete y método de pago</p>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {coinPackages.map((pkg) => (
          <Card 
            key={pkg.id}
            className={`cursor-pointer transition-all duration-300 ${
              selectedPackage?.id === pkg.id 
                ? 'border-primary ring-2 ring-primary/20' 
                : 'hover:border-primary/50'
            } ${pkg.popular ? 'relative' : ''}`}
            onClick={() => setSelectedPackage(pkg)}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                Popular
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription>{pkg.coins.toLocaleString()} Coins</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold text-primary">${pkg.price}</p>
              {pkg.bonus && (
                <p className="text-sm text-green-500 mt-2">+{pkg.bonus.toLocaleString()} bonus</p>
              )}
              {selectedPackage?.id === pkg.id && (
                <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Seleccionado</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Método de Pago</CardTitle>
          <CardDescription>Selecciona cómo deseas pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="stripe" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Stripe
              </TabsTrigger>
              <TabsTrigger value="paypal" className="gap-2">
                <Wallet className="h-4 w-4" />
                PayPal
              </TabsTrigger>
              <TabsTrigger value="paysafecard" className="gap-2">
                <Shield className="h-4 w-4" />
                Paysafecard
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stripe" className="mt-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Paga de forma segura con tarjeta de crédito o débito a través de Stripe.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="paypal" className="mt-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Paga con tu cuenta de PayPal de forma rápida y segura.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="paysafecard" className="mt-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Paga con un código de Paysafecard. Ideal si prefieres no usar datos bancarios.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            onClick={handlePurchase}
            className="w-full mt-6"
            size="lg"
            disabled={!selectedPackage}
          >
            {selectedPackage 
              ? `Pagar $${selectedPackage.price} con ${paymentMethod}` 
              : 'Selecciona un paquete'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
