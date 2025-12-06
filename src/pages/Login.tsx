import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, LogIn, ArrowLeft, Mail, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import novaLogo from '@/assets/novaera-logo.png';
import heroBg from '@/assets/hero-bg.jpg';

export function Login() {
  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        toast({
          title: 'Welcome',
          description: `You have logged in as ${username}`,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Authentication Error',
          description: result.error || 'Incorrect username or password.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    if (regUsername.length < 3 || regUsername.length > 20) {
      toast({
        title: 'Error',
        description: 'Username must be between 3 and 20 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (regPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);

    try {
      const result = await apiService.register(regUsername, regEmail, regPassword);

      if (result.success) {
        toast({
          title: 'Account Created',
          description: 'Your account has been created successfully. You can now log in.',
        });
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
      } else {
        toast({
          title: 'Registration Error',
          description: result.error || 'Could not create account.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: 'Error',
        description: 'Could not connect to server.',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative z-10 p-12">
          <img src={novaLogo} alt="NovaEra" className="h-24 mb-6" />
          <h1 className="text-5xl font-display font-black text-gradient-cyan mb-4">NOVAERA</h1>
          <p className="text-xl text-muted-foreground max-w-md">
            The new era of gaming. Join thousands of players in the best gaming experience.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={novaLogo} alt="NovaEra" className="h-12" />
            <span className="text-2xl font-display font-bold text-gradient-cyan">NOVAERA</span>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4">
                <Gamepad2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-display">User Panel</CardTitle>
              <CardDescription>Access your account to manage your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-background/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button type="submit" className="w-full gap-2 glow-cyan" disabled={isLoading}>
                      <LogIn className="h-4 w-4" />
                      {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <a href="#" className="text-sm text-primary hover:underline">
                      Forgot your password?
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Username"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-10 bg-background/50"
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={isRegistering}>
                      {isRegistering ? 'Registering...' : 'Register'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
