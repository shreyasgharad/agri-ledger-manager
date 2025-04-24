
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  FileText,
  Package,
  Receipt,
  Database,
  Settings
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarLink = ({ to, icon, label }: SidebarLinkProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export function Sidebar({ className, ...props }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border",
        className
      )}
      {...props}
    >
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-agri-green-600 mb-1">
          AgriLedger
        </h2>
        <p className="text-sm text-sidebar-foreground/70">
          Farmer Transaction Manager
        </p>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1">
        <SidebarLink to="/" icon={<Home size={20} />} label="Dashboard" />
        <SidebarLink
          to="/farmers"
          icon={<Users size={20} />}
          label="Farmers"
        />
        <SidebarLink
          to="/transactions"
          icon={<FileText size={20} />}
          label="Transactions"
        />
        <SidebarLink
          to="/inventory"
          icon={<Package size={20} />}
          label="Bags & Inventory"
        />
        <SidebarLink
          to="/billing"
          icon={<Receipt size={20} />}
          label="Billing"
        />
        <SidebarLink
          to="/data"
          icon={<Database size={20} />}
          label="Data Management"
        />
        <SidebarLink
          to="/settings"
          icon={<Settings size={20} />}
          label="Settings"
        />
      </nav>
      <div className="px-3 py-4 mt-auto">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <p className="text-xs text-sidebar-accent-foreground">
            AgriLedger v1.0
            <br />© 2025 All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
