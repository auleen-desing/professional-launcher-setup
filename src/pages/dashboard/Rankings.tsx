import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Star, Swords, Users, Crown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface RankingEntry {
  rank: number;
  name: string;
  class: string;
  level?: number;
  jobLevel?: number;
  heroLevel?: number;
  reputation?: number;
  kills?: number;
  deaths?: number;
  account?: string;
}

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
  const [activeTab, setActiveTab] = useState('level');
  const [levelRankings, setLevelRankings] = useState<RankingEntry[]>([]);
  const [reputationRankings, setReputationRankings] = useState<RankingEntry[]>([]);
  const [pvpRankings, setPvPRankings] = useState<RankingEntry[]>([]);

  useEffect(() => {
    fetchAllRankings();
  }, []);

  const fetchAllRankings = async () => {
    setIsLoading(true);
    try {
      const [levelRes, repRes, pvpRes] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.RANKINGS.LEVEL)),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.RANKINGS.REPUTATION)),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.RANKINGS.PVP)),
      ]);

      const [levelData, repData, pvpData] = await Promise.all([
        levelRes.json(),
        repRes.json(),
        pvpRes.json(),
      ]);

      if (levelData.success) setLevelRankings(levelData.data);
      if (repData.success) setReputationRankings(repData.data);
      if (pvpData.success) setPvPRankings(pvpData.data);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const RankingList = ({ data, type }: { data: RankingEntry[]; type: string }) => (
    <div className="space-y-2">
      {isLoading ? (
        Array(10).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))
      ) : data.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No rankings available</p>
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
                  {entry.account && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {entry.account}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {type === 'level' && (
                <div className="text-right">
                  <Badge variant="secondary" className="font-mono">
                    Lv. {entry.level}+{entry.heroLevel || 0}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Job: {entry.jobLevel}</p>
                </div>
              )}
              {type === 'reputation' && (
                <Badge variant="secondary" className="font-mono">
                  {entry.reputation?.toLocaleString()}
                </Badge>
              )}
              {type === 'pvp' && (
                <div className="text-right">
                  <Badge variant="secondary" className="font-mono text-green-400">
                    {entry.kills} kills
                  </Badge>
                  <p className="text-xs text-red-400 mt-1">{entry.deaths} deaths</p>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Rankings</h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllRankings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
