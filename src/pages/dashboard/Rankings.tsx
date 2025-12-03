import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Star, Swords, Users, Crown } from 'lucide-react';

interface RankingEntry {
  rank: number;
  name: string;
  class: string;
  value: number;
  guild?: string;
}

// Mock rankings data
const mockLevelRankings: RankingEntry[] = [
  { rank: 1, name: 'LegendSlayer', class: 'Swordsman', value: 99, guild: 'Immortals' },
  { rank: 2, name: 'ShadowMaster', class: 'Archer', value: 99, guild: 'DarkSide' },
  { rank: 3, name: 'ArcaneWizard', class: 'Mage', value: 99, guild: 'MagicCircle' },
  { rank: 4, name: 'NovaKnight', class: 'Swordsman', value: 98, guild: 'NovaEra' },
  { rank: 5, name: 'StormArcher', class: 'Archer', value: 97, guild: 'Hunters' },
  { rank: 6, name: 'IceQueen', class: 'Mage', value: 96 },
  { rank: 7, name: 'BladeRunner', class: 'Swordsman', value: 95, guild: 'Speed' },
  { rank: 8, name: 'EagleEye', class: 'Archer', value: 94, guild: 'Hunters' },
  { rank: 9, name: 'FireMage', class: 'Mage', value: 93 },
  { rank: 10, name: 'SteelGuard', class: 'Swordsman', value: 92, guild: 'Defenders' },
];

const mockReputationRankings: RankingEntry[] = [
  { rank: 1, name: 'LegendSlayer', class: 'Swordsman', value: 125000, guild: 'Immortals' },
  { rank: 2, name: 'NovaKnight', class: 'Swordsman', value: 98000, guild: 'NovaEra' },
  { rank: 3, name: 'ShadowMaster', class: 'Archer', value: 87000, guild: 'DarkSide' },
  { rank: 4, name: 'ArcaneWizard', class: 'Mage', value: 76000, guild: 'MagicCircle' },
  { rank: 5, name: 'StormArcher', class: 'Archer', value: 65000, guild: 'Hunters' },
];

const mockPvPRankings: RankingEntry[] = [
  { rank: 1, name: 'Destroyer', class: 'Swordsman', value: 2450, guild: 'Chaos' },
  { rank: 2, name: 'SilentKiller', class: 'Archer', value: 2320, guild: 'Assassins' },
  { rank: 3, name: 'ThunderMage', class: 'Mage', value: 2180 },
  { rank: 4, name: 'IronFist', class: 'Swordsman', value: 2050, guild: 'Warriors' },
  { rank: 5, name: 'DeadShot', class: 'Archer', value: 1980, guild: 'Assassins' },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Crown className="h-5 w-5 text-yellow-400" />;
    case 2: return <Medal className="h-5 w-5 text-gray-300" />;
    case 3: return <Medal className="h-5 w-5 text-amber-600" />;
    default: return <span className="w-5 text-center font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1: return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
    case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
    case 3: return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30';
    default: return 'bg-background/50 border-border/30';
  }
};

const classColors: Record<string, string> = {
  Swordsman: 'text-red-400',
  Archer: 'text-green-400',
  Mage: 'text-blue-400',
};

export default function Rankings() {
  const [isLoading, setIsLoading] = useState(true);
  const [levelRankings, setLevelRankings] = useState<RankingEntry[]>([]);
  const [reputationRankings, setReputationRankings] = useState<RankingEntry[]>([]);
  const [pvpRankings, setPvPRankings] = useState<RankingEntry[]>([]);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API calls
      await new Promise(resolve => setTimeout(resolve, 800));
      setLevelRankings(mockLevelRankings);
      setReputationRankings(mockReputationRankings);
      setPvPRankings(mockPvPRankings);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (value: number, type: string) => {
    if (type === 'level') return `Lv. ${value}`;
    if (type === 'reputation') return value.toLocaleString();
    if (type === 'pvp') return `${value} pts`;
    return value;
  };

  const RankingList = ({ data, type }: { data: RankingEntry[]; type: string }) => (
    <div className="space-y-2">
      {isLoading ? (
        Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))
      ) : (
        data.map((entry) => (
          <div
            key={`${entry.name}-${entry.rank}`}
            className={`flex items-center justify-between p-3 rounded-lg border ${getRankBg(entry.rank)}`}
          >
            <div className="flex items-center gap-3">
              {getRankIcon(entry.rank)}
              <div>
                <p className="font-medium">{entry.name}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={classColors[entry.class] || 'text-muted-foreground'}>
                    {entry.class}
                  </span>
                  {entry.guild && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {entry.guild}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono">
              {formatValue(entry.value, type)}
            </Badge>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Rankings</h1>
      </div>

      <Tabs defaultValue="level" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="level" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Level
          </TabsTrigger>
          <TabsTrigger value="reputation" className="flex items-center gap-2">
            <Medal className="h-4 w-4" />
            Reputation
          </TabsTrigger>
          <TabsTrigger value="pvp" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            PvP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="level">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Top Players by Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankingList data={levelRankings} type="level" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reputation">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-primary" />
                Top Players by Reputation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankingList data={reputationRankings} type="reputation" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pvp">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-red-400" />
                Top PvP Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankingList data={pvpRankings} type="pvp" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
