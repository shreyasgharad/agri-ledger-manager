
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFarmers } from "@/hooks/useFarmers";

const Farmers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: "",
    phone: "",
    address: "",
    items: "",
  });

  const { farmers, isLoading, addFarmer, deleteFarmer, isAddingFarmer } = useFarmers();

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone.includes(searchTerm) ||
      farmer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFarmer({ ...newFarmer, [name]: value });
  };

  const handleAddFarmer = () => {
    if (!newFarmer.name || !newFarmer.phone || !newFarmer.address || !newFarmer.items) {
      return;
    }
    
    addFarmer(newFarmer);
    setIsAddDialogOpen(false);
    setNewFarmer({
      name: "",
      phone: "",
      address: "",
      items: "",
    });
  };

  const handleDeleteFarmer = (id: string) => {
    if (confirm("Are you sure you want to delete this farmer?")) {
      deleteFarmer(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading farmers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Farmers</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-agri-green-500 hover:bg-agri-green-600">
              <Plus className="h-4 w-4 mr-2" /> Add Farmer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Farmer</DialogTitle>
              <DialogDescription>
                Enter the details of the new farmer below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newFarmer.name}
                  onChange={handleInputChange}
                  placeholder="Enter farmer's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newFarmer.phone}
                  onChange={handleInputChange}
                  placeholder="Enter farmer's phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={newFarmer.address}
                  onChange={handleInputChange}
                  placeholder="Enter farmer's address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="items">Items</Label>
                <Input
                  id="items"
                  name="items"
                  value={newFarmer.items}
                  onChange={handleInputChange}
                  placeholder="Enter items (comma separated)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddFarmer} 
                disabled={isAddingFarmer}
                className="bg-agri-green-500 hover:bg-agri-green-600"
              >
                {isAddingFarmer ? "Adding..." : "Add Farmer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farmer Directory</CardTitle>
          <CardDescription>
            Manage all farmer details and view balance amounts.
          </CardDescription>
          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search farmers..."
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
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarmers.length > 0 ? (
                filteredFarmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>{farmer.phone}</TableCell>
                    <TableCell>{farmer.address}</TableCell>
                    <TableCell>{farmer.items}</TableCell>
                    <TableCell className={`font-medium ${
                      farmer.balance > 0 
                        ? "text-green-600" 
                        : farmer.balance < 0 
                        ? "text-red-600" 
                        : ""
                    }`}>
                      {farmer.balance > 0 ? "+" : ""}₹{farmer.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeleteFarmer(farmer.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No farmers found matching your search.
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

export default Farmers;
