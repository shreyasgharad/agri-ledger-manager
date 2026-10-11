
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Users,
  UserCheck,
  Layers,
  Wallet,
  FileText,
  Package,
  Receipt,
  Database,
  Settings,
  BarChart3,
  UserCircle
} from 'lucide-react';

const navigationItems = [
  // Daily work
  { title: 'Dashboard', url: '/', icon: Home, group: 'core' },
  { title: 'Lots', url: '/lots', icon: Layers, group: 'core' },
  { title: 'Bills', url: '/bills', icon: Receipt, group: 'core' },
  { title: 'Advances', url: '/advances', icon: Wallet, group: 'core' },

  // People
  { title: 'Farmers', url: '/farmers', icon: Users, group: 'people' },
  { title: 'Buyers', url: '/buyers', icon: UserCheck, group: 'people' },

  // Older ledger modules
  { title: 'Transactions', url: '/transactions', icon: FileText, group: 'ledger' },
  { title: 'Inventory', url: '/inventory', icon: Package, group: 'ledger' },

  // Future
  { title: 'Reports', url: '/reports', icon: BarChart3, group: 'analytics', disabled: true },
  { title: 'Farmer Portal', url: '/farmer-portal', icon: UserCircle, group: 'portal', disabled: true },

  // Admin (no login yet, so always visible)
  { title: 'Data Management', url: '/data', icon: Database, group: 'admin' },
  { title: 'Settings', url: '/settings', icon: Settings, group: 'admin' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50';

  const filteredItems = navigationItems;

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  const getGroupLabel = (group: string) => {
    switch (group) {
      case 'core': return 'Daily work';
      case 'people': return 'People';
      case 'ledger': return 'Old ledger';
      case 'analytics': return 'Analytics';
      case 'portal': return 'Customer Portal';
      case 'admin': return 'Administration';
      default: return 'Navigation';
    }
  };

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarContent>
        {Object.entries(groupedItems).map(([group, items]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel className={state === 'collapsed' ? 'sr-only' : ''}>
              {getGroupLabel(group)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild disabled={item.disabled}>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={({ isActive }) => `${getNavCls({ isActive })} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <item.icon className="h-4 w-4" />
                        {state !== 'collapsed' && (
                          <span>
                            {item.title}
                            {item.disabled && <span className="text-xs ml-1">(Soon)</span>}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
