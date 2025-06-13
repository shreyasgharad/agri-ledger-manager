
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Printer, MessageCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Mock data for now - will be replaced with real Supabase data
const mockBills = [
  {
    id: 1,
    billNumber: 'BILL-001',
    date: '2025-01-10',
    farmerName: 'Rajesh Kumar',
    amount: 5000,
    status: 'Paid'
  },
  {
    id: 2,
    billNumber: 'BILL-002', 
    date: '2025-01-09',
    farmerName: 'Sunil Verma',
    amount: 3500,
    status: 'Pending'
  }
];

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [newBill, setNewBill] = useState({
    farmer: '',
    amount: '',
    items: '',
    notes: ''
  });
  const { organization } = useAuth();

  const filteredBills = mockBills.filter(bill =>
    bill.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateBill = () => {
    // Bill generation logic will be implemented here
    console.log('Generating bill:', newBill);
    setIsGenerateDialogOpen(false);
    setNewBill({
      farmer: '',
      amount: '',
      items: '',
      notes: ''
    });
  };

  const handlePrint = (billId: number) => {
    console.log('Printing bill:', billId);
    // Print logic will be implemented here
  };

  const handleWhatsAppSend = (billId: number) => {
    console.log('Sending via WhatsApp:', billId);
    // WhatsApp integration will be implemented here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Billing</h1>
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-agri-green-500 hover:bg-agri-green-600">
              <Plus className="h-4 w-4 mr-2" /> Generate Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate New Bill</DialogTitle>
              <DialogDescription>
                Create a new bill for a farmer transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="farmer">Farmer</Label>
                <Input
                  id="farmer"
                  value={newBill.farmer}
                  onChange={(e) => setNewBill({...newBill, farmer: e.target.value})}
                  placeholder="Select or enter farmer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="items">Items/Description</Label>
                <Textarea
                  id="items"
                  value={newBill.items}
                  onChange={(e) => setNewBill({...newBill, items: e.target.value})}
                  placeholder="Enter bill items or description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={newBill.notes}
                  onChange={(e) => setNewBill({...newBill, notes: e.target.value})}
                  placeholder="Any additional notes"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateBill} className="bg-agri-green-500 hover:bg-agri-green-600">
                Generate & Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill History</CardTitle>
          <CardDescription>
            View and manage all generated bills.
          </CardDescription>
          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                    <TableCell>{bill.farmerName}</TableCell>
                    <TableCell className="font-medium">₹{bill.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        bill.status === 'Paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bill.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="Print"
                          onClick={() => handlePrint(bill.id)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="Send via WhatsApp"
                          onClick={() => handleWhatsAppSend(bill.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          title="View Details"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No bills found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bill Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Bills Generated:</span>
                <span className="font-medium">{mockBills.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">₹{mockBills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Bills:</span>
                <span className="font-medium text-green-600">{mockBills.filter(b => b.status === 'Paid').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Bills:</span>
                <span className="font-medium text-yellow-600">{mockBills.filter(b => b.status === 'Pending').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full bg-agri-green-500 hover:bg-agri-green-600">
              <FileText className="h-4 w-4 mr-2" />
              Generate Bulk Bills
            </Button>
            <Button variant="outline" className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Pending Reminders
            </Button>
            <Button variant="outline" className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              Print All Pending
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Billing;
