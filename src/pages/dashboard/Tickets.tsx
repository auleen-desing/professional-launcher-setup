import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, Send, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface Ticket {
  id: number;
  subject: string;
  category: string;
  status: 'open' | 'pending' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface TicketReply {
  id: number;
  message: string;
  isStaff: boolean;
  createdAt: string;
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-green-500', icon: AlertCircle },
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  closed: { label: 'Closed', color: 'bg-gray-500', icon: CheckCircle },
};

const categories = [
  { value: 'account', label: 'Account Issue' },
  { value: 'payment', label: 'Payment Problem' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'other', label: 'Other' },
];

export function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('other');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TICKETS.LIST), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setTickets(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TICKETS.CREATE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, message, category }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Ticket created',
          description: 'Your ticket has been submitted successfully.',
        });
        setSubject('');
        setMessage('');
        setCategory('other');
        setIsCreateOpen(false);
        fetchTickets();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Could not create ticket.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not connect to server.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openTicketDetails = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketReplies([]);
    
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(`/tickets/${ticket.id}`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success && data.data.replies) {
        setTicketReplies(data.data.replies);
      }
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsReplying(true);

    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl(`/tickets/${selectedTicket.id}/reply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyMessage }),
      });

      const data = await response.json();

      if (data.success) {
        setTicketReplies([...ticketReplies, {
          id: Date.now(),
          message: replyMessage,
          isStaff: false,
          createdAt: new Date().toISOString(),
        }]);
        setReplyMessage('');
        toast({ title: 'Reply sent' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not send reply.',
        variant: 'destructive',
      });
    } finally {
      setIsReplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold">Support Tickets</h1>
            <p className="text-muted-foreground mt-2">Manage your support requests</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Support Tickets</h1>
          <p className="text-muted-foreground mt-2">Manage your support requests</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>
                  Describe your issue and we will respond as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input 
                    placeholder="E.g. Issue with my account"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea 
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateTicket} className="w-full" disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isCreating ? 'Creating...' : 'Submit Ticket'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">You have no tickets</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => {
            const status = statusConfig[ticket.status] || statusConfig.open;
            const StatusIcon = status.icon;
            
            return (
              <Card 
                key={ticket.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => openTicketDetails(ticket)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="gap-1">
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          {status.label}
                        </Badge>
                        <Badge variant="secondary">{ticket.category}</Badge>
                        <span className="text-sm text-muted-foreground">#{ticket.id}</span>
                      </div>
                      <h3 className="text-lg font-medium mt-2">{ticket.subject}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Created: {formatDate(ticket.createdAt)}</span>
                        <span>Updated: {formatDate(ticket.updatedAt)}</span>
                      </div>
                    </div>
                    <StatusIcon className={`h-5 w-5 ${
                      ticket.status === 'open' ? 'text-green-500' : 
                      ticket.status === 'pending' ? 'text-yellow-500' : 'text-gray-500'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              Ticket #{selectedTicket?.id} • {selectedTicket?.category}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {ticketReplies.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No messages yet</p>
            ) : (
              ticketReplies.map((reply) => (
                <div 
                  key={reply.id}
                  className={`p-3 rounded-lg ${reply.isStaff ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'}`}
                >
                  <p className="text-sm font-medium mb-1">
                    {reply.isStaff ? '👤 Staff' : '👤 You'}
                  </p>
                  <p className="text-sm">{reply.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(reply.createdAt)}
                  </p>
                </div>
              ))
            )}
            
            {selectedTicket?.status !== 'closed' && (
              <div className="flex gap-2">
                <Input
                  placeholder="Write a reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                />
                <Button onClick={handleReply} disabled={isReplying}>
                  {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
