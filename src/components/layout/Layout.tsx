
import React from "react";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar className="w-64 hidden md:flex" />
      <main className="flex-1 overflow-auto">
        <div className="container p-4 md:p-6 max-w-7xl">
          {children}
        </div>
      </main>
      <Toaster />
      <Sonner />
    </div>
  );
}

export default Layout;
