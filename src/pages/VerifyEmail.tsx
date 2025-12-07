import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import novaLogo from '@/assets/novaera-logo.png';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided.');
        return;
      }

      try {
        const response = await apiService.verifyEmail(token);
        
        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully!');
          setUsername(response.data?.username || '');
        } else {
          if (response.error?.includes('expired')) {
            setStatus('expired');
          } else {
            setStatus('error');
          }
          setMessage(response.error || 'Verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Could not connect to server.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img src={novaLogo} alt="NovaEra" className="h-16" />
            </div>
            <CardTitle className="text-2xl font-display">Email Verification</CardTitle>
            <CardDescription>Verifying your NovaEra account</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            {status === 'loading' && (
              <div className="space-y-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
                <p className="text-muted-foreground">Verifying your email...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-500 mb-2">Email Verified!</h3>
                  <p className="text-muted-foreground mb-1">{message}</p>
                  {username && (
                    <p className="text-sm text-muted-foreground">
                      Welcome, <span className="text-primary font-semibold">{username}</span>!
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => navigate('/login')} 
                  className="w-full mt-4 glow-cyan"
                >
                  Go to Login
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-destructive mb-2">Verification Failed</h3>
                  <p className="text-muted-foreground">{message}</p>
                </div>
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                  className="w-full mt-4"
                >
                  Go to Login
                </Button>
              </div>
            )}

            {status === 'expired' && (
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Mail className="h-12 w-12 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-500 mb-2">Link Expired</h3>
                  <p className="text-muted-foreground">{message}</p>
                </div>
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                  className="w-full mt-4"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
