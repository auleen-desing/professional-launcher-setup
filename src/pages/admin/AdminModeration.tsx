import { useState } from 'react';
import { Shield, Ban, AlertTriangle, Clock, Search, UserX, MessageSquare, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';

const actionColors = {
  ban: 'bg-destructive/20 text-destructive border-destructive/30',
  unban: 'bg-neon-green/20 text-neon-green border-neon-green/30',
  suspend: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  warn: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  mute: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function AdminModeration() {
  const { users, modActions, banUser, unbanUser } = useAdmin();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [actionType, setActionType] = useState<'ban' | 'suspend' | 'warn' | 'mute'>('ban');
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('');

  const bannedUsers = users.filter(u => u.status === 'banned');
  const suspendedUsers = users.filter(u => u.status === 'suspended');

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = () => {
    if (!selectedUserId || !actionReason) {
      toast({ title: 'Error', description: 'Completa todos los campos', variant: 'destructive' });
      return;
    }

    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    if (actionType === 'ban') {
      banUser(selectedUserId, actionReason);
      toast({ title: 'Usuario baneado', description: `${user.username} ha sido baneado`, variant: 'destructive' });
    } else {
      toast({ title: 'Acción aplicada', description: `${actionType} aplicado a ${user.username}` });
    }

    setActionDialogOpen(false);
    setActionReason('');
    setActionDuration('');
  };

  const handleUnban = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    unbanUser(userId);
    toast({ title: 'Usuario desbaneado', description: `${user.username} ha sido desbaneado` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Moderación</h1>
        <p className="text-muted-foreground mt-2">Gestiona sanciones y acciones de moderación</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/20">
              <Ban className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{bannedUsers.length}</p>
              <p className="text-sm text-muted-foreground">Baneados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{suspendedUsers.length}</p>
              <p className="text-sm text-muted-foreground">Suspendidos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{modActions.filter(a => a.action === 'warn').length}</p>
              <p className="text-sm text-muted-foreground">Advertencias</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{modActions.length}</p>
              <p className="text-sm text-muted-foreground">Acciones Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="actions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="actions" className="gap-2">
            <Shield className="h-4 w-4" />
            Nueva Acción
          </TabsTrigger>
          <TabsTrigger value="banned" className="gap-2">
            <Ban className="h-4 w-4" />
            Baneados ({bannedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actions">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Aplicar Sanción</CardTitle>
              <CardDescription>Busca un usuario y aplica una acción de moderación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchQuery && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {filteredUsers.slice(0, 10).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {user.username[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.status === 'banned' ? '🚫 Baneado' : user.status === 'suspended' ? '⏸️ Suspendido' : '✅ Activo'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {user.status !== 'banned' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setActionType('ban');
                              setActionDialogOpen(true);
                            }}
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        )}
                        {user.status === 'banned' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-neon-green border-neon-green/30"
                            onClick={() => handleUnban(user.id)}
                          >
                            Desbanear
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banned">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Usuarios Baneados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bannedUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay usuarios baneados</p>
                ) : (
                  bannedUsers.map((user) => {
                    const banAction = modActions.find(a => a.userId === user.id && a.action === 'ban');
                    return (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                            <UserX className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.username}</p>
                            <p className="text-sm text-muted-foreground">{banAction?.reason || 'Sin razón especificada'}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {banAction && `Baneado: ${new Date(banAction.createdAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => handleUnban(user.id)}>
                          Desbanear
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Historial de Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={actionColors[action.action]}>
                        {action.action.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-medium text-foreground">{action.username}</p>
                        <p className="text-sm text-muted-foreground">{action.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">por {action.adminName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(action.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Sanción</DialogTitle>
            <DialogDescription>
              Usuario: {users.find(u => u.id === selectedUserId)?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de acción</label>
              <Select value={actionType} onValueChange={(v) => setActionType(v as typeof actionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ban">Baneo permanente</SelectItem>
                  <SelectItem value="suspend">Suspensión temporal</SelectItem>
                  <SelectItem value="warn">Advertencia</SelectItem>
                  <SelectItem value="mute">Silenciar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(actionType === 'suspend' || actionType === 'mute') && (
              <div>
                <label className="text-sm font-medium mb-2 block">Duración</label>
                <Select value={actionDuration} onValueChange={setActionDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar duración" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 hora</SelectItem>
                    <SelectItem value="24h">24 horas</SelectItem>
                    <SelectItem value="7d">7 días</SelectItem>
                    <SelectItem value="30d">30 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Razón</label>
              <Textarea
                placeholder="Describe la razón de la sanción..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleAction}>Aplicar Sanción</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
