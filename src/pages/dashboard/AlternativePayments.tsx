import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Smartphone, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle, Euro } from 'lucide-react';
import { toast } from 'sonner';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface PaymentRequest {
  id: number;
  payment_type: string;
  code: string;
  amount: number;
  coins_requested: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

const AlternativePayments = () => {
  const [activeTab, setActiveTab] = useState('paysafecard');
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Coin rate: 1€ = 100 coins base, x3 multiplier for alternative payments
  const BASE_COIN_RATE = 100;
  const MULTIPLIER = 3;
  const COIN_RATE = BASE_COIN_RATE * MULTIPLIER;
  const coinsRequested = Math.floor(parseFloat(amount || '0') * COIN_RATE);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PAYMENT_REQUESTS.MY_REQUESTS), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMyRequests(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (paymentType: string) => {
    if (!code.trim()) {
      toast.error(paymentType === 'paysafecard' ? 'Please enter your Paysafecard PIN' : 'Please enter your Bizum reference');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PAYMENT_REQUESTS.SUBMIT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentType,
          code: code.trim(),
          amount: parseFloat(amount),
          coinsRequested
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Request submitted! We will process it shortly.');
        setCode('');
        setAmount('');
        fetchMyRequests();
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Alternative Payments</h1>
        <p className="text-muted-foreground">Redeem Paysafecard or Bizum for {API_CONFIG.COIN_NAME}</p>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl font-bold text-green-400">x3</span>
          <span className="text-lg font-semibold text-green-300">BONUS</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Get 3x more {API_CONFIG.COIN_NAME} with Paysafecard & Bizum!
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paysafecard" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Paysafecard
          </TabsTrigger>
          <TabsTrigger value="bizum" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Bizum
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paysafecard" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <CardTitle>Paysafecard Redemption</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-4 h-4" />
                  EUROPE ONLY
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="psc-code">16-Digit PIN Code</Label>
                  <Input
                    id="psc-code"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={19}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="psc-amount">Amount (EUR)</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="psc-amount"
                      type="number"
                      placeholder="10.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-9"
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>
                {coinsRequested > 0 && (
                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <span className="text-sm text-muted-foreground">You will receive (x3 bonus):</span>
                    <p className="text-2xl font-bold text-primary">{coinsRequested.toLocaleString()} {API_CONFIG.COIN_NAME}</p>
                    <p className="text-xs text-green-400">Normal: {Math.floor(parseFloat(amount || '0') * 100).toLocaleString()} → With bonus: {coinsRequested.toLocaleString()}</p>
                  </div>
                )}
                <Button 
                  className="w-full" 
                  onClick={() => handleSubmit('paysafecard')}
                  disabled={isSubmitting || !code || !amount}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Submit for Review
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                  <div>
                    <p className="font-medium">Enter your Paysafecard PIN</p>
                    <p className="text-sm text-muted-foreground">The 16-digit code from your voucher</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                  <div>
                    <p className="font-medium">Enter the amount</p>
                    <p className="text-sm text-muted-foreground">The value of your Paysafecard in EUR</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                  <div>
                    <p className="font-medium">Wait for approval</p>
                    <p className="text-sm text-muted-foreground">We'll verify and add coins within 24h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bizum" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-6 h-6 text-primary" />
                  <CardTitle>Bizum Redemption</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-4 h-4" />
                  SPAIN ONLY
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <p className="font-medium">Send Bizum to:</p>
                  <p className="text-2xl font-bold text-primary">+34 XXX XXX XXX</p>
                  <p className="text-sm text-muted-foreground">Include your username in the message</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bizum-ref">Transaction Reference / Confirmation Code</Label>
                  <Input
                    id="bizum-ref"
                    placeholder="Enter reference or confirmation"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bizum-amount">Amount Sent (EUR)</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="bizum-amount"
                      type="number"
                      placeholder="10.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-9"
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>
                {coinsRequested > 0 && (
                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <span className="text-sm text-muted-foreground">You will receive (x3 bonus):</span>
                    <p className="text-2xl font-bold text-primary">{coinsRequested.toLocaleString()} {API_CONFIG.COIN_NAME}</p>
                    <p className="text-xs text-green-400">Normal: {Math.floor(parseFloat(amount || '0') * 100).toLocaleString()} → With bonus: {coinsRequested.toLocaleString()}</p>
                  </div>
                )}
                <Button 
                  className="w-full" 
                  onClick={() => handleSubmit('bizum')}
                  disabled={isSubmitting || !code || !amount}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
                  Submit for Review
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                  <div>
                    <p className="font-medium">Send Bizum</p>
                    <p className="text-sm text-muted-foreground">To our phone number with your username</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                  <div>
                    <p className="font-medium">Enter transaction reference</p>
                    <p className="text-sm text-muted-foreground">The confirmation code from Bizum</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                  <div>
                    <p className="font-medium">Wait for approval</p>
                    <p className="text-sm text-muted-foreground">We'll verify and add coins within 24h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* My Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>My Redemption Requests</CardTitle>
          <CardDescription>Track the status of your payment requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : myRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No redemption requests yet</p>
          ) : (
            <div className="space-y-3">
              {myRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4">
                    {request.payment_type === 'paysafecard' ? (
                      <CreditCard className="w-5 h-5 text-primary" />
                    ) : (
                      <Smartphone className="w-5 h-5 text-primary" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{request.payment_type}</p>
                      <p className="text-sm text-muted-foreground">
                        €{request.amount} → {request.coins_requested.toLocaleString()} coins
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                    {request.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1">{request.admin_notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlternativePayments;
