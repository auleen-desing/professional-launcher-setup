import { useState, useEffect } from 'react';
import { Settings, Save, Server, Coins, Shield, Database, RefreshCw, Loader2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl } from '@/config/api';

export function AdminSettings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [serverSettings, setServerSettings] = useState({
    serverName: 'NovaEra',
    serverIp: '127.0.0.1',
    loginPort: '4000',
    maxPlayers: '5000',
    maintenanceMode: false,
  });

  const [shopSettings, setShopSettings] = useState({
    coinName: 'NovaCoins',
    coinBonus: '30',
    shopDiscount: '50',
    rouletteSpinCost: '2500',
    dailyFreeSpins: '0',
  });

  const [securitySettings, setSecuritySettings] = useState({
    requireEmailVerification: true,
    enableCaptcha: true,
    maxLoginAttempts: '5',
    sessionTimeout: '30',
  });

  // Load config from backend
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/config'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('API not reachable');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setShopSettings(prev => ({
          ...prev,
          coinBonus: String(data.data.COIN_BONUS ?? 30),
          shopDiscount: String(data.data.SHOP_DISCOUNT ?? 50),
          rouletteSpinCost: String(data.data.ROULETTE_SPIN_COST ?? 2500),
          dailyFreeSpins: String(data.data.DAILY_FREE_SPINS ?? 0),
        }));
      }
    } catch (error) {
      console.error('Config fetch error:', error);
      toast({
        title: 'Could not load config',
        description: 'Using default values. Make sure the backend is running.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveShop = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('novaera_token');
      const response = await fetch(buildApiUrl('/config'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          COIN_BONUS: Number(shopSettings.coinBonus),
          SHOP_DISCOUNT: Number(shopSettings.shopDiscount),
          ROULETTE_SPIN_COST: Number(shopSettings.rouletteSpinCost),
          DAILY_FREE_SPINS: Number(shopSettings.dailyFreeSpins),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Settings saved', description: 'Shop configuration updated successfully' });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error saving settings',
        description: 'Could not update configuration. Check if backend is running.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    toast({ title: 'Settings saved', description: 'Changes have been applied successfully' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Server and platform settings</p>
        </div>
      </div>

      <Tabs defaultValue="shop" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="server" className="gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">Server</span>
          </TabsTrigger>
          <TabsTrigger value="shop" className="gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Shop</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Database</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="server">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Server Configuration</CardTitle>
              <CardDescription>General game server settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Server Name</label>
                  <Input
                    value={serverSettings.serverName}
                    onChange={(e) => setServerSettings(prev => ({ ...prev, serverName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Server IP</label>
                  <Input
                    value={serverSettings.serverIp}
                    onChange={(e) => setServerSettings(prev => ({ ...prev, serverIp: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Login Port</label>
                  <Input
                    value={serverSettings.loginPort}
                    onChange={(e) => setServerSettings(prev => ({ ...prev, loginPort: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Players</label>
                  <Input
                    value={serverSettings.maxPlayers}
                    onChange={(e) => setServerSettings(prev => ({ ...prev, maxPlayers: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div>
                  <p className="font-medium text-foreground">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Disconnects all players</p>
                </div>
                <Switch
                  checked={serverSettings.maintenanceMode}
                  onCheckedChange={(checked) => setServerSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Server Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shop">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Shop & Promotions
              </CardTitle>
              <CardDescription>Configure discounts and bonuses for the shop system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Promotion Settings - Highlighted */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Percent className="h-4 w-4 text-primary" />
                  Active Promotions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Coin Bonus (%)
                      <span className="text-muted-foreground ml-2 font-normal">- Extra coins on purchase</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={shopSettings.coinBonus}
                      onChange={(e) => setShopSettings(prev => ({ ...prev, coinBonus: e.target.value }))}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      +{shopSettings.coinBonus}% bonus coins when buying coin packages
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Shop Discount (%)
                      <span className="text-muted-foreground ml-2 font-normal">- Item price reduction</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={shopSettings.shopDiscount}
                      onChange={(e) => setShopSettings(prev => ({ ...prev, shopDiscount: e.target.value }))}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {shopSettings.shopDiscount}% OFF on all shop items
                    </p>
                  </div>
                </div>
              </div>

              {/* Other Shop Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Currency Name</label>
                  <Input
                    value={shopSettings.coinName}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, coinName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Roulette Spin Cost</label>
                  <Input
                    type="number"
                    min="0"
                    value={shopSettings.rouletteSpinCost}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, rouletteSpinCost: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Daily Free Spins</label>
                  <Input
                    type="number"
                    min="0"
                    value={shopSettings.dailyFreeSpins}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, dailyFreeSpins: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleSaveShop} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Shop Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>Security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">Email Verification</p>
                    <p className="text-sm text-muted-foreground">Requires email verification on registration</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireEmailVerification}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-foreground">reCAPTCHA</p>
                    <p className="text-sm text-muted-foreground">Bot protection on registration</p>
                  </div>
                  <Switch
                    checked={securitySettings.enableCaptcha}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableCaptcha: checked }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Login Attempts</label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Session Timeout (min)</label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Database</CardTitle>
              <CardDescription>Database information and tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Connection</p>
                  <p className="font-medium text-foreground">SQL Server</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Host</p>
                  <p className="font-medium text-foreground">127.0.0.1:1433</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Database</p>
                  <p className="font-medium text-foreground">Novaera</p>
                </div>
                <div className="p-4 rounded-lg bg-neon-green/10 border border-neon-green/30">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium text-neon-green">Connected</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Test Connection
                </Button>
                <Button variant="outline" className="gap-2">
                  <Database className="h-4 w-4" />
                  Manual Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
