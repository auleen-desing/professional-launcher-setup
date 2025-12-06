import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Copy, 
  Check,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/config/api';

interface Coupon {
  Id: number;
  Code: string;
  Coins: number;
  MaxUses: number | null;
  CurrentUses: number;
  Active: boolean;
  ExpiresAt: string | null;
  CreatedAt: string;
}

// Helper function for API requests
async function adminRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('novaera_token');
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  return response.json();
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    coins: 1000,
    maxUses: '',
    expiresAt: '',
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await adminRequest('/admin/coupons');
      if (response.success) {
        setCoupons(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'NOVA-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCoupon({ ...newCoupon, code });
  };

  const handleCreate = async () => {
    if (!newCoupon.code || newCoupon.coins <= 0) {
      toast({
        title: "Error",
        description: "Code and coins are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const response = await adminRequest('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: newCoupon.code.toUpperCase(),
          coins: newCoupon.coins,
          maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : null,
          expiresAt: newCoupon.expiresAt || null,
        }),
      });

      if (response.success) {
        toast({
          title: "Coupon created",
          description: `Code ${newCoupon.code} created successfully`,
        });
        setDialogOpen(false);
        setNewCoupon({ code: '', coins: 1000, maxUses: '', expiresAt: '' });
        fetchCoupons();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create coupon",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const response = await adminRequest(`/admin/coupons/${coupon.Id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !coupon.Active }),
      });

      if (response.success) {
        setCoupons(coupons.map(c => 
          c.Id === coupon.Id ? { ...c, Active: !c.Active } : c
        ));
        toast({
          title: coupon.Active ? "Coupon disabled" : "Coupon enabled",
          description: `Code ${coupon.Code} has been ${coupon.Active ? 'disabled' : 'enabled'}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update coupon",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon ${coupon.Code}?`)) return;

    try {
      const response = await adminRequest(`/admin/coupons/${coupon.Id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        setCoupons(coupons.filter(c => c.Id !== coupon.Id));
        toast({
          title: "Coupon deleted",
          description: `Code ${coupon.Code} has been deleted`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coupons</h1>
          <p className="text-muted-foreground mt-1">Create and manage discount coupons</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCoupons} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="NOVA-XXXXX"
                      className="uppercase"
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coins">Coins Reward</Label>
                  <Input
                    id="coins"
                    type="number"
                    value={newCoupon.coins}
                    onChange={(e) => setNewCoupon({ ...newCoupon, coins: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses (leave empty for unlimited)</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={newCoupon.maxUses}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={newCoupon.expiresAt}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Coupon
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {coupons.filter(c => c.Active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {coupons.reduce((sum, c) => sum + c.CurrentUses, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            All Coupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No coupons created yet. Click "Create Coupon" to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.Id}>
                    <TableCell className="font-mono font-bold">
                      <div className="flex items-center gap-2">
                        {coupon.Code}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(coupon.Code)}
                        >
                          {copiedCode === coupon.Code ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-primary font-bold">
                      {coupon.Coins.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {coupon.CurrentUses} / {coupon.MaxUses || '∞'}
                    </TableCell>
                    <TableCell>{formatDate(coupon.ExpiresAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={coupon.Active}
                          onCheckedChange={() => handleToggleActive(coupon)}
                        />
                        <Badge variant={coupon.Active ? "default" : "secondary"}>
                          {coupon.Active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(coupon)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}