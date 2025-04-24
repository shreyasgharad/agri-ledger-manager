
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Package, ArrowRight } from "lucide-react";

// Mock data for demonstration
const mockInventory = [
  { id: "1", farmerId: "1", farmerName: "Rajesh Kumar", product: "Rice", givenBags: 30, returnedBags: 12, status: "Active" },
  { id: "2", farmerId: "2", farmerName: "Sunil Verma", product: "Wheat", givenBags: 25, returnedBags: 25, status: "Completed" },
  { id: "3", farmerId: "3", farmerName: "Meena Patel", product: "Cotton", givenBags: 15, returnedBags: 5, status: "Active" },
  { id: "4", farmerId: "4", farmerName: "Vikram Singh", product: "Rice", givenBags: 40, returnedBags: 15, status: "Active" },
  { id: "5", farmerId: "5", farmerName: "Anita Kumari", product: "Vegetables", givenBags: 20, returnedBags: 0, status: "Active" },
  { id: "6", farmerId: "6", farmerName: "Dinesh Yadav", product: "Pulses", givenBags: 10, returnedBags: 10, status: "Completed" },
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

// Mock list of products
const mockProducts = ["Rice", "Wheat", "Cotton", "Vegetables", "Pulses", "Sugarcane"];

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<string | null>(null);
  const [newInventory, setNewInventory] = useState({
    farmerId: "",
    product: "",
    givenBags: "",
  });
  const [bagReturn, setBagReturn] = useState({
    returnedBags: "",
  });

  const filteredInventory = mockInventory.filter(
    (inventory) =>
      inventory.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inventory.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inventory.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewInventory({ ...newInventory, [name]: value });
  };

  const handleReturnInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBagReturn({ ...bagReturn, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewInventory({ ...newInventory, [name]: value });
  };

  const handleAddInventory = () => {
    // In a real app, this would add the inventory record to the database
    console.log("Adding new inventory:", newInventory);
    setIsAddDialogOpen(false);
    setNewInventory({
      farmerId: "",
      product: "",
      givenBags: "",
    });
    // Toast notification would appear here in a real app
  };

  const handleUpdateInventory = () => {
    // In a real app, this would update the inventory record in the database
    console.log("Updating inventory ID:", selectedInventory, "with:", bagReturn);
    setIsUpdateDialogOpen(false);
    setBagReturn({
      returnedBags: "",
    });
    setSelectedInventory(null);
    // Toast notification would appear here in a real app
  };

  const openUpdateDialog = (inventoryId: string) => {
    setSelectedInventory(inventoryId);
    setIsUpdateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Bags & Inventory</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-agri-green-500 hover:bg-agri-green-600">
              <Plus className="h-4 w-4 mr-2" /> Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Record</DialogTitle>
              <DialogDescription>
                Record bags given to a farmer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="farmerId">Farmer</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("farmerId", value)}
                  value={newInventory.farmerId}
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
                <Label htmlFor="product">Product</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("product", value)}
                  value={newInventory.product}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="givenBags">Number of Bags</Label>
                <Input
                  id="givenBags"
                  name="givenBags"
                  value={newInventory.givenBags}
                  onChange={handleInputChange}
                  placeholder="Enter number of bags"
                  type="number"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddInventory} className="bg-agri-green-500 hover:bg-agri-green-600">
                Add Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Update Bags Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Bag Return</DialogTitle>
            <DialogDescription>
              Record bags returned by the farmer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="returnedBags">Number of Bags Returned</Label>
              <Input
                id="returnedBags"
                name="returnedBags"
                value={bagReturn.returnedBags}
                onChange={handleReturnInputChange}
                placeholder="Enter number of bags"
                type="number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateInventory} className="bg-agri-green-500 hover:bg-agri-green-600">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Tracking</CardTitle>
          <CardDescription>
            Track bags and inventory distributed to farmers.
          </CardDescription>
          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
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
                <TableHead>Farmer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Given</TableHead>
                <TableHead>Returned</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((inventory) => (
                  <TableRow key={inventory.id}>
                    <TableCell className="font-medium">{inventory.farmerName}</TableCell>
                    <TableCell>{inventory.product}</TableCell>
                    <TableCell>{inventory.givenBags}</TableCell>
                    <TableCell>{inventory.returnedBags}</TableCell>
                    <TableCell>{inventory.givenBags - inventory.returnedBags}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        inventory.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {inventory.status}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(inventory.returnedBags / inventory.givenBags) * 100} 
                          className="h-2" 
                        />
                        <span className="text-xs text-muted-foreground">
                          {Math.round((inventory.returnedBags / inventory.givenBags) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`${inventory.status === "Completed" ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={inventory.status === "Completed"}
                        onClick={() => openUpdateDialog(inventory.id)}
                      >
                        <Package className="h-4 w-4 mr-1" /> Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No inventory records found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
          <CardDescription>
            Overview of current inventory status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-2 p-4 border rounded-lg">
              <span className="text-sm text-muted-foreground">Total Bags Distributed</span>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-agri-green-500" />
                <span className="text-2xl font-bold">
                  {mockInventory.reduce((acc, curr) => acc + curr.givenBags, 0)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 p-4 border rounded-lg">
              <span className="text-sm text-muted-foreground">Bags Returned</span>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-agri-brown-500" />
                <span className="text-2xl font-bold">
                  {mockInventory.reduce((acc, curr) => acc + curr.returnedBags, 0)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 p-4 border rounded-lg">
              <span className="text-sm text-muted-foreground">Pending Bags</span>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">
                  {mockInventory.reduce((acc, curr) => acc + (curr.givenBags - curr.returnedBags), 0)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
