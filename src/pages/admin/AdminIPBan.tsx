import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Shield, 
  ShieldOff,
  Users,
  AlertTriangle,
  Loader2,
  Globe,
  Ban,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface Account {
  id: number;
  username: string;
  email: string;
  authority: number;
  ip: string;
  registrationDate: string;
  coins: number;
  isBanned: boolean;
}

interface SuspiciousIP {
  ip: string;
  accountCount: number;
  bannedCount: number;
  firstRegistration: string;
  lastRegistration: string;
}

export function AdminIPBan() {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuspicious, setLoadingSuspicious] = useState(true);
  const [selectedIP, setSelectedIP] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banningIP, setBanningIP] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuspiciousIPs();
  }, []);

  const fetchSuspiciousIPs = async () => {
    setLoadingSuspicious(true);
    try {
      const response = await apiService.request<SuspiciousIP[]>('/api/admin/ipban/suspicious');
      if (response.success) {
        setSuspiciousIPs(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch suspicious IPs:', error);
    } finally {
      setLoadingSuspicious(false);
    }
  };

  const searchByIP = async () => {
    if (searchTerm.length < 3) {
      toast({
        title: 'Invalid search',
        description: 'Please enter at least 3 characters',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.request<Account[]>(`/api/admin/ipban/search?ip=${encodeURIComponent(searchTerm)}`);
      if (response.success) {
        setAccounts(response.data || []);
        if (!response.data || response.data.length === 0) {
          toast({
            title: 'No results',
            description: 'No accounts found with that IP'
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Search failed',
        description: 'Failed to search accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const viewAccountsByIP = async (ip: string) => {
    setSelectedIP(ip);
    setLoading(true);
    try {
      const response = await apiService.request<Account[]>(`/api/admin/ipban/accounts-by-ip/${encodeURIComponent(ip)}`);
      if (response.success) {
        setAccounts(response.data || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openBanDialog = (ip: string) => {
    setBanningIP(ip);
    setBanReason('');
    setBanDialogOpen(true);
  };

  const banIP = async () => {
    if (!banningIP) return;

    try {
      const response = await apiService.request('/api/admin/ipban/ban-ip', {
        method: 'POST',
        body: JSON.stringify({ ip: banningIP, reason: banReason })
      });

      if (response.success) {
        toast({
          title: 'IP Banned',
          description: response.message
        });
        setBanDialogOpen(false);
        // Refresh data
        if (selectedIP === banningIP) {
          viewAccountsByIP(banningIP);
        }
        fetchSuspiciousIPs();
      }
    } catch (error) {
      toast({
        title: 'Ban failed',
        description: 'Failed to ban IP',
        variant: 'destructive'
      });
    }
  };

  const unbanIP = async (ip: string) => {
    try {
      const response = await apiService.request('/api/admin/ipban/unban-ip', {
        method: 'POST',
        body: JSON.stringify({ ip })
      });

      if (response.success) {
        toast({
          title: 'IP Unbanned',
          description: response.message
        });
        if (selectedIP === ip) {
          viewAccountsByIP(ip);
        }
        fetchSuspiciousIPs();
      }
    } catch (error) {
      toast({
        title: 'Unban failed',
        description: 'Failed to unban IP',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">IP Ban Management</h1>
        <p className="text-muted-foreground mt-1">
          Search and ban users by IP address
        </p>
      </div>

      {/* Search Section */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search by IP
          </CardTitle>
          <CardDescription>
            Enter an IP address or partial IP to find associated accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter IP address (e.g., 192.168.1)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByIP()}
              className="flex-1"
            />
            <Button onClick={searchByIP} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Search</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {accounts.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Accounts {selectedIP && `from ${selectedIP}`}
                <Badge variant="secondary">{accounts.length}</Badge>
              </CardTitle>
              {selectedIP && (
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => openBanDialog(selectedIP)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban All from IP
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => unbanIP(selectedIP)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Unban All
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.username}</TableCell>
                    <TableCell className="text-muted-foreground">{account.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary"
                        onClick={() => viewAccountsByIP(account.ip)}
                      >
                        {account.ip}
                      </Button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(account.registrationDate)}
                    </TableCell>
                    <TableCell>{account.coins.toLocaleString()}</TableCell>
                    <TableCell>
                      {account.isBanned ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldOff className="h-3 w-3" />
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Suspicious IPs */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Suspicious IPs
            <Badge variant="outline">{suspiciousIPs.length}</Badge>
          </CardTitle>
          <CardDescription>
            IP addresses with multiple registered accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSuspicious ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : suspiciousIPs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No suspicious IPs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Accounts</TableHead>
                  <TableHead>Banned</TableHead>
                  <TableHead>First Registration</TableHead>
                  <TableHead>Last Registration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspiciousIPs.map((item) => (
                  <TableRow key={item.ip}>
                    <TableCell className="font-mono">{item.ip}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.accountCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.bannedCount > 0 ? (
                        <Badge variant="destructive">{item.bannedCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.firstRegistration)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.lastRegistration)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewAccountsByIP(item.ip)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openBanDialog(item.ip)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Ban IP Address
            </DialogTitle>
            <DialogDescription>
              This will ban ALL accounts registered from {banningIP}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Enter ban reason..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={banIP}>
              <Ban className="h-4 w-4 mr-2" />
              Ban IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
