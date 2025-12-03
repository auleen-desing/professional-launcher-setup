import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Server, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface ChannelStatus {
  id: string;
  name: string;
  port: number;
  players: number;
  status: 'online' | 'offline' | 'maintenance';
}

export function ServerStatus() {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServerStatus = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SERVER.STATUS));
      const data = await response.json();
      
      if (data.success) {
        setChannels(data.data.channels);
        setTotalPlayers(data.data.totalPlayers);
        setError(null);
      } else {
        setError('Failed to fetch server status');
      }
    } catch (err) {
      console.error('Server status error:', err);
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>;
      case 'offline': return <Badge variant="destructive">Offline</Badge>;
      case 'maintenance': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Maintenance</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

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
                    value={(channel.players / 200) * 100} 
                    className="h-2 w-16"
                  />
                  <span className="text-xs text-muted-foreground">
                    {channel.players}/200
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
