import { useState, useEffect } from 'react';
import { Bug, RefreshCw, AlertTriangle, CheckCircle, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/config/api';

interface Character {
  id: number;
  name: string;
  class: string;
  level: number;
  jobLevel: number;
  heroLevel: number;
}

export function Unbug() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUnbugging, setIsUnbugging] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/character/list'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCharacters(data.data);
      } else {
        throw new Error(data.error || 'Error al obtener personajes');
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los personajes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbug = async () => {
    if (!selectedCharacter) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un personaje.',
        variant: 'destructive',
      });
      return;
    }

    setIsUnbugging(true);

    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/character/unbug'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ characterId: parseInt(selectedCharacter) })
      });

      const data = await response.json();

      if (data.success) {
        const character = characters.find(c => c.id.toString() === selectedCharacter);
        setSuccess(true);
        toast({
          title: 'Personaje desbugueado',
          description: `El personaje "${character?.name}" ha sido movido a una ubicación segura.`,
        });
      } else {
        throw new Error(data.error || 'Error al desbuguear');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo desbuguear el personaje. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsUnbugging(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setSelectedCharacter('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Desbuguear Personaje</h1>
        <p className="text-muted-foreground mt-2">Resetea la posición de tu personaje si está atascado</p>
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
                <CardDescription>Selecciona el personaje que quieres mover</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <p className="text-lg font-medium">¡Personaje desbugueado!</p>
                <p className="text-muted-foreground">Ya puedes reconectarte al juego.</p>
                <Button variant="outline" onClick={resetForm}>
                  Desbuguear otro personaje
                </Button>
              </div>
            ) : characters.length === 0 ? (
              <div className="text-center py-6 space-y-4">
                <User className="h-16 w-16 text-muted-foreground mx-auto" />
                <p className="text-lg font-medium">No tienes personajes</p>
                <p className="text-muted-foreground">Crea un personaje en el juego primero.</p>
              </div>
            ) : (
              <>
                <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un personaje" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map((char) => (
                      <SelectItem key={char.id} value={char.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{char.name}</span>
                          <span className="text-muted-foreground text-sm">
                            Lv.{char.level} {char.class}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCharacter && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    {(() => {
                      const char = characters.find(c => c.id.toString() === selectedCharacter);
                      if (!char) return null;
                      return (
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Nombre:</span> <span className="font-medium">{char.name}</span></p>
                          <p><span className="text-muted-foreground">Clase:</span> {char.class}</p>
                          <p><span className="text-muted-foreground">Nivel:</span> {char.level} | Job: {char.jobLevel} | Hero: {char.heroLevel}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <Button 
                  onClick={handleUnbug} 
                  className="w-full gap-2"
                  disabled={isUnbugging || !selectedCharacter}
                >
                  <RefreshCw className={`h-4 w-4 ${isUnbugging ? 'animate-spin' : ''}`} />
                  {isUnbugging ? 'Procesando...' : 'Desbuguear'}
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
              <li>Esta acción teletransportará al personaje a NosVille</li>
              <li>Puede tardar unos segundos en aplicarse</li>
              <li>Solo usa esto si tienes problemas para conectarte</li>
              <li>Hay un cooldown de 5 minutos entre usos</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
