
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Farmers from "./pages/Farmers";
import FarmerLedger from "./pages/FarmerLedger";
import NewBill from "./pages/NewBill";
import Auth from "./pages/Auth";
import { RequireAuth } from "@/components/layout/RequireAuth";
import Lots from "./pages/Lots";
import LotDetail from "./pages/LotDetail";
import Buyers from "./pages/Buyers";
import Advances from "./pages/Advances";
import Bills from "./pages/Bills";
import BillView from "./pages/BillView";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <RequireAuth>
          <AppLayout>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/farmers" element={<Farmers />} />
              <Route path="/farmers/:id" element={<FarmerLedger />} />
              <Route path="/lots" element={<Lots />} />
              <Route path="/lots/:id" element={<LotDetail />} />
              <Route path="/buyers" element={<Buyers />} />
              <Route path="/advances" element={<Advances />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/bills/new" element={<NewBill />} />
              <Route path="/bills/:id" element={<BillView />} />
              <Route path="/billing" element={<Navigate to="/bills" replace />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
          </RequireAuth>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
