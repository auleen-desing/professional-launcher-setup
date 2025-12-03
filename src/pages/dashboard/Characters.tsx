import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Sword, Target, Wand2, Star, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Character {
  id: string;
  name: string;
  class: 'Swordsman' | 'Archer' | 'Mage';
  level: number;
  gold: number;
  reputation: number;
  lastLogin: string;
  heroLevel?: number;
  sp?: string;
}

// Mock characters for development
const mockCharacters: Character[] = [
  {
    id: '1',
    name: 'NovaKnight',
    class: 'Swordsman',
    level: 99,
    gold: 2500000000,
    reputation: 45000,
    lastLogin: '2024-01-15T10:30:00Z',
    heroLevel: 50,
    sp: 'Berserker',
  },
  {
    id: '2',
    name: 'ShadowArcher',
    class: 'Archer',
    level: 93,
    gold: 850000000,
    reputation: 32000,
    lastLogin: '2024-01-14T18:45:00Z',
    heroLevel: 35,
    sp: 'Scout',
  },
  {
    id: '3',
    name: 'IceMage',
    class: 'Mage',
    level: 88,
    gold: 420000000,
    reputation: 28000,
    lastLogin: '2024-01-10T22:15:00Z',
    heroLevel: 28,
    sp: 'Archmage',
  },
];

const classIcons = {
  Swordsman: Sword,
  Archer: Target,
  Mage: Wand2,
};

const classColors = {
  Swordsman: 'text-red-400 bg-red-500/10 border-red-500/30',
  Archer: 'text-green-400 bg-green-500/10 border-green-500/30',
  Mage: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

export default function Characters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      // const response = await apiService.getCharacters();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCharacters(mockCharacters);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load characters",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatGold = (gold: number) => {
    if (gold >= 1000000000) return `${(gold / 1000000000).toFixed(1)}B`;
    if (gold >= 1000000) return `${(gold / 1000000).toFixed(1)}M`;
    if (gold >= 1000) return `${(gold / 1000).toFixed(1)}K`;
    return gold.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Characters</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50">
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Characters</h1>
        <Button variant="outline" size="sm" onClick={fetchCharacters}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {characters.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No characters found</p>
            <p className="text-sm text-muted-foreground">Create a character in-game to see it here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => {
            const ClassIcon = classIcons[character.class];
            return (
              <Card key={character.id} className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {character.name}
                    </CardTitle>
                    <Badge className={classColors[character.class]}>
                      <ClassIcon className="h-3 w-3 mr-1" />
                      {character.class}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-xl font-bold text-primary">{character.level}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                      <p className="text-xs text-muted-foreground">Hero Level</p>
                      <p className="text-xl font-bold text-yellow-400">+{character.heroLevel || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Gold</span>
                      <span className="font-medium text-yellow-400">{formatGold(character.gold)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reputation</span>
                      <span className="font-medium flex items-center gap-1">
                        <Star className="h-3 w-3 text-primary" />
                        {character.reputation.toLocaleString()}
                      </span>
                    </div>
                    {character.sp && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">SP Active</span>
                        <Badge variant="secondary">{character.sp}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last login: {formatDate(character.lastLogin)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
