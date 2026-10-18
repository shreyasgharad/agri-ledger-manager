import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const { signIn, signUp, user, role, enforced } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && (role === 'admin' || role === 'staff' || role === 'viewer')) return <Navigate to="/" replace />;

  const run = async (kind: 'in' | 'up') => {
    setBusy(true);
    const { error } = kind === 'in' ? await signIn(email, password) : await signUp(email, password, fullName);
    setBusy(false);
    if (error) {
      toast({ title: kind === 'in' ? 'Could not sign in' : 'Could not sign up', description: error.message, variant: 'destructive' });
    } else if (kind === 'up') {
      toast({ title: 'Account created', description: 'If asked, confirm the email we sent, then sign in.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-agri-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-agri-green-700">AgriAggregator</CardTitle>
          <CardDescription>
            {enforced
              ? 'Sign in to continue.'
              : 'Logins are not switched on yet. The first person to sign up becomes the admin.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="in">
            <TabsList className="grid grid-cols-2 w-full h-12">
              <TabsTrigger value="in" className="h-10">Sign in</TabsTrigger>
              <TabsTrigger value="up" className="h-10">Sign up</TabsTrigger>
            </TabsList>
            {(['in', 'up'] as const).map((kind) => (
              <TabsContent key={kind} value={kind} className="space-y-3 pt-3">
                {kind === 'up' && (
                  <div className="space-y-1">
                    <Label>Your name</Label>
                    <Input className="h-12 text-base" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                )}
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input className="h-12 text-base" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Password</Label>
                  <Input className="h-12 text-base" type="password" autoComplete={kind === 'in' ? 'current-password' : 'new-password'}
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full h-12 bg-agri-green-500 hover:bg-agri-green-600" disabled={busy || !email || password.length < 6}
                  onClick={() => run(kind)}>
                  {kind === 'in' ? 'Sign in' : 'Create account'}
                </Button>
                {kind === 'up' && <p className="text-xs text-muted-foreground">Password needs at least 6 characters. New accounts wait for the admin to approve them.</p>}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
