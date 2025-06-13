
import React from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatsCard } from './StatsCard';
import { Users, DollarSign, Package, TrendingUp } from 'lucide-react';

export function DashboardStats() {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Farmers"
        value={stats?.totalFarmers || 0}
        icon={Users}
        trend={{ value: 12, isPositive: true }}
      />
      <StatsCard
        title="Pending Amount"
        value={`₹${stats?.pendingAmount || 0}`}
        icon={DollarSign}
        trend={{ value: 8, isPositive: false }}
      />
      <StatsCard
        title="Active Bags"
        value={stats?.activeBags || 0}
        icon={Package}
        trend={{ value: 15, isPositive: true }}
      />
      <StatsCard
        title="Monthly Transactions"
        value={stats?.monthlyTransactions || 0}
        icon={TrendingUp}
        trend={{ value: 23, isPositive: true }}
      />
    </div>
  );
}
