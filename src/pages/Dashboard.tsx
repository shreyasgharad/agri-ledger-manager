
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Users, Package, Receipt, FileText } from "lucide-react";

const mockData = {
  stats: {
    totalFarmers: 42,
    activeBags: 156,
    pendingAmount: 78500,
    completedTransactions: 124
  },
  recentTransactions: [
    { id: 1, farmer: "Rajesh Kumar", type: "Received", amount: 5000, date: "2025-04-21" },
    { id: 2, farmer: "Sunil Verma", type: "Given", amount: 3500, date: "2025-04-20" },
    { id: 3, farmer: "Meena Patel", type: "Received", amount: 7500, date: "2025-04-18" },
  ],
  monthlyData: [
    { name: "Jan", received: 12000, given: 8000 },
    { name: "Feb", received: 19000, given: 11000 },
    { name: "Mar", received: 15000, given: 10000 },
    { name: "Apr", received: 21000, given: 14000 }
  ]
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <Users className="h-4 w-4 text-agri-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.stats.totalFarmers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Bags</CardTitle>
            <Package className="h-4 w-4 text-agri-brown-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.stats.activeBags}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently with farmers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Receipt className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{mockData.stats.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              To be collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.stats.completedTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{transaction.farmer}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date}
                    </p>
                  </div>
                  <div className={`font-medium ${
                    transaction.type === "Received" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "Received" ? "+" : "-"}₹{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[250px] w-full">
              <BarChart
                width={350}
                height={250}
                data={mockData.monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Bar dataKey="received" name="Amount Received" fill="#52A531" />
                <Bar dataKey="given" name="Amount Given" fill="#AC8C59" />
              </BarChart>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
