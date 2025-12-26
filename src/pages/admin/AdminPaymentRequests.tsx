import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Smartphone, Clock, CheckCircle2, XCircle, Loader2, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface PaymentRequest {
  id: number;
  account_id: number;
  username: string;
  payment_type: string;
  code: string;
  amount: number;
  coins_requested: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  processed_by_name: string | null;
  created_at: string;
  processed_at: string | null;
}

const AdminPaymentRequests = () => {
  const [pendingRequests, setPendingRequests] = useState<PaymentRequest[]>([]);
  const [allRequests, setAllRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [coinsToGive, setCoinsToGive] = useState('');
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [viewingCode, setViewingCode] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const [pendingRes, allRes] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PAYMENT_REQUESTS.ADMIN_PENDING), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PAYMENT_REQUESTS.ADMIN_ALL), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const pendingData = await pendingRes.json();
      const allData = await allRes.json();

      if (pendingData.success) setPendingRequests(pendingData.data);
      if (allData.success) setAllRequests(allData.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load payment requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.PAYMENT_REQUESTS.ADMIN_PROCESS.replace(':id', selectedRequest.id.toString())),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action,
            adminNotes: adminNotes || null,
            coinsToGive: action === 'approve' && coinsToGive ? parseInt(coinsToGive) : null
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setSelectedRequest(null);
        setAdminNotes('');
        setCoinsToGive('');
        fetchRequests();
      } else {
        toast.error(data.error || 'Failed to process request');
      }
    } catch (error) {
      toast.error('Failed to process request');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  const RequestCard = ({ request, showActions = false }: { request: PaymentRequest; showActions?: boolean }) => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-4">
        {request.payment_type === 'paysafecard' ? (
          <CreditCard className="w-6 h-6 text-primary" />
        ) : (
          <Smartphone className="w-6 h-6 text-primary" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{request.username}</p>
            <Badge variant="secondary" className="capitalize">{request.payment_type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            €{request.amount} → {request.coins_requested.toLocaleString()} coins
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(request.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {getStatusBadge(request.status)}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setViewingCode(request.code);
            setShowCodeDialog(true);
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
        {showActions && (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedRequest(request);
              setCoinsToGive(request.coins_requested.toString());
            }}
          >
            Process
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Requests</h1>
          <p className="text-muted-foreground">Manage Paysafecard and Bizum redemptions</p>
        </div>
        <Button variant="outline" onClick={fetchRequests} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">{pendingRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paysafecard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRequests.filter(r => r.payment_type === 'paysafecard').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bizum</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRequests.filter(r => r.payment_type === 'bizum').length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-muted-foreground">No pending payment requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} showActions />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : allRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No payment requests found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {allRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Process Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject this {selectedRequest?.payment_type} request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedRequest.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedRequest.payment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">€{selectedRequest.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested Coins</p>
                  <p className="font-medium">{selectedRequest.coins_requested.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Code/Reference</p>
                  <p className="font-mono bg-background p-2 rounded text-sm break-all">{selectedRequest.code}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coins">Coins to Give (if different)</Label>
                <Input
                  id="coins"
                  type="number"
                  value={coinsToGive}
                  onChange={(e) => setCoinsToGive(e.target.value)}
                  placeholder={selectedRequest.coins_requested.toString()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleProcess('reject')}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject
            </Button>
            <Button
              onClick={() => handleProcess('approve')}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Approve & Add Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Code</DialogTitle>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-muted font-mono text-center text-lg break-all">
            {viewingCode}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentRequests;
