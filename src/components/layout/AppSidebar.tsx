
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { FilePlus, Home, Layers, Receipt, Settings, UserCheck, Users, Wallet } from 'lucide-react';

const navigationItems = [
  { title: 'Home', url: '/', icon: Home, group: 'core' },
  { title: 'Create bill', url: '/bills/new', icon: FilePlus, group: 'core', writeOnly: true },
  { title: 'Bills', url: '/bills', icon: Receipt, group: 'core' },
  { title: 'Farmers', url: '/farmers', icon: Users, group: 'core' },
  { title: 'Advances', url: '/advances', icon: Wallet, group: 'core' },
  { title: 'Lots', url: '/lots', icon: Layers, group: 'more' },
  { title: 'Buyers', url: '/buyers', icon: UserCheck, group: 'more' },
  { title: 'Settings', url: '/settings', icon: Settings, group: 'more', adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50';

  const { isAdmin, canWrite } = useAuth();
  const filteredItems = navigationItems.filter((i) => (!i.adminOnly || isAdmin) && (!i.writeOnly || canWrite));

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  const getGroupLabel = (group: string) => {
    switch (group) {
      case 'core': return 'Daily work';
      case 'more': return 'More';
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
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={({ isActive }) => `${getNavCls({ isActive })}`}
                      >
                        <item.icon className="h-4 w-4" />
                        {state !== 'collapsed' && (
                          <span>
                            {item.title}
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
