import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Shield, 
  ShieldOff, 
  RefreshCw, 
  Plus, 
  Clock,
  AlertTriangle,
  Zap,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface BlockedIP {
  ip: string;
  blockedAt: string;
  expiresAt: string;
  remainingMinutes: number;
  reason: string;
  burstCount: number;
  authAttempts: number;
}

interface SecurityConfig {
  blockDuration: number;
  burstLimit: number;
  burstWindow: number;
  authLimit: number;
  authWindow: number;
}

export default function AdminBlockedIPs() {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const { toast } = useToast();

  const fetchBlockedIPs = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.BLOCKED_IPS), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBlockedIPs(data.data);
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlockedIPs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchBlockedIPs(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBlockIP = async () => {
    if (!newIP.trim()) {
      toast({ title: 'Error', description: 'Enter an IP address', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.BLOCK_IP), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip: newIP.trim(), reason: blockReason || 'Blocked by admin' })
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Success', description: `IP ${newIP} blocked` });
        setShowBlockDialog(false);
        setNewIP('');
        setBlockReason('');
        fetchBlockedIPs(true);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to block IP', variant: 'destructive' });
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.UNBLOCK_IP.replace(':ip', ip)), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Success', description: `IP ${ip} unblocked` });
        fetchBlockedIPs(true);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to unblock IP', variant: 'destructive' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-destructive" />
              Blocked IPs
            </h1>
            <p className="text-muted-foreground">
              Real-time view of blocked IP addresses
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => fetchBlockedIPs(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowBlockDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Block IP
            </Button>
          </div>
        </div>

        {/* Security Config Stats */}
        {config && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Block Duration
                </div>
                <p className="text-2xl font-bold">{config.blockDuration} min</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Zap className="h-4 w-4" />
                  Burst Limit
                </div>
                <p className="text-2xl font-bold">{config.burstLimit} req/{config.burstWindow}s</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Lock className="h-4 w-4" />
                  Auth Limit
                </div>
                <p className="text-2xl font-bold">{config.authLimit}/{config.authWindow}min</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Currently Blocked
                </div>
                <p className="text-2xl font-bold text-destructive">{blockedIPs.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Blocked IPs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Active Blocks ({blockedIPs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : blockedIPs.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium text-green-600">No blocked IPs</p>
                <p className="text-muted-foreground">All clear! No suspicious activity detected.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Time Remaining</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((item) => (
                      <TableRow key={item.ip}>
                        <TableCell className="font-mono font-bold">
                          {item.ip}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            {item.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.blockedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{item.remainingMinutes} min</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 text-xs">
                            {item.burstCount > 0 && (
                              <Badge variant="outline">
                                <Zap className="h-3 w-3 mr-1" />
                                {item.burstCount} burst
                              </Badge>
                            )}
                            {item.authAttempts > 0 && (
                              <Badge variant="outline">
                                <Lock className="h-3 w-3 mr-1" />
                                {item.authAttempts} auth
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnblockIP(item.ip)}
                          >
                            <ShieldOff className="h-4 w-4 mr-1" />
                            Unblock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Block IP Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block IP Address</DialogTitle>
            <DialogDescription>
              Manually block an IP address. The block will last {config?.blockDuration || 120} minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">IP Address</label>
              <Input
                placeholder="e.g., 192.168.1.100"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input
                placeholder="e.g., Suspicious activity"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlockIP}>
              <Shield className="h-4 w-4 mr-2" />
              Block IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
