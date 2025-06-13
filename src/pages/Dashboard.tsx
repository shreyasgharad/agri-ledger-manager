
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Package, Receipt, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTransactions } from '@/hooks/useTransactions';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  // Get recent transactions (last 10)
  const recentTransactions = transactions.slice(0, 10);

  // Generate monthly chart data
  const monthlyData = React.useMemo(() => {
    const months = {};
    const currentDate = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      months[monthKey] = { name: monthKey, given: 0, received: 0 };
    }

    // Aggregate transaction data
    transactions.forEach(transaction => {
      const date = new Date(transaction.trans_date || transaction.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (months[monthKey]) {
        if (transaction.type === 'Given') {
          months[monthKey].given += transaction.amount;
        } else {
          months[monthKey].received += transaction.amount;
        }
      }
    });

    return Object.values(months);
  }, [transactions]);

  if (statsLoading || transactionsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-agri-green-700">Dashboard</h1>
        <div className="text-center py-6">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Farmers"
          value={stats?.totalFarmers || 0}
          description="Active in database"
          icon={Users}
        />
        <StatsCard
          title="Pending Amount"
          value={`₹${(stats?.pendingAmount || 0).toLocaleString()}`}
          description="To be collected"
          icon={Receipt}
          iconColor="text-red-500"
        />
        <StatsCard
          title="Active Bags"
          value={stats?.activeBags || 0}
          description="Currently with farmers"
          icon={Package}
          iconColor="text-agri-brown-500"
        />
        <StatsCard
          title="This Month"
          value={stats?.monthlyTransactions || 0}
          description="Completed transactions"
          icon={FileText}
          iconColor="text-blue-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <Link 
                        to={`/farmers`} 
                        className="font-medium hover:text-agri-green-600"
                      >
                        {transaction.farmers?.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.trans_date || transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 font-medium ${
                      transaction.type === 'Received' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'Received' ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                      {transaction.type === 'Received' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No recent transactions
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value?.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="received" name="Amount Received" fill="#52A531" />
                <Bar dataKey="given" name="Amount Given" fill="#AC8C59" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
