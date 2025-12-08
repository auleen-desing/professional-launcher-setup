import { useState } from 'react';
import { Coins, Search, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function AdminCoins() {
  const { users, transactions, updateUserCoins, stats, refreshData } = useAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [selfAmount, setSelfAmount] = useState('');
  const [isAddingSelf, setIsAddingSelf] = useState(false);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find current admin user in the users list
  const currentAdminUser = users.find(u => u.id === String(user?.id));

  const handleAddToSelf = async () => {
    if (!selfAmount || parseInt(selfAmount) <= 0) {
      toast({ title: 'Error', description: 'Ingresa una cantidad válida', variant: 'destructive' });
      return;
    }
    if (!user?.id) {
      toast({ title: 'Error', description: 'No se encontró tu usuario', variant: 'destructive' });
      return;
    }
    
    setIsAddingSelf(true);
    try {
      await updateUserCoins(String(user.id), parseInt(selfAmount), 'add', 'Admin self-grant');
      toast({ title: 'Coins añadidos', description: `+${selfAmount} coins a tu cuenta` });
      setSelfAmount('');
      await refreshData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron añadir los coins', variant: 'destructive' });
    } finally {
      setIsAddingSelf(false);
    }
  };

  const handleQuickAdd = async (userId: string, username: string) => {
    if (!amount || !reason) {
      toast({ title: 'Error', description: 'Completa cantidad y razón', variant: 'destructive' });
      return;
    }
    await updateUserCoins(userId, parseInt(amount), 'add', reason);
    toast({ title: 'Coins añadidos', description: `+${amount} coins a ${username}` });
    setAmount('');
    setReason('');
  };

  const handleQuickRemove = async (userId: string, username: string) => {
    if (!amount || !reason) {
      toast({ title: 'Error', description: 'Completa cantidad y razón', variant: 'destructive' });
      return;
    }
    await updateUserCoins(userId, parseInt(amount), 'remove', reason);
    toast({ title: 'Coins removidos', description: `-${amount} coins de ${username}`, variant: 'destructive' });
    setAmount('');
    setReason('');
  };

  const todayTransactions = transactions.filter(tx => {
    const today = new Date().toDateString();
    return new Date(tx.createdAt).toDateString() === today;
  });

  const todayAdded = todayTransactions.filter(tx => tx.type === 'add').reduce((acc, tx) => acc + tx.amount, 0);
  const todayRemoved = todayTransactions.filter(tx => tx.type === 'remove').reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Gestión de NovaCoins</h1>
        <p className="text-muted-foreground mt-2">Añade o quita coins a los usuarios</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total en Circulación</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {stats.totalCoins.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-neon-green/20">
                <TrendingUp className="h-6 w-6 text-neon-green" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Añadidos Hoy</p>
                <p className="text-2xl font-display font-bold text-neon-green">
                  +{todayAdded.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-destructive/20">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Removidos Hoy</p>
                <p className="text-2xl font-display font-bold text-destructive">
                  -{todayRemoved.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Self Add */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Añadir a Mi Cuenta
          </CardTitle>
          <CardDescription>
            Tu balance actual: <span className="text-primary font-bold">{currentAdminUser?.coins?.toLocaleString() || user?.coins?.toLocaleString() || 0}</span> coins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Cantidad de coins"
              value={selfAmount}
              onChange={(e) => setSelfAmount(e.target.value)}
              className="max-w-[200px]"
            />
            <Button 
              onClick={handleAddToSelf}
              disabled={isAddingSelf || !selfAmount}
              className="gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              {isAddingSelf ? 'Añadiendo...' : 'Añadir Coins'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Action */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Acción Rápida</CardTitle>
            <CardDescription>Busca un usuario y modifica sus coins</CardDescription>
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
              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUserId === user.id ? 'bg-primary/20 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {user.username[0]}
                      </div>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <span className="text-primary font-display font-bold">{user.coins.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedUserId && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Input
                    placeholder="Razón"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      const user = users.find(u => u.id === selectedUserId);
                      if (user) handleQuickAdd(user.id, user.username);
                    }}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Añadir
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => {
                      const user = users.find(u => u.id === selectedUserId);
                      if (user) handleQuickRemove(user.id, user.username);
                    }}
                  >
                    <ArrowDownRight className="h-4 w-4" />
                    Quitar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Historial de Transacciones</CardTitle>
            <CardDescription>Últimas modificaciones de coins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'add' ? 'bg-neon-green/20' : 'bg-destructive/20'
                    }`}>
                      {tx.type === 'add' ? (
                        <ArrowUpRight className="h-5 w-5 text-neon-green" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{tx.username}</p>
                      <p className="text-xs text-muted-foreground">{tx.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-display font-bold ${
                      tx.type === 'add' ? 'text-neon-green' : 'text-destructive'
                    }`}>
                      {tx.type === 'add' ? '+' : '-'}{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
