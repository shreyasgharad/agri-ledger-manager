
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef } from 'react';

export interface DashboardStats {
  totalFarmers: number;
  pendingAmount: number;
  activeBags: number;
  monthlyTransactions: number;
}

export const useDashboardStats = () => {
  const channelRef = useRef<any>(null);

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

  // Single realtime subscription for all tables
  useEffect(() => {
    // Clean up existing channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a single channel for all dashboard updates
    const channel = supabase
      .channel(`dashboard-updates-${Date.now()}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'farmers',
        },
        (payload) => {
          console.log('Farmers table update:', payload);
          refetch();
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('Transactions table update:', payload);
          refetch();
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
        },
        (payload) => {
          console.log('Inventory table update:', payload);
          refetch();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // Empty dependency array since we only want to set up the subscription once

  return { stats, isLoading, refetch };
};
