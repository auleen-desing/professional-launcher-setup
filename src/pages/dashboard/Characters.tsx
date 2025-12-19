import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Sword, Target, Wand2, Star, RefreshCw, Coins, Shield, Skull, Trophy, Zap, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface Character {
  id: number;
  name: string;
  class: string;
  level: number;
  jobLevel: number;
  heroLevel: number;
  gender: string;
  gold: number;
  goldBank: number;
  reputation: number;
  compliment: number;
  dignity: number;
  faction: string;
  act4Kills: number;
  act4Deaths: number;
  act4Points: number;
  act4MonthlyPoints: number;
  arenaKills: number;
  arenaDeaths: number;
  arenaWinner: number;
  rbbWins: number;
  rbbLosses: number;
  talentWins: number;
  talentLosses: number;
  talentSurrenders: number;
  spPoint: number;
  spAdditionPoint: number;
  masterPoints: number;
  prestige: number;
  legacy: number;
  completedTimeSpaces: number;
  battlePassPoints: number;
  hasPremiumBattlePass: boolean;
  isOnline: boolean;
}

const classIcons: Record<string, any> = {
  Adventurer: User,
  Swordsman: Sword,
  Archer: Target,
  Mage: Wand2,
  'Martial Artist': Shield,
};

const classColors: Record<string, string> = {
  Adventurer: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  Swordsman: 'text-red-400 bg-red-500/10 border-red-500/30',
  Archer: 'text-green-400 bg-green-500/10 border-green-500/30',
  Mage: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  'Martial Artist': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

const factionColors: Record<string, string> = {
  None: 'text-gray-400',
  Angel: 'text-blue-400',
  Demon: 'text-red-400',
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
    return gold.toLocaleString();
  };

  const formatNumber = (num: number) => num.toLocaleString();

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
                <Skeleton className="h-48 w-full" />
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                      {character.isOnline && (
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Online" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {character.hasPremiumBattlePass && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-500/10">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <Badge className={colorClass}>
                        <ClassIcon className="h-3 w-3 mr-1" />
                        {character.class}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{character.gender}</span>
                    <span>•</span>
                    <span className={factionColors[character.faction]}>{character.faction}</span>
                    {character.prestige > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-purple-400">Prestige {character.prestige}</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Levels */}
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

                  <Tabs defaultValue="stats" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-8">
                      <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
                      <TabsTrigger value="pvp" className="text-xs">PvP</TabsTrigger>
                      <TabsTrigger value="progress" className="text-xs">Progress</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="stats" className="space-y-2 mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Coins className="h-3 w-3" /> Gold
                        </span>
                        <span className="font-medium text-yellow-400">{formatGold(character.gold)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Gold Bank</span>
                        <span className="font-medium text-yellow-400">{formatGold(character.goldBank)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Star className="h-3 w-3" /> Reputation
                        </span>
                        <span className="font-medium">{formatNumber(character.reputation)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Dignity</span>
                        <span className="font-medium">{formatNumber(character.dignity)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Compliment</span>
                        <span className="font-medium">{formatNumber(character.compliment)}</span>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="pvp" className="space-y-2 mt-3">
                      <div className="text-xs text-muted-foreground mb-2">Act 4</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Skull className="h-3 w-3" /> K/D
                        </span>
                        <span className="font-medium">
                          <span className="text-green-400">{character.act4Kills}</span>
                          {' / '}
                          <span className="text-red-400">{character.act4Deaths}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Points</span>
                        <span className="font-medium">{formatNumber(character.act4Points)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2 mt-3">Arena</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Trophy className="h-3 w-3" /> Wins
                        </span>
                        <span className="font-medium text-green-400">{character.arenaWinner}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">RBB W/L</span>
                        <span className="font-medium">
                          <span className="text-green-400">{character.rbbWins}</span>
                          {' / '}
                          <span className="text-red-400">{character.rbbLosses}</span>
                        </span>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="progress" className="space-y-2 mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3" /> SP Points
                        </span>
                        <span className="font-medium">{formatNumber(character.spPoint)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">SP Addition</span>
                        <span className="font-medium">{formatNumber(character.spAdditionPoint)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Master Points</span>
                        <span className="font-medium">{formatNumber(character.masterPoints)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">TimeSpaces</span>
                        <span className="font-medium">{character.completedTimeSpaces}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Legacy</span>
                        <span className="font-medium text-purple-400">{character.legacy}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Battle Pass</span>
                        <span className="font-medium">{formatNumber(character.battlePassPoints)} pts</span>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
