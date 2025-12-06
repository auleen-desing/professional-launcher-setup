import { useState, useMemo } from 'react';
import { Search, Filter, MoreVertical, Ban, Coins, Eye, Mail, Shield, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { AdminUser } from '@/types/admin';

const statusColors = {
  active: 'bg-neon-green/20 text-neon-green border-neon-green/30',
  banned: 'bg-destructive/20 text-destructive border-destructive/30',
  suspended: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
};

const roleColors = {
  user: 'bg-muted text-muted-foreground',
  vip: 'bg-purple-500/20 text-purple-400',
  moderator: 'bg-blue-500/20 text-blue-400',
  admin: 'bg-destructive/20 text-destructive',
};

type SortOrder = 'none' | 'asc' | 'desc';

export function AdminUsers() {
  const { users, updateUserCoins, banUser, unbanUser } = useAdmin();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [coinsSortOrder, setCoinsSortOrder] = useState<SortOrder>('none');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [coinDialogOpen, setCoinDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinReason, setCoinReason] = useState('');
  const [coinType, setCoinType] = useState<'add' | 'remove'>('add');
  const [banReason, setBanReason] = useState('');

  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort by coins if sort order is set
    if (coinsSortOrder === 'asc') {
      result = [...result].sort((a, b) => a.coins - b.coins);
    } else if (coinsSortOrder === 'desc') {
      result = [...result].sort((a, b) => b.coins - a.coins);
    }

    return result;
  }, [users, searchQuery, statusFilter, coinsSortOrder]);

  const toggleCoinsSortOrder = () => {
    if (coinsSortOrder === 'none') {
      setCoinsSortOrder('desc');
    } else if (coinsSortOrder === 'desc') {
      setCoinsSortOrder('asc');
    } else {
      setCoinsSortOrder('none');
    }
  };

  const getSortIcon = () => {
    if (coinsSortOrder === 'desc') return <ArrowDown className="h-4 w-4 ml-1" />;
    if (coinsSortOrder === 'asc') return <ArrowUp className="h-4 w-4 ml-1" />;
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  };

  const handleCoinAction = () => {
    if (!selectedUser || !coinAmount || !coinReason) return;
    
    updateUserCoins(selectedUser.id, parseInt(coinAmount), coinType, coinReason);
    toast({
      title: coinType === 'add' ? 'Coins añadidos' : 'Coins removidos',
      description: `Se han ${coinType === 'add' ? 'añadido' : 'removido'} ${coinAmount} coins a ${selectedUser.username}`,
    });
    setCoinDialogOpen(false);
    setCoinAmount('');
    setCoinReason('');
  };

  const handleBanAction = () => {
    if (!selectedUser || !banReason) return;
    
    if (selectedUser.status === 'banned') {
      unbanUser(selectedUser.id);
      toast({ title: 'Usuario desbaneado', description: `${selectedUser.username} ha sido desbaneado` });
    } else {
      banUser(selectedUser.id, banReason);
      toast({ title: 'Usuario baneado', description: `${selectedUser.username} ha sido baneado`, variant: 'destructive' });
    }
    setBanDialogOpen(false);
    setBanReason('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-2">Administra todos los usuarios del servidor</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="banned">Baneados</SelectItem>
            <SelectItem value="suspended">Suspendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/50">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Usuario</th>
                  <th className="p-4 font-medium">
                    <button 
                      onClick={toggleCoinsSortOrder}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      NovaCoins
                      {getSortIcon()}
                    </button>
                  </th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium">Rol</th>
                  <th className="p-4 font-medium">Último acceso</th>
                  <th className="p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-display font-bold text-primary">{user.coins.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={statusColors[user.status]}>
                        {user.status === 'active' ? 'Activo' : user.status === 'banned' ? 'Baneado' : 'Suspendido'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={roleColors[user.role]}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setCoinDialogOpen(true); }}>
                            <Coins className="h-4 w-4 mr-2" />
                            Gestionar Coins
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar mensaje
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => { setSelectedUser(user); setBanDialogOpen(true); }}
                            className={user.status === 'banned' ? 'text-neon-green' : 'text-destructive'}
                          >
                            {user.status === 'banned' ? (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Desbanear
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Banear
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Coin Dialog */}
      <Dialog open={coinDialogOpen} onOpenChange={setCoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar NovaCoins</DialogTitle>
            <DialogDescription>
              {selectedUser && `Usuario: ${selectedUser.username} - Actual: ${selectedUser.coins.toLocaleString()} coins`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={coinType === 'add' ? 'default' : 'outline'}
                onClick={() => setCoinType('add')}
                className="flex-1"
              >
                Añadir
              </Button>
              <Button
                variant={coinType === 'remove' ? 'destructive' : 'outline'}
                onClick={() => setCoinType('remove')}
                className="flex-1"
              >
                Quitar
              </Button>
            </div>
            <Input
              type="number"
              placeholder="Cantidad de coins"
              value={coinAmount}
              onChange={(e) => setCoinAmount(e.target.value)}
            />
            <Input
              placeholder="Razón (ej: Premio evento, Penalización...)"
              value={coinReason}
              onChange={(e) => setCoinReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCoinDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCoinAction} className={coinType === 'remove' ? 'bg-destructive' : ''}>
              {coinType === 'add' ? 'Añadir' : 'Quitar'} Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === 'banned' ? 'Desbanear Usuario' : 'Banear Usuario'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `Usuario: ${selectedUser.username}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Razón del baneo/desbaneo"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleBanAction}
              variant={selectedUser?.status === 'banned' ? 'default' : 'destructive'}
            >
              {selectedUser?.status === 'banned' ? 'Desbanear' : 'Banear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
