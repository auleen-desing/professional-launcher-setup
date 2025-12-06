import { Users, Coins, TrendingUp, Ticket, Ban, UserPlus, DollarSign, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdmin } from '@/contexts/AdminContext';

export function AdminDashboard() {
  const { stats, transactions, modActions, isLoading } = useAdmin();

  const statCards = [
    { title: 'Usuarios Totales', value: stats.totalUsers.toLocaleString(), icon: Users, change: '+12%', color: 'from-blue-500 to-cyan-500' },
    { title: 'Jugadores Online', value: stats.onlinePlayers.toLocaleString(), icon: Activity, change: '+5%', color: 'from-green-500 to-emerald-500' },
    { title: 'Ingresos del Mes', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, change: '+23%', color: 'from-yellow-500 to-orange-500' },
    { title: 'Tickets Abiertos', value: stats.ticketsOpen.toString(), icon: Ticket, change: '-8%', color: 'from-purple-500 to-pink-500' },
    { title: 'Nuevos Hoy', value: stats.newUsersToday.toString(), icon: UserPlus, change: '+15%', color: 'from-cyan-500 to-blue-500' },
    { title: 'Usuarios Baneados', value: stats.bannedUsers.toString(), icon: Ban, change: '+2', color: 'from-red-500 to-rose-500' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Panel de Administración</h1>
          <p className="text-muted-foreground mt-2">Cargando datos...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Panel de Administración</h1>
        <p className="text-muted-foreground mt-2">Bienvenido al centro de control de NovaEra</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-display font-bold text-foreground mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-neon-green' : 'text-destructive'}`}>
                    {stat.change} vs mes anterior
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Transacciones Recientes
            </CardTitle>
            <CardDescription>Últimos movimientos de NovaCoins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No hay transacciones</p>
              ) : (
                transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${tx.type === 'add' ? 'bg-neon-green' : 'bg-destructive'}`} />
                      <div>
                        <p className="font-medium text-foreground">{tx.username}</p>
                        <p className="text-xs text-muted-foreground">{tx.reason}</p>
                      </div>
                    </div>
                    <span className={`font-display font-bold ${tx.type === 'add' ? 'text-neon-green' : 'text-destructive'}`}>
                      {tx.type === 'add' ? '+' : '-'}{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Mod Actions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Acciones de Moderación
            </CardTitle>
            <CardDescription>Últimas acciones tomadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modActions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No hay acciones de moderación</p>
              ) : (
                modActions.slice(0, 5).map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        action.action === 'ban' ? 'bg-destructive/20 text-destructive' :
                        action.action === 'unban' ? 'bg-neon-green/20 text-neon-green' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {action.action.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{action.username}</p>
                        <p className="text-xs text-muted-foreground">{action.reason}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      por {action.adminName}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
