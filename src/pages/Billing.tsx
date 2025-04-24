
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Printer, Eye, Download } from "lucide-react";

// Mock data for bills
const mockBills = [
  { id: "1", billNo: "BILL-001", farmerId: "1", farmerName: "Rajesh Kumar", date: "2025-04-21", amount: 12500, status: "Paid", items: "Rice (30 bags)" },
  { id: "2", billNo: "BILL-002", farmerId: "2", farmerName: "Sunil Verma", date: "2025-04-18", amount: 8700, status: "Pending", items: "Wheat (25 bags)" },
  { id: "3", billNo: "BILL-003", farmerId: "3", farmerName: "Meena Patel", date: "2025-04-15", amount: 15800, status: "Paid", items: "Cotton (15 bags)" },
  { id: "4", billNo: "BILL-004", farmerId: "4", farmerName: "Vikram Singh", date: "2025-04-10", amount: 22500, status: "Pending", items: "Rice (40 bags)" },
  { id: "5", billNo: "BILL-005", farmerId: "5", farmerName: "Anita Kumari", date: "2025-04-05", amount: 9300, status: "Paid", items: "Vegetables (20 bags)" },
];

// Mock list of farmers for the dropdown
const mockFarmersList = [
  { id: "1", name: "Rajesh Kumar" },
  { id: "2", name: "Sunil Verma" },
  { id: "3", name: "Meena Patel" },
  { id: "4", name: "Vikram Singh" },
  { id: "5", name: "Anita Kumari" },
  { id: "6", name: "Dinesh Yadav" },
];

// Mock list of products with price per bag
const mockProducts = [
  { id: "1", name: "Rice", pricePerBag: 500 },
  { id: "2", name: "Wheat", pricePerBag: 450 },
  { id: "3", name: "Cotton", pricePerBag: 1200 },
  { id: "4", name: "Vegetables", pricePerBag: 350 },
  { id: "5", name: "Pulses", pricePerBag: 800 },
  { id: "6", name: "Sugarcane", pricePerBag: 600 },
];

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [newBill, setNewBill] = useState({
    farmerId: "",
    productId: "",
    quantity: "",
    cessRate: "5",
  });

  const filteredBills = mockBills.filter(
    (bill) =>
      bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.items.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBill({ ...newBill, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewBill({ ...newBill, [name]: value });
  };

  const calculateTotal = () => {
    if (!newBill.productId || !newBill.quantity) return 0;
    
    const product = mockProducts.find(p => p.id === newBill.productId);
    if (!product) return 0;
    
    const subtotal = product.pricePerBag * Number(newBill.quantity);
    const cessAmount = subtotal * (Number(newBill.cessRate) / 100);
    
    return subtotal + cessAmount;
  };

  const handleCreateBill = () => {
    // In a real app, this would create a new bill in the database
    const billData = {
      ...newBill,
      totalAmount: calculateTotal(),
    };
    console.log("Creating new bill:", billData);
    setIsCreateBillOpen(false);
    setNewBill({
      farmerId: "",
      productId: "",
      quantity: "",
      cessRate: "5",
    });
    // Toast notification would appear here in a real app
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Billing</h1>
        <Dialog open={isCreateBillOpen} onOpenChange={setIsCreateBillOpen}>
          <DialogTrigger asChild>
            <Button className="bg-agri-green-500 hover:bg-agri-green-600">
              <Plus className="h-4 w-4 mr-2" /> Create Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Bill</DialogTitle>
              <DialogDescription>
                Generate a new bill for a farmer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="farmerId">Farmer</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("farmerId", value)}
                  value={newBill.farmerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a farmer" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockFarmersList.map((farmer) => (
                      <SelectItem key={farmer.id} value={farmer.id}>
                        {farmer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productId">Product</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("productId", value)}
                  value={newBill.productId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (₹{product.pricePerBag}/bag)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Number of Bags</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  value={newBill.quantity}
                  onChange={handleInputChange}
                  placeholder="Enter number of bags"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cessRate">Cess Rate (%)</Label>
                <Input
                  id="cessRate"
                  name="cessRate"
                  value={newBill.cessRate}
                  onChange={handleInputChange}
                  placeholder="Enter cess rate"
                  type="number"
                />
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal:</span>
                  <span>
                    ₹{newBill.productId && newBill.quantity ? 
                      (mockProducts.find(p => p.id === newBill.productId)?.pricePerBag || 0) * Number(newBill.quantity) 
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm my-1">
                  <span>Cess ({newBill.cessRate}%):</span>
                  <span>
                    ₹{newBill.productId && newBill.quantity ? 
                      ((mockProducts.find(p => p.id === newBill.productId)?.pricePerBag || 0) * Number(newBill.quantity)) * (Number(newBill.cessRate) / 100) 
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center font-semibold text-lg mt-2">
                  <span>Total:</span>
                  <span>₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateBillOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBill} className="bg-agri-green-500 hover:bg-agri-green-600">
                Generate Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill Records</CardTitle>
          <CardDescription>
            View and manage all billing records. Print or download bills as needed.
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
                <TableHead>Bill No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNo}</TableCell>
                    <TableCell>{bill.date}</TableCell>
                    <TableCell>{bill.farmerName}</TableCell>
                    <TableCell>{bill.items}</TableCell>
                    <TableCell>₹{bill.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        bill.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {bill.status}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8" title="Print Bill">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8" title="View Bill">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8" title="Download Bill">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
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
            <CardTitle>Billing Summary</CardTitle>
            <CardDescription>
              Overview of current billing status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Total Bills</span>
                <span className="font-semibold">{mockBills.length}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold">
                  ₹{mockBills.reduce((acc, bill) => acc + bill.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Paid Amount</span>
                <span className="font-semibold text-green-600">
                  ₹{mockBills.filter(b => b.status === "Paid").reduce((acc, bill) => acc + bill.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pending Amount</span>
                <span className="font-semibold text-red-600">
                  ₹{mockBills.filter(b => b.status === "Pending").reduce((acc, bill) => acc + bill.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Printing Options</CardTitle>
            <CardDescription>
              Configure and manage printing settings for bills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-agri-green-600" />
                  <div>
                    <p className="font-medium">Thermal Printer</p>
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paperSize">Paper Size</Label>
                <Select defaultValue="58mm">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="copies">Number of Copies</Label>
                <Select defaultValue="1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button className="w-full bg-agri-green-500 hover:bg-agri-green-600">
                Configure Printer Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Billing;
