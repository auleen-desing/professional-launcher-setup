import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/config/api';
import { Gift, Search, Send, Coins, AlertCircle, User } from 'lucide-react';

interface SearchUser {
  id: number;
  username: string;
}

export default function Gifts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user, updateCoins } = useAuth();

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(`/gifts/search-users?query=${encodeURIComponent(query)}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedUser(null);
    searchUsers(value);
  };

  const selectUser = (user: SearchUser) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setSearchResults([]);
  };

  const handleSendGift = async () => {
    if (!selectedUser) {
      toast({ title: 'Error', description: 'Please select a recipient', variant: 'destructive' });
      return;
    }

    const coinsToSend = parseInt(amount);
    if (!coinsToSend || coinsToSend < 1) {
      toast({ title: 'Error', description: 'Enter a valid amount', variant: 'destructive' });
      return;
    }

    if (coinsToSend > (user?.coins || 0)) {
      toast({ title: 'Error', description: 'Insufficient coins', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/gifts/send'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientUsername: selectedUser.username,
          amount: coinsToSend,
          message: message.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Gift Sent!', description: data.message });
        updateCoins(data.data.newBalance);
        setSelectedUser(null);
        setSearchQuery('');
        setAmount('');
        setMessage('');
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send gift', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          Send Gift
        </h1>
        <p className="text-muted-foreground">Send NovaCoins to other players</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Coins
            </CardTitle>
            <CardDescription>
              Your balance: <span className="text-primary font-bold">{user?.coins?.toLocaleString() || 0}</span> NovaCoins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recipient"
                  placeholder="Search username..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => selectUser(u)}
                        className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        {u.username}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedUser && (
                <p className="text-sm text-green-400">Selected: {selectedUser.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  min="1"
                  max="100000"
                />
              </div>
              <p className="text-xs text-muted-foreground">Maximum: 100,000 coins per gift</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/200</p>
            </div>

            <Button 
              onClick={handleSendGift} 
              disabled={!selectedUser || !amount || isSending}
              className="w-full"
            >
              {isSending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {amount ? `${parseInt(amount).toLocaleString()} coins` : 'Gift'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Gifts are <span className="text-foreground font-medium">non-refundable</span> once sent.</p>
              <p>• Maximum gift amount: <span className="text-foreground font-medium">100,000 coins</span> per transaction.</p>
              <p>• The recipient will see your username and any message you include.</p>
              <p>• All gift transactions are logged for security.</p>
              <p>• You cannot send gifts to yourself.</p>
            </div>

            <div className="pt-4 border-t border-border/50">
              <h4 className="font-medium mb-2">Need more coins?</h4>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/buy-coins">Buy NovaCoins</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
