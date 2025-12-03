import { useState } from 'react';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Ticket } from '@/types/user';

const mockTickets: Ticket[] = [
  { id: '1', subject: 'Issue with coin purchase', status: 'open', createdAt: '2024-01-15', lastUpdate: '2024-01-15' },
  { id: '2', subject: 'Inventory bug', status: 'pending', createdAt: '2024-01-10', lastUpdate: '2024-01-12' },
  { id: '3', subject: 'Event question', status: 'closed', createdAt: '2024-01-05', lastUpdate: '2024-01-06' },
];

const statusConfig = {
  open: { label: 'Open', color: 'bg-green-500', icon: AlertCircle },
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  closed: { label: 'Closed', color: 'bg-gray-500', icon: CheckCircle },
};

export function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    const newTicket: Ticket = {
      id: String(tickets.length + 1),
      subject,
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString().split('T')[0],
    };

    setTickets([newTicket, ...tickets]);
    setSubject('');
    setMessage('');
    setIsOpen(false);

    toast({
      title: 'Ticket created',
      description: 'Your ticket has been submitted successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Support Tickets</h1>
          <p className="text-muted-foreground mt-2">Manage your support requests</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              <Button onClick={handleCreateTicket} className="w-full">
                Submit Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">You have no open tickets</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            const StatusIcon = status.icon;
            
            return (
              <Card key={ticket.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="gap-1">
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          {status.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">#{ticket.id}</span>
                      </div>
                      <h3 className="text-lg font-medium mt-2">{ticket.subject}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Created: {ticket.createdAt}</span>
                        <span>Updated: {ticket.lastUpdate}</span>
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
    </div>
  );
}
