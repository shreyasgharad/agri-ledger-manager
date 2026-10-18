import { Link } from 'react-router-dom';
import { Layers, Percent, Scale, Wallet, Users, Receipt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/dashboard/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBrokerStats, useLots } from '@/hooks/useAgri';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatINR, formatKg } from '@/lib/format';

const Dashboard = () => {
  const { data: stats, isLoading } = useBrokerStats();
  const { lots } = useLots();
  const { isAdmin, canWrite } = useAuth();
  const recent = lots.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-agri-green-700">Today</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {canWrite && (
          <Button asChild className="h-12 bg-agri-green-500 hover:bg-agri-green-600">
            <Link to="/bills/new"><Plus className="h-4 w-4 mr-2" /> Create bill</Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-center py-6 text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatsCard title="Lots today" value={stats?.lotsToday ?? 0} description={`${stats?.bagsToday ?? 0} bags`} icon={Layers} />
          <StatsCard title="Quintals today" value={(stats?.quintalToday ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} description="weighed" icon={Scale} />
          {isAdmin && <StatsCard title="Commission today" value={formatINR(stats?.commissionToday)} description="from issued bills" icon={Percent} iconColor="text-agri-green-600" />}
          {isAdmin && <StatsCard title="Commission this month" value={formatINR(stats?.commissionMonth)} description="farmer + buyer" icon={Receipt} iconColor="text-blue-500" />}
          <StatsCard title="Open advances" value={formatINR(stats?.pendingAdvances)} description="not yet deducted" icon={Wallet} iconColor="text-red-500" />
          <StatsCard title="Farmers" value={stats?.totalFarmers ?? 0} description={`Owed to farmers ${formatINR(stats?.payableToFarmers)}`} icon={Users} />
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Recent lots</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No lots yet. Tap "Create bill" to start.</p>
          ) : (
            <div className="divide-y">
              {recent.map((l) => (
                <Link key={l.id} to={`/lots/${l.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40 px-1 rounded">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.farmers?.name} · {l.crops?.name}</p>
                    <p className="text-sm text-muted-foreground">{l.totals.bag_count} bags · {formatKg(l.totals.total_kg)} · {formatDate(l.lot_date)}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
