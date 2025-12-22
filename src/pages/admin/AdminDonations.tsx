import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Coins,
  User,
  Calendar,
  Euro
} from 'lucide-react';
import { format } from 'date-fns';

interface Donation {
  Id: number;
  AccountId: number;
  AccountName: string;
  PackageId: number;
  TransactionId: string;
  PaymentMethod: string;
  Amount: number;
  Currency: string;
  Coins: number;
  Status: string;
  Notes?: string;
  CreatedAt: string;
  CompletedAt?: string;
}

export default function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { toast } = useToast();

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const response = await apiService.request<Donation[]>('/payments/paypal/admin/all-donations');
      if (response.success && response.data) {
        setDonations(response.data);
        setFilteredDonations(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch donations',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect to server',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    let filtered = donations;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.Status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.AccountName?.toLowerCase().includes(search) ||
        d.TransactionId?.toLowerCase().includes(search) ||
        d.AccountId.toString().includes(search)
      );
    }

    setFilteredDonations(filtered);
  }, [donations, statusFilter, searchTerm]);

  const handleCompleteDonation = async () => {
    if (!selectedDonation) return;

    setCompleting(true);
    try {
      const response = await apiService.request('/payments/paypal/admin/complete-donation', {
        method: 'POST',
        body: JSON.stringify({ transactionId: selectedDonation.TransactionId })
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `Credited ${selectedDonation.Coins} coins to account ${selectedDonation.AccountName}`,
        });
        fetchDonations();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to complete donation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect to server',
        variant: 'destructive'
      });
    } finally {
      setCompleting(false);
      setConfirmOpen(false);
      setSelectedDonation(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'paypal_pending':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30"><AlertCircle className="w-3 h-3 mr-1" /> PayPal Hold</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: donations.length,
    completed: donations.filter(d => d.Status === 'completed').length,
    pending: donations.filter(d => d.Status === 'pending').length,
    paypalPending: donations.filter(d => d.Status === 'paypal_pending').length,
    totalRevenue: donations.filter(d => d.Status === 'completed').reduce((sum, d) => sum + d.Amount, 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Donations</h1>
            <p className="text-muted-foreground">Manage PayPal donations and coin credits</p>
          </div>
          <Button onClick={fetchDonations} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-400">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-yellow-400">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-muted-foreground">PayPal Hold</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-orange-400">{stats.paypalPending}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Revenue</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-primary">€{stats.totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by account, transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paypal_pending">PayPal Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Donations Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>All Donations</CardTitle>
            <CardDescription>
              {filteredDonations.length} donation{filteredDonations.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredDonations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No donations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDonations.map((donation) => (
                      <TableRow key={donation.Id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{donation.AccountName || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">ID: {donation.AccountId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {donation.TransactionId?.substring(0, 20)}...
                          </code>
                          {donation.Notes && (
                            <p className="text-xs text-orange-400 mt-1">{donation.Notes}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">€{donation.Amount?.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="font-medium">{donation.Coins}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(donation.Status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {donation.CreatedAt ? (() => {
                              const date = new Date(donation.CreatedAt);
                              // Add 1 hour for UTC+1
                              date.setHours(date.getHours() + 1);
                              return format(date, 'dd/MM/yyyy HH:mm');
                            })() : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(donation.Status === 'pending' || donation.Status === 'paypal_pending') && (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedDonation(donation);
                                setConfirmOpen(true);
                              }}
                              className="gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Donation</AlertDialogTitle>
            <AlertDialogDescription>
              This will credit <span className="font-bold text-yellow-400">{selectedDonation?.Coins} coins</span> to account{' '}
              <span className="font-bold">{selectedDonation?.AccountName}</span> (ID: {selectedDonation?.AccountId}).
              <br /><br />
              Make sure the payment has been received in PayPal before completing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCompleteDonation} 
              disabled={completing}
              className="bg-green-600 hover:bg-green-700"
            >
              {completing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm & Credit Coins
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
