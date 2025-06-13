
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const Header = () => {
  const { user, organization, signOut } = useAuth();
  const { toggleSidebar } = useSidebar();

  const orgName = organization?.settings?.name || organization?.name || 'AgriLedger';
  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-agri-green-700">{orgName}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-agri-green-100 text-agri-green-700">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
