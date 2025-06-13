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
import { useInventory } from "@/hooks/useInventory";
import { useFarmers } from "@/hooks/useFarmers";

const mockProducts = ["Rice", "Wheat", "Cotton", "Vegetables", "Pulses", "Sugarcane"];

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<number | null>(null);
  const [newInventory, setNewInventory] = useState({
    farmer_id: "",
    product: "",
    bags_given: "",
  });
  const [bagReturn, setBagReturn] = useState({
    bags_returned: "",
  });

  const { inventory, isLoading, addInventory, updateInventory, isAddingInventory, isUpdatingInventory } = useInventory();
  const { farmers } = useFarmers();

  const filteredInventory = inventory.filter(
    (item) =>
      (item.farmers?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!newInventory.farmer_id || !newInventory.product || !newInventory.bags_given) {
      return;
    }

    addInventory({
      farmer_id: newInventory.farmer_id,
      product: newInventory.product,
      bags_given: parseInt(newInventory.bags_given),
    });

    setIsAddDialogOpen(false);
    setNewInventory({
      farmer_id: "",
      product: "",
      bags_given: "",
    });
  };

  const handleUpdateInventory = () => {
    if (selectedInventory === null || !bagReturn.bags_returned) {
      return;
    }

    const selectedItem = inventory.find(item => item.id === selectedInventory);
    if (!selectedItem) return;

    const newReturnedBags = parseInt(bagReturn.bags_returned);

    updateInventory({
      id: selectedInventory,
      bags_returned: newReturnedBags,
    });

    setIsUpdateDialogOpen(false);
    setBagReturn({
      bags_returned: "",
    });
    setSelectedInventory(null);
  };

  const openUpdateDialog = (inventoryId: number) => {
    setSelectedInventory(inventoryId);
    setIsUpdateDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Loading inventory...</div>;
  }

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
                <Label htmlFor="farmer_id">Farmer</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("farmer_id", value)}
                  value={newInventory.farmer_id}
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
                <Label htmlFor="bags_given">Number of Bags</Label>
                <Input
                  id="bags_given"
                  name="bags_given"
                  value={newInventory.bags_given}
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
              <Button 
                onClick={handleAddInventory} 
                disabled={isAddingInventory}
                className="bg-agri-green-500 hover:bg-agri-green-600"
              >
                {isAddingInventory ? "Adding..." : "Add Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
              <Label htmlFor="bags_returned">Number of Bags Returned</Label>
              <Input
                id="bags_returned"
                name="bags_returned"
                value={bagReturn.bags_returned}
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
            <Button 
              onClick={handleUpdateInventory} 
              disabled={isUpdatingInventory}
              className="bg-agri-green-500 hover:bg-agri-green-600"
            >
              {isUpdatingInventory ? "Updating..." : "Update"}
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
                <TableHead>Progress</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.farmers?.name}</TableCell>
                    <TableCell>{item.product}</TableCell>
                    <TableCell>{item.bags_given}</TableCell>
                    <TableCell>{item.bags_returned}</TableCell>
                    <TableCell>{item.bags_given - item.bags_returned}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(item.bags_returned / item.bags_given) * 100} 
                          className="h-2" 
                        />
                        <span className="text-xs text-muted-foreground">
                          {Math.round((item.bags_returned / item.bags_given) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`${item.bags_returned >= item.bags_given ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={item.bags_returned >= item.bags_given}
                        onClick={() => openUpdateDialog(item.id)}
                      >
                        <Package className="h-4 w-4 mr-1" /> Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
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
                  {inventory.reduce((acc, curr) => acc + curr.bags_given, 0)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 p-4 border rounded-lg">
              <span className="text-sm text-muted-foreground">Bags Returned</span>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-agri-brown-500" />
                <span className="text-2xl font-bold">
                  {inventory.reduce((acc, curr) => acc + curr.bags_returned, 0)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 p-4 border rounded-lg">
              <span className="text-sm text-muted-foreground">Pending Bags</span>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">
                  {inventory.reduce((acc, curr) => acc + (curr.bags_given - curr.bags_returned), 0)}
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
