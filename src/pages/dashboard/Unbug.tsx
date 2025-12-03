import { useState } from 'react';
import { Bug, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function Unbug() {
  const [characterName, setCharacterName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleUnbug = async () => {
    if (!characterName.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa el nombre de tu personaje.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with your API endpoint
      // const response = await fetch('http://localhost:3000/api/character/unbug', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ characterName }),
      // });

      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccess(true);
      toast({
        title: 'Personaje desbugueado',
        description: `El personaje "${characterName}" ha sido reiniciado correctamente.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo desbuguear el personaje. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Unbug Personaje</h1>
        <p className="text-muted-foreground mt-2">Reinicia tu personaje si está bugueado</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Bug className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Desbuguear Personaje</CardTitle>
                <CardDescription>Ingresa el nombre exacto de tu personaje</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <p className="text-lg font-medium">¡Personaje desbugueado!</p>
                <p className="text-muted-foreground">Ya puedes volver a conectarte al juego.</p>
                <Button variant="outline" onClick={() => setSuccess(false)}>
                  Desbuguear otro personaje
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Nombre del personaje"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                />
                <Button 
                  onClick={handleUnbug} 
                  className="w-full gap-2"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Desbugueando...' : 'Desbuguear'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Importante</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>Antes de usar esta función, ten en cuenta:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>El personaje debe estar <strong>desconectado</strong> del juego</li>
              <li>Esta acción teleportará al personaje a la ciudad inicial</li>
              <li>Puede tardar unos segundos en aplicarse</li>
              <li>Solo úsalo si realmente tienes problemas para conectarte</li>
              <li>Tiene un cooldown de 5 minutos entre usos</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
