import { BarChart3, Users, Coins, TrendingUp, Calendar, DollarSign, Activity, PieChart, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdmin } from '@/contexts/AdminContext';

export function AdminStats() {
  const { stats, users, transactions, isLoading } = useAdmin();

  // Chart data
  const weeklyData = [
    { day: 'Lun', users: 120, revenue: 450 },
    { day: 'Mar', users: 145, revenue: 520 },
    { day: 'Mié', users: 132, revenue: 480 },
    { day: 'Jue', users: 158, revenue: 620 },
    { day: 'Vie', users: 189, revenue: 780 },
    { day: 'Sáb', users: 210, revenue: 890 },
    { day: 'Dom', users: 185, revenue: 720 },
  ];

  const userDistribution = [
    { role: 'Usuario', count: users.filter(u => u.role === 'user').length, color: 'bg-blue-500' },
    { role: 'VIP', count: users.filter(u => u.role === 'vip').length, color: 'bg-purple-500' },
    { role: 'Moderador', count: users.filter(u => u.role === 'moderator').length, color: 'bg-cyan-500' },
    { role: 'Admin', count: users.filter(u => u.role === 'admin').length, color: 'bg-destructive' },
  ];

  const maxUsers = Math.max(...weeklyData.map(d => d.users));
  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Estadísticas</h1>
          <p className="text-muted-foreground mt-2">Cargando datos...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Estadísticas</h1>
        <p className="text-muted-foreground mt-2">Análisis detallado del servidor</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Totales</p>
                <p className="text-3xl font-display font-bold">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-neon-green">+{stats.newUsersToday} hoy</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jugadores Online</p>
                <p className="text-3xl font-display font-bold">{stats.onlinePlayers.toLocaleString()}</p>
                <p className="text-sm text-neon-green">Peak: 3,241</p>
              </div>
              <div className="p-3 rounded-xl bg-neon-green/20">
                <Activity className="h-6 w-6 text-neon-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                <p className="text-3xl font-display font-bold">${stats.revenue.toLocaleString()}</p>
                <p className="text-sm text-neon-green">+23% vs anterior</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coins en Circulación</p>
                <p className="text-3xl font-display font-bold">{(stats.totalCoins / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-muted-foreground">+2.3M esta semana</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/20">
                <Coins className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Actividad Semanal
            </CardTitle>
            <CardDescription>Usuarios nuevos e ingresos por día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Users Chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Usuarios Nuevos</span>
                  <span className="text-sm font-medium text-primary">
                    Total: {weeklyData.reduce((acc, d) => acc + d.users, 0)}
                  </span>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {weeklyData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                        style={{ height: `${(d.users / maxUsers) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Ingresos ($)</span>
                  <span className="text-sm font-medium text-neon-green">
                    Total: ${weeklyData.reduce((acc, d) => acc + d.revenue, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {weeklyData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-neon-green/80 rounded-t transition-all hover:bg-neon-green"
                        style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Distribución de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userDistribution.map((item) => (
                <div key={item.role} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{item.role}</span>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${(item.count / users.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{stats.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Activos (30d)</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-destructive">{stats.bannedUsers}</p>
                  <p className="text-xs text-muted-foreground">Baneados</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Últimas Transacciones de Coins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/50">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-3 font-medium">Usuario</th>
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Cantidad</th>
                  <th className="p-3 font-medium">Razón</th>
                  <th className="p-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="border-b border-border/30">
                    <td className="p-3 font-medium">{tx.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.type === 'add' ? 'bg-neon-green/20 text-neon-green' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {tx.type === 'add' ? 'AÑADIDO' : 'REMOVIDO'}
                      </span>
                    </td>
                    <td className={`p-3 font-display font-bold ${
                      tx.type === 'add' ? 'text-neon-green' : 'text-destructive'
                    }`}>
                      {tx.type === 'add' ? '+' : '-'}{tx.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-muted-foreground">{tx.reason}</td>
                    <td className="p-3 text-muted-foreground text-sm">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
