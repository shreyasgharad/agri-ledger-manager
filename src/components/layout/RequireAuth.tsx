import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Auth from '@/pages/Auth';
import { useAuth } from '@/hooks/useAuth';

/** Lets people in only when logins are enforced and their role allows it. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { enforced, isLoading, user, role, signOut, refreshProfile } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }
  if (!enforced) return <>{children}</>;
  if (!user) return <Auth />;

  if (role === 'pending' || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-agri-green-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader><CardTitle>Waiting for approval</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your account <span className="font-medium">{user.email}</span> is created. Ask the admin to approve it in Settings, then tap Check again.
            </p>
            <div className="flex gap-2 justify-center">
              <Button className="h-12" onClick={refreshProfile}>Check again</Button>
              <Button className="h-12" variant="outline" onClick={signOut}>Sign out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}
