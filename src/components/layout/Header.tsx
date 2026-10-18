import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

const ROLE_NAME = { admin: 'Admin', staff: 'Staff', viewer: 'View only', pending: 'Pending' } as const;

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { enforced, user, role, signOut } = useAuth();

  return (
    <header className="h-14 md:h-16 border-b bg-white flex items-center px-4 gap-3 sticky top-0 z-30 print-hidden">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden h-10 w-10" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg md:text-xl font-semibold text-agri-green-700 flex-1">AgriAggregator</h1>
      {enforced && user && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">{user.email} · {role ? ROLE_NAME[role] : ''}</span>
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
