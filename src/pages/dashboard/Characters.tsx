import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Sword, Target, Wand2, Star, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface Character {
  id: number;
  name: string;
  class: string;
  level: number;
  jobLevel: number;
  heroLevel: number;
  gold: number;
  reputation: number;
}

const classIcons: Record<string, any> = {
  Swordsman: Sword,
  Archer: Target,
  Mage: Wand2,
};

const classColors: Record<string, string> = {
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
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USER.CHARACTERS), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setCharacters(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load characters",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Characters error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
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
            const ClassIcon = classIcons[character.class] || User;
            const colorClass = classColors[character.class] || 'text-muted-foreground bg-muted/10 border-muted/30';
            
            return (
              <Card key={character.id} className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {character.name}
                    </CardTitle>
                    <Badge className={colorClass}>
                      <ClassIcon className="h-3 w-3 mr-1" />
                      {character.class}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-background/50 rounded-lg p-3 border border-border/30 text-center">
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-xl font-bold text-primary">{character.level}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border border-border/30 text-center">
                      <p className="text-xs text-muted-foreground">Job</p>
                      <p className="text-xl font-bold text-cyan-400">{character.jobLevel}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border border-border/30 text-center">
                      <p className="text-xs text-muted-foreground">Hero</p>
                      <p className="text-xl font-bold text-yellow-400">+{character.heroLevel}</p>
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
