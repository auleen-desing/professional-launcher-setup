import { Download, Monitor, HardDrive, Cpu, MemoryStick, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const requirements = [
  { icon: Monitor, label: 'Sistema Operativo', value: 'Windows 7/8/10/11' },
  { icon: Cpu, label: 'Procesador', value: 'Intel Core i3 o superior' },
  { icon: MemoryStick, label: 'Memoria RAM', value: '4 GB mínimo' },
  { icon: HardDrive, label: 'Almacenamiento', value: '5 GB de espacio libre' },
];

const downloadSteps = [
  'Descarga el launcher oficial',
  'Ejecuta el instalador como administrador',
  'Selecciona la carpeta de instalación',
  'Espera a que se descargue el cliente',
  '¡Crea tu cuenta y empieza a jugar!',
];

export function DownloadSection() {
  return (
    <section id="download" className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">Descarga el </span>
            <span className="text-gradient-gold">Launcher</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Instalación rápida y sencilla. En menos de 5 minutos estarás listo para comenzar tu aventura.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Download Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/20 rounded-2xl blur-lg" />
            <div className="relative bg-card border border-border rounded-2xl p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-4 animate-pulse-glow">
                  <Download className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">NovaEra Launcher</h3>
                <p className="text-muted-foreground">Versión 2.5.1 • 125 MB</p>
              </div>

              <Button 
                size="lg" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-gold-strong text-lg py-6 font-bold mb-6"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar Launcher
              </Button>

              <div className="space-y-3">
                {downloadSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Requisitos del Sistema
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {requirements.map((req) => (
                <div
                  key={req.label}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <req.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">{req.label}</span>
                  </div>
                  <span className="text-foreground font-semibold">{req.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h4 className="font-bold text-foreground mb-3">📝 Notas Importantes</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Desactiva el antivirus temporalmente durante la instalación</li>
                <li>• Ejecuta siempre el launcher como administrador</li>
                <li>• Se requiere conexión a internet estable</li>
                <li>• Para mejor rendimiento, usa DirectX 11</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
