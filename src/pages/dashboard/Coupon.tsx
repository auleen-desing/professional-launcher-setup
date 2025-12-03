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
        description: 'Por favor ingresa un código de cupón.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with your API endpoint
      // const response = await fetch('http://localhost:3000/api/coupons/redeem', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code: couponCode }),
      // });
      // const data = await response.json();

      // Mock response for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (couponCode.toUpperCase() === 'NOVAERA2024') {
        const bonus = 500;
        updateCoins((user?.coins || 0) + bonus);
        toast({
          title: '¡Cupón canjeado!',
          description: `Has recibido ${bonus} coins.`,
        });
        setCouponCode('');
      } else {
        toast({
          title: 'Cupón inválido',
          description: 'El código ingresado no es válido o ya ha expirado.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al canjear el cupón. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Canjear Cupón</h1>
        <p className="text-muted-foreground mt-2">Ingresa tu código promocional</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Código de Cupón</CardTitle>
              <CardDescription>Ingresa el código para recibir tus recompensas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Ingresa tu código aquí..."
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
            {isLoading ? 'Canjeando...' : 'Canjear Cupón'}
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-md bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Los cupones pueden obtenerse en eventos especiales, 
            redes sociales o promociones del servidor. Cada cupón solo puede usarse una vez por cuenta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
