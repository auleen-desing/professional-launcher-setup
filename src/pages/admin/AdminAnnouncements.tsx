import { useState } from 'react';
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff, Calendar, AlertTriangle, Info, Wrench, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { Announcement } from '@/types/admin';

const typeConfig = {
  info: { label: 'Información', icon: Info, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  warning: { label: 'Advertencia', icon: AlertTriangle, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  event: { label: 'Evento', icon: Sparkles, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  maintenance: { label: 'Mantenimiento', icon: Wrench, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  update: { label: 'Actualización', icon: Megaphone, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', color: 'bg-blue-500/20 text-blue-400' },
  high: { label: 'Alta', color: 'bg-destructive/20 text-destructive' },
};

export function AdminAnnouncements() {
  const { announcements, createAnnouncement, deleteAnnouncement, toggleAnnouncement } = useAdmin();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Announcement['type']>('info');
  const [priority, setPriority] = useState<Announcement['priority']>('normal');
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('info');
    setPriority('normal');
    setActive(true);
    setExpiresAt('');
    setEditingAnnouncement(null);
  };

  const handleCreate = () => {
    if (!title || !content) {
      toast({ title: 'Error', description: 'Completa título y contenido', variant: 'destructive' });
      return;
    }

    createAnnouncement({
      title,
      content,
      type,
      priority,
      active,
      expiresAt: expiresAt || undefined,
    });

    toast({ title: 'Anuncio creado', description: 'El anuncio se ha publicado correctamente' });
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteAnnouncement(id);
    toast({ title: 'Anuncio eliminado', description: 'El anuncio se ha eliminado correctamente' });
  };

  const handleToggle = (id: string) => {
    toggleAnnouncement(id);
    toast({ title: 'Estado actualizado', description: 'El estado del anuncio ha sido actualizado' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Anuncios</h1>
          <p className="text-muted-foreground mt-2">Gestiona los anuncios del servidor</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Anuncio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-neon-green/20">
              <Eye className="h-5 w-5 text-neon-green" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{announcements.filter(a => a.active).length}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-muted">
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{announcements.filter(a => !a.active).length}</p>
              <p className="text-sm text-muted-foreground">Inactivos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{announcements.filter(a => a.type === 'event').length}</p>
              <p className="text-sm text-muted-foreground">Eventos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => {
          const typeInfo = typeConfig[announcement.type];
          const TypeIcon = typeInfo.icon;
          const priorityInfo = priorityConfig[announcement.priority];

          return (
            <Card key={announcement.id} className={`border-border/50 ${!announcement.active && 'opacity-60'}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-xl ${typeInfo.color.split(' ')[0]}`}>
                      <TypeIcon className={`h-5 w-5 ${typeInfo.color.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-display font-semibold text-foreground">{announcement.title}</h3>
                        <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                        <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                        {!announcement.active && (
                          <Badge variant="outline" className="bg-muted">Inactivo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{announcement.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {announcement.createdAt}
                        </span>
                        {announcement.expiresAt && (
                          <span>Expira: {announcement.expiresAt}</span>
                        )}
                        <span>Por: {announcement.author}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={announcement.active}
                      onCheckedChange={() => handleToggle(announcement.id)}
                    />
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Anuncio</DialogTitle>
            <DialogDescription>
              Completa los campos para publicar un nuevo anuncio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título del anuncio"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Contenido del anuncio..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={type} onValueChange={(v) => setType(v as Announcement['type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Prioridad</label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Announcement['priority'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Fecha de expiración (opcional)</label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <label className="text-sm">Publicar inmediatamente</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Publicar Anuncio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
