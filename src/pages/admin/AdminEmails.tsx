import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/config/api';
import { Mail, Send, History, Users, Clock, AlertTriangle, FileText, PartyPopper, Wrench, Gift, Sparkles } from 'lucide-react';

interface EmailHistory {
  id: number;
  subject: string;
  targetGroup: string;
  recipientCount: number;
  sentBy: string;
  sentAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  icon: React.ElementType;
  subject: string;
  content: string;
  color: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Bienvenida',
    icon: PartyPopper,
    color: 'text-green-500',
    subject: '¡Bienvenido a NovaEra, {username}!',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #fbbf24; font-size: 28px; margin: 0;">¡Bienvenido a NovaEra!</h1>
    <p style="color: #9ca3af; font-size: 16px;">Una nueva era comienza para ti, {username}</p>
  </div>
  <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #fbbf24; font-size: 18px; margin: 0 0 10px 0;">🎮 Tu aventura comienza ahora</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0;">Gracias por unirte a nuestra comunidad. Estamos emocionados de tenerte con nosotros.</p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="https://novaerasite.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Acceder al Panel</a>
  </div>
  <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">© 2024 NovaEra. Todos los derechos reservados.</p>
</div>`
  },
  {
    id: 'event',
    name: 'Evento',
    icon: Sparkles,
    color: 'text-purple-500',
    subject: '🎉 ¡Nuevo Evento en NovaEra!',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%); padding: 40px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #a855f7; font-size: 28px; margin: 0;">🎉 ¡Evento Especial!</h1>
    <p style="color: #9ca3af; font-size: 16px;">¡No te lo puedes perder, {username}!</p>
  </div>
  <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #a855f7; font-size: 18px; margin: 0 0 10px 0;">📅 Detalles del Evento</h2>
    <ul style="color: #d1d5db; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
      <li><strong>Fecha:</strong> [FECHA DEL EVENTO]</li>
      <li><strong>Hora:</strong> [HORA DEL EVENTO]</li>
      <li><strong>Duración:</strong> [DURACIÓN]</li>
    </ul>
  </div>
  <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #a855f7; font-size: 18px; margin: 0 0 10px 0;">🎁 Recompensas</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0;">[DESCRIPCIÓN DE LAS RECOMPENSAS]</p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="https://novaerasite.com" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">¡Participar Ahora!</a>
  </div>
  <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">© 2024 NovaEra. Todos los derechos reservados.</p>
</div>`
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento',
    icon: Wrench,
    color: 'text-orange-500',
    subject: '🔧 Mantenimiento Programado - NovaEra',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #2d2416 100%); padding: 40px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #f97316; font-size: 28px; margin: 0;">🔧 Mantenimiento Programado</h1>
    <p style="color: #9ca3af; font-size: 16px;">Información importante, {username}</p>
  </div>
  <div style="background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #f97316; font-size: 18px; margin: 0 0 10px 0;">⏰ Horario de Mantenimiento</h2>
    <ul style="color: #d1d5db; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
      <li><strong>Inicio:</strong> [FECHA Y HORA DE INICIO]</li>
      <li><strong>Fin estimado:</strong> [FECHA Y HORA DE FIN]</li>
      <li><strong>Duración aproximada:</strong> [DURACIÓN]</li>
    </ul>
  </div>
  <div style="background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #f97316; font-size: 18px; margin: 0 0 10px 0;">📋 Cambios Incluidos</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0;">[DESCRIPCIÓN DE LOS CAMBIOS O MEJORAS]</p>
  </div>
  <p style="color: #d1d5db; font-size: 14px; text-align: center; margin-top: 20px;">Disculpa las molestias. ¡Volveremos mejor que nunca!</p>
  <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">© 2024 NovaEra. Todos los derechos reservados.</p>
</div>`
  },
  {
    id: 'reward',
    name: 'Recompensa',
    icon: Gift,
    color: 'text-cyan-500',
    subject: '🎁 ¡Tienes una recompensa esperándote!',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #0d2d3d 100%); padding: 40px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #06b6d4; font-size: 28px; margin: 0;">🎁 ¡Regalo Especial!</h1>
    <p style="color: #9ca3af; font-size: 16px;">¡Hola {username}! Tenemos algo para ti</p>
  </div>
  <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
    <h2 style="color: #06b6d4; font-size: 24px; margin: 0 0 10px 0;">Tu Recompensa</h2>
    <p style="color: #fbbf24; font-size: 32px; font-weight: bold; margin: 10px 0;">[CANTIDAD] NovaCoins</p>
    <p style="color: #d1d5db; font-size: 14px; margin: 0;">[MOTIVO DE LA RECOMPENSA]</p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="https://novaerasite.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #0891b2); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reclamar Recompensa</a>
  </div>
  <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">© 2024 NovaEra. Todos los derechos reservados.</p>
</div>`
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: FileText,
    color: 'text-blue-500',
    subject: '📰 Novedades de NovaEra - {username}',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #1e3a5f 100%); padding: 40px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">📰 Newsletter NovaEra</h1>
    <p style="color: #9ca3af; font-size: 16px;">Las últimas novedades para ti, {username}</p>
  </div>
  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #3b82f6; font-size: 18px; margin: 0 0 10px 0;">🆕 Novedades</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0;">[CONTENIDO DE LAS NOVEDADES]</p>
  </div>
  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #3b82f6; font-size: 18px; margin: 0 0 10px 0;">📊 Estadísticas del Servidor</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0;">[ESTADÍSTICAS RELEVANTES]</p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="https://novaerasite.com" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Visitar NovaEra</a>
  </div>
  <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">© 2024 NovaEra. Todos los derechos reservados.</p>
</div>`
  }
];

export default function AdminEmails() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [targetGroup, setTargetGroup] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<EmailHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/emails/history'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('History error:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setContent(template.content);
    setSelectedTemplate(template.id);
    toast({ 
      title: 'Template cargado', 
      description: `Template "${template.name}" aplicado. Personaliza el contenido antes de enviar.` 
    });
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({ title: 'Error', description: 'Subject and content are required', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/emails/mass-send'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subject, content, targetGroup })
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setSubject('');
        setContent('');
        setSelectedTemplate(null);
        fetchHistory();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const clearTemplate = () => {
    setSubject('');
    setContent('');
    setSelectedTemplate(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const targetLabels: Record<string, string> = {
    all: 'All Users',
    active: 'Active Users',
    vip: 'VIP Users'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Mass Email
        </h1>
        <p className="text-muted-foreground">Send emails to all registered users</p>
      </div>

      {/* Templates Section */}
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Templates Predefinidos
          </CardTitle>
          <CardDescription>
            Selecciona un template para cargar automáticamente el contenido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {emailTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${
                  selectedTemplate === template.id
                    ? 'bg-primary/20 border-primary'
                    : 'bg-background/50 border-border/50 hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <template.icon className={`h-8 w-8 ${template.color}`} />
                <span className="text-sm font-medium">{template.name}</span>
              </button>
            ))}
          </div>
          {selectedTemplate && (
            <div className="mt-4 flex items-center justify-between">
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                Template: {emailTemplates.find(t => t.id === selectedTemplate)?.name}
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearTemplate}>
                Limpiar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Compose Email
            </CardTitle>
            <CardDescription>
              Usa {'{username}'} en el contenido para personalizar con el nombre del usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target Group</Label>
              <Select value={targetGroup} onValueChange={setTargetGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Users (logged in recently)</SelectItem>
                  <SelectItem value="vip">VIP Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML)</Label>
              <Textarea
                id="content"
                placeholder="<h1>Hello {username}!</h1><p>Your email content here...</p>"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-500">Important</p>
                  <p className="text-muted-foreground">
                    Emails will be sent to all users in the selected group. This action cannot be undone.
                    Make sure Resend is configured in your backend.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSend} 
              disabled={isSending || !subject.trim() || !content.trim()}
              className="w-full"
            >
              {isSending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {targetLabels[targetGroup]}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Email History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails sent yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-auto">
                {history.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 rounded-lg bg-background/50 border border-border/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{email.subject}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {targetLabels[email.targetGroup] || email.targetGroup}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {email.recipientCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>by {email.sentBy}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(email.sentAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}