
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Farmers from "./pages/Farmers";
import Transactions from "./pages/Transactions";
import Inventory from "./pages/Inventory";
import Billing from "./pages/Billing";
import DataManagement from "./pages/DataManagement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/farmers" element={<Farmers />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/data" element={<DataManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Reports (Coming Soon)</h1><p className="text-gray-600">Future module for advanced analytics and reporting</p></div>} />
              <Route path="/farmer-portal" element={<div className="p-6"><h1 className="text-2xl font-bold">Farmer Portal (Coming Soon)</h1><p className="text-gray-600">Future self-service portal for farmers</p></div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
