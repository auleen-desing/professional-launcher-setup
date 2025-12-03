import { useState } from 'react';
import { Bug, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function Unbug() {
  const [characterName, setCharacterName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleUnbug = async () => {
    if (!characterName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your character name.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with your API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccess(true);
      toast({
        title: 'Character unstuck',
        description: `The character "${characterName}" has been reset successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not unstuck the character. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">Unstuck Character</h1>
        <p className="text-muted-foreground mt-2">Reset your character if it is stuck</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Bug className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Unstuck Character</CardTitle>
                <CardDescription>Enter the exact name of your character</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <p className="text-lg font-medium">Character unstuck!</p>
                <p className="text-muted-foreground">You can now reconnect to the game.</p>
                <Button variant="outline" onClick={() => setSuccess(false)}>
                  Unstuck another character
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Character name"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                />
                <Button 
                  onClick={handleUnbug} 
                  className="w-full gap-2"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Processing...' : 'Unstuck'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Important</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>Before using this feature, please note:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>The character must be <strong>disconnected</strong> from the game</li>
              <li>This action will teleport the character to the starting city</li>
              <li>It may take a few seconds to apply</li>
              <li>Only use this if you are having trouble connecting</li>
              <li>There is a 5 minute cooldown between uses</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
