import { NavLink } from 'react-router-dom';
import { Home, Layers, Receipt, Users, Wallet } from 'lucide-react';

const items = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Lots', url: '/lots', icon: Layers },
  { title: 'Farmers', url: '/farmers', icon: Users },
  { title: 'Advances', url: '/advances', icon: Wallet },
  { title: 'Bills', url: '/bills', icon: Receipt },
];

/** Thumb-reach navigation for phones; hidden on desktop and when printing. */
export function BottomNav() {
  return (
    <nav className="md:hidden print-hidden fixed bottom-0 inset-x-0 z-40 border-t bg-white grid grid-cols-5">
      {items.map(({ title, url, icon: Icon }) => (
        <NavLink
          key={url}
          to={url}
          end={url === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-2 text-xs min-h-[56px] ${isActive ? 'text-agri-green-700 font-semibold' : 'text-muted-foreground'}`
          }
        >
          <Icon className="h-5 w-5" />
          {title}
        </NavLink>
      ))}
    </nav>
  );
}
