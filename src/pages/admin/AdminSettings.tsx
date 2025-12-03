import { useState } from 'react';
import { Settings, Save, Server, Coins, Shield, Bell, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export function AdminSettings() {
  const { toast } = useToast();
  
  const [serverSettings, setServerSettings] = useState({
    serverName: 'NovaEra',
    serverIp: '127.0.0.1',
    loginPort: '4000',
    maxPlayers: '5000',
    maintenanceMode: false,
  });

  const [shopSettings, setShopSettings] = useState({
    coinName: 'NovaCoins',
    discount: '0',
    shopBonus: '0',
    fortuneWheelCost: '2500',
    dailyFreeSpins: '0',
  });

  const [securitySettings, setSecuritySettings] = useState({
    requireEmailVerification: true,
    enableCaptcha: true,
    maxLoginAttempts: '5',
    sessionTimeout: '30',
  });

  const handleSave = () => {
    toast({ title: 'Configuración guardada', description: 'Los cambios se han aplicado correctamente' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-2">Ajustes del servidor y la plataforma</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="server" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="server" className="gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">Servidor</span>
          </TabsTrigger>
          <TabsTrigger value="shop" className="gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Tienda</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Base de Datos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="server">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Configuración del Servidor</CardTitle>
              <CardDescription>Ajustes generales del servidor de juego</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nombre del Servidor</label>
                  <Input
                    value={serverSettings.serverName}
                    onChange={(e) => setServerSettings(prev => ({ ...prev, serverName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">IP del Servidor</label>
                  <Input
                    value={serverSettings.serverIp}
                    onChange={(e) => setServerSettings(prev => ({ ...prev, serverIp: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Puerto de Login</label>
                  <Input
                    value={serverSettings.loginPort}
                    onChange={(e) => setServerSettings(prev => ({ ...prev, loginPort: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Máximo de Jugadores</label>
                  <Input
                    value={serverSettings.maxPlayers}
                    onChange={(e) => setServerSettings(prev => ({ ...prev, maxPlayers: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div>
                  <p className="font-medium text-foreground">Modo Mantenimiento</p>
                  <p className="text-sm text-muted-foreground">Desconecta a todos los jugadores</p>
                </div>
                <Switch
                  checked={serverSettings.maintenanceMode}
                  onCheckedChange={(checked) => setServerSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shop">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Configuración de Tienda</CardTitle>
              <CardDescription>Ajustes de la tienda y sistema de coins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nombre de la Moneda</label>
                  <Input
                    value={shopSettings.coinName}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, coinName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Descuento Global (%)</label>
                  <Input
                    type="number"
                    value={shopSettings.discount}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, discount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bonus de Tienda (%)</label>
                  <Input
                    type="number"
                    value={shopSettings.shopBonus}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, shopBonus: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Costo Giro Ruleta</label>
                  <Input
                    type="number"
                    value={shopSettings.fortuneWheelCost}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, fortuneWheelCost: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Ajustes de seguridad y autenticación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Verificación de Email</p>
                    <p className="text-sm text-muted-foreground">Requiere verificar email al registrarse</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireEmailVerification}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">reCAPTCHA</p>
                    <p className="text-sm text-muted-foreground">Protección contra bots en el registro</p>
                  </div>
                  <Switch
                    checked={securitySettings.enableCaptcha}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableCaptcha: checked }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Intentos de Login Máximos</label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Timeout de Sesión (min)</label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Base de Datos</CardTitle>
              <CardDescription>Información y herramientas de la base de datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Conexión</p>
                  <p className="font-medium text-foreground">SQL Server</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Host</p>
                  <p className="font-medium text-foreground">127.0.0.1:1433</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Base de Datos</p>
                  <p className="font-medium text-foreground">Novaera</p>
                </div>
                <div className="p-4 rounded-lg bg-neon-green/10 border border-neon-green/30">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-medium text-neon-green">Conectado</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Test Conexión
                </Button>
                <Button variant="outline" className="gap-2">
                  <Database className="h-4 w-4" />
                  Backup Manual
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
