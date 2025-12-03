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
  { id: '1', subject: 'Problema con compra de coins', status: 'open', createdAt: '2024-01-15', lastUpdate: '2024-01-15' },
  { id: '2', subject: 'Bug en el inventario', status: 'pending', createdAt: '2024-01-10', lastUpdate: '2024-01-12' },
  { id: '3', subject: 'Consulta sobre evento', status: 'closed', createdAt: '2024-01-05', lastUpdate: '2024-01-06' },
];

const statusConfig = {
  open: { label: 'Abierto', color: 'bg-green-500', icon: AlertCircle },
  pending: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
  closed: { label: 'Cerrado', color: 'bg-gray-500', icon: CheckCircle },
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
        description: 'Por favor completa todos los campos.',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Replace with your API endpoint
    // const response = await fetch('http://localhost:3000/api/tickets/create', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ subject, message }),
    // });

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
      title: 'Ticket creado',
      description: 'Tu ticket ha sido enviado correctamente.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">Tickets de Soporte</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus solicitudes de ayuda</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Ticket</DialogTitle>
              <DialogDescription>
                Describe tu problema y te responderemos lo antes posible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Asunto</label>
                <Input 
                  placeholder="Ej: Problema con mi cuenta"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea 
                  placeholder="Describe tu problema detalladamente..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateTicket} className="w-full">
                Enviar Ticket
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
              <p className="text-muted-foreground">No tienes tickets abiertos</p>
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
                        <span>Creado: {ticket.createdAt}</span>
                        <span>Actualizado: {ticket.lastUpdate}</span>
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
