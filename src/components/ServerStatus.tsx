import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Server, Wifi, WifiOff } from 'lucide-react';
import { API_CONFIG } from '@/config/api';

interface ChannelStatus {
  id: string;
  name: string;
  port: number;
  players: number;
  maxPlayers: number;
  status: 'online' | 'offline' | 'maintenance';
}

// Mock data for development - replace with real API
const mockChannels: ChannelStatus[] = Object.entries(API_CONFIG.CHANNELS).map(([key, value]) => ({
  id: key,
  name: value.name,
  port: value.port,
  players: Math.floor(Math.random() * 150) + 50,
  maxPlayers: 200,
  status: Math.random() > 0.1 ? 'online' : 'maintenance',
}));

export function ServerStatus() {
  const [channels, setChannels] = useState<ChannelStatus[]>(mockChannels);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    // Calculate total online players
    const total = channels
      .filter(ch => ch.status === 'online')
      .reduce((sum, ch) => sum + ch.players, 0);
    setTotalPlayers(total);

    // TODO: Replace with real API polling
    // const interval = setInterval(fetchServerStatus, 30000);
    // return () => clearInterval(interval);
  }, [channels]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>;
      case 'offline': return <Badge variant="destructive">Offline</Badge>;
      case 'maintenance': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Maintenance</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Server Status
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-primary">{totalPlayers}</span>
            <span className="text-muted-foreground">online</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
          >
            <div className="flex items-center gap-3">
              {channel.status === 'online' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">{channel.name}</p>
                <p className="text-xs text-muted-foreground">Port: {channel.port}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {channel.status === 'online' && (
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress 
                    value={(channel.players / channel.maxPlayers) * 100} 
                    className="h-2 w-16"
                  />
                  <span className="text-xs text-muted-foreground">
                    {channel.players}/{channel.maxPlayers}
                  </span>
                </div>
              )}
              {getStatusBadge(channel.status)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
