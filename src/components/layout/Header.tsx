import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

// Single-user mode: no login, so no avatar or sign-out here. When authentication is
// enabled later, re-add the user menu from useAuth().
const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="h-14 md:h-16 border-b bg-white flex items-center px-4 gap-3 sticky top-0 z-30">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden h-10 w-10" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg md:text-xl font-semibold text-agri-green-700">AgriAggregator</h1>
    </header>
  );
};

export default Header;
