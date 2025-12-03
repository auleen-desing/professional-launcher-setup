import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Coins, Package, Wand2 } from 'lucide-react';
import { API_CONFIG } from '@/config/api';

const rates = [
  { 
    label: 'EXP Rate', 
    value: `x${API_CONFIG.RATES.EXP}`, 
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10'
  },
  { 
    label: 'Gold Rate', 
    value: `x${API_CONFIG.RATES.GOLD}`, 
    icon: Coins,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10'
  },
  { 
    label: 'Drop Rate', 
    value: `x${API_CONFIG.RATES.DROP}`, 
    icon: Package,
    color: 'text-green-400',
    bg: 'bg-green-500/10'
  },
  { 
    label: 'Rep Rate', 
    value: `x${API_CONFIG.RATES.REP}`, 
    icon: Wand2,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10'
  },
];

export function ServerRates() {
  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Server Rates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {rates.map((rate) => (
            <div
              key={rate.label}
              className={`flex items-center gap-3 p-3 rounded-lg ${rate.bg} border border-border/30`}
            >
              <rate.icon className={`h-5 w-5 ${rate.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{rate.label}</p>
                <p className={`font-bold ${rate.color}`}>{rate.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
