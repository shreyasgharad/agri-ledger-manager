
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface DashboardStats {
  totalFarmers: number;
  pendingAmount: number;
  activeBags: number;
  monthlyTransactions: number;
}

export const useDashboardStats = () => {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get total farmers
      const { count: totalFarmers } = await supabase
        .from('farmers')
        .select('*', { count: 'exact', head: true });

      // Get pending amount (sum of balances)
      const { data: balanceData } = await supabase
        .from('farmers')
        .select('balance');
      
      const pendingAmount = balanceData?.reduce((sum, farmer) => sum + (farmer.balance || 0), 0) || 0;

      // Get active bags
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('bags_given, bags_returned');
      
      const activeBags = inventoryData?.reduce((sum, item) => sum + (item.bags_given - item.bags_returned), 0) || 0;

      // Get this month's transactions
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const { count: monthlyTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('trans_date', `${currentMonth}-01`)
        .lt('trans_date', `${currentMonth}-32`);

      return {
        totalFarmers: totalFarmers || 0,
        pendingAmount,
        activeBags,
        monthlyTransactions: monthlyTransactions || 0,
      };
    },
  });

  // Subscribe to realtime updates
  useRealtimeSubscription({ table: 'farmers', onUpdate: refetch });
  useRealtimeSubscription({ table: 'transactions', onUpdate: refetch });
  useRealtimeSubscription({ table: 'inventory', onUpdate: refetch });

  return { stats, isLoading, refetch };
};
