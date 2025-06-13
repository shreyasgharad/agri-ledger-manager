import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Receipt, FileText, ArrowDown, ArrowUp } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFarmers } from "@/hooks/useFarmers";

const Transactions = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    farmer_id: "",
    type: "" as "Given" | "Received" | "",
    amount: "",
    note: "",
    trans_date: new Date().toISOString().split('T')[0],
  });

  const { transactions, isLoading, addTransaction, isAddingTransaction } = useTransactions();
  const { farmers } = useFarmers();

  const filteredTransactions = transactions
    .filter((transaction) => {
      const farmerName = transaction.farmers?.name || "";
      const matchesSearch =
        farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.note && transaction.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
        transaction.amount.toString().includes(searchTerm);
      
      if (activeTab === "given") {
        return matchesSearch && transaction.type === "Given";
      } else if (activeTab === "received") {
        return matchesSearch && transaction.type === "Received";
      } else {
        return matchesSearch;
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTransaction({ ...newTransaction, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewTransaction({ ...newTransaction, [name]: value });
  };

  const handleAddTransaction = () => {
    if (!newTransaction.farmer_id || !newTransaction.type || !newTransaction.amount) {
      return;
    }

    addTransaction({
      farmer_id: newTransaction.farmer_id,
      type: newTransaction.type as "Given" | "Received",
      amount: parseFloat(newTransaction.amount),
      note: newTransaction.note || null,
      trans_date: newTransaction.trans_date,
    });

    setIsAddDialogOpen(false);
    setNewTransaction({
      farmer_id: "",
      type: "",
      amount: "",
      note: "",
      trans_date: new Date().toISOString().split('T')[0],
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Transactions</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-agri-green-500 hover:bg-agri-green-600">
              <Plus className="h-4 w-4 mr-2" /> Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Transaction</DialogTitle>
              <DialogDescription>
                Enter the details of the transaction below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="farmer_id">Farmer</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("farmer_id", value)}
                  value={newTransaction.farmer_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a farmer" />
                  </SelectTrigger>
                  <SelectContent>
                    {farmers.map((farmer) => (
                      <SelectItem key={farmer.id} value={farmer.id}>
                        {farmer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Transaction Type</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("type", value)}
                  value={newTransaction.type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Given">Money Given</SelectItem>
                    <SelectItem value="Received">Money Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  name="amount"
                  value={newTransaction.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trans_date">Date</Label>
                <Input
                  id="trans_date"
                  name="trans_date"
                  value={newTransaction.trans_date}
                  onChange={handleInputChange}
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Notes</Label>
                <Input
                  id="note"
                  name="note"
                  value={newTransaction.note}
                  onChange={handleInputChange}
                  placeholder="Optional notes about this transaction"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddTransaction} 
                disabled={isAddingTransaction}
                className="bg-agri-green-500 hover:bg-agri-green-600"
              >
                {isAddingTransaction ? "Recording..." : "Record Transaction"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Records</CardTitle>
          <CardDescription>
            View and manage all financial transactions with farmers.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 my-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="given" className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" /> Given
                </TabsTrigger>
                <TabsTrigger value="received" className="flex items-center gap-1">
                  <ArrowDown className="h-3 w-3" /> Received
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.trans_date || transaction.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{transaction.farmers?.name}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        transaction.type === "Given"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {transaction.type === "Given" ? (
                          <ArrowUp className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowDown className="mr-1 h-3 w-3" />
                        )}
                        {transaction.type}
                      </div>
                    </TableCell>
                    <TableCell className={`font-medium ${
                      transaction.type === "Received" 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {transaction.type === "Received" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{transaction.note}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Print Receipt">
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View Details">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No transactions found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
