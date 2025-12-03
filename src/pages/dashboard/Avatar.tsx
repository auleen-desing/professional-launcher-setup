import { useState } from 'react';
import { User, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const defaultAvatars = [
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
];

export function Avatar() {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!selectedAvatar) {
      toast({
        title: 'Error',
        description: 'Please select an avatar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with your API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Avatar updated',
        description: 'Your avatar has been changed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not update the avatar.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Change Avatar</h1>
        <p className="text-muted-foreground mt-2">Customise your profile picture</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Avatar */}
        <Card>
          <CardHeader>
            <CardTitle>Current Avatar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30">
              <User className="h-16 w-16 text-primary" />
            </div>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload image
            </Button>
          </CardContent>
        </Card>

        {/* Avatar Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Available Avatars</CardTitle>
            <CardDescription>Select one of the preset avatars</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {defaultAvatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative w-16 h-16 rounded-full bg-muted overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar 
                      ? 'border-primary ring-2 ring-primary/30' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full mt-6"
              disabled={!selectedAvatar || isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Avatar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
