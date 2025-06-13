
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash, Phone, MessageCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFarmers } from "@/hooks/useFarmers";
import { useAuth } from "@/hooks/useAuth";

const Farmers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: "",
    phone: "",
    address: "",
    crop_type: "",
  });

  const { farmers, isLoading, addFarmer, deleteFarmer, isAddingFarmer, error } = useFarmers();
  const { isAdmin, profile, user, isLoading: authLoading } = useAuth();

  console.log('Farmers page - Auth state:', { user: !!user, profile: !!profile, isLoading: authLoading });
  console.log('Farmers page - Farmers state:', { farmersCount: farmers.length, isLoading, error });

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone.includes(searchTerm) ||
      (farmer.address && farmer.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFarmer({ ...newFarmer, [name]: value });
  };

  const handleAddFarmer = () => {
    console.log('Adding farmer:', newFarmer);
    
    if (!newFarmer.name || !newFarmer.phone) {
      return;
    }
    
    addFarmer(newFarmer);
    setIsAddDialogOpen(false);
    setNewFarmer({
      name: "",
      phone: "",
      address: "",
      crop_type: "",
    });
  };

  const handleDeleteFarmer = (id: string) => {
    if (confirm("Are you sure you want to delete this farmer?")) {
      deleteFarmer(id);
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-green-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show error if no profile or organization
  if (!profile?.org_id) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization found for your account. Please contact your administrator to assign you to an organization.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-agri-green-700">Farmers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organization: {profile.org_id} | Role: {profile.role}
          </p>
        </div>
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
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={newFarmer.name}
                  onChange={handleInputChange}
                  placeholder="Enter farmer's name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newFarmer.phone}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit phone number"
                  pattern="[0-9]{10}"
                  required
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
                <Label htmlFor="crop_type">Crop Type</Label>
                <Input
                  id="crop_type"
                  name="crop_type"
                  value={newFarmer.crop_type}
                  onChange={handleInputChange}
                  placeholder="Enter crop type"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddFarmer} 
                disabled={isAddingFarmer || !newFarmer.name || !newFarmer.phone}
                className="bg-agri-green-500 hover:bg-agri-green-600"
              >
                {isAddingFarmer ? "Adding..." : "Add Farmer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading farmers: {error.message}
          </AlertDescription>
        </Alert>
      )}

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
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-green-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading farmers...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Crop Type</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFarmers.length > 0 ? (
                      filteredFarmers.map((farmer) => (
                        <TableRow key={farmer.id}>
                          <TableCell className="font-medium">{farmer.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{farmer.phone}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCall(farmer.phone)}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleWhatsApp(farmer.phone)}
                              >
                                <MessageCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{farmer.address || "-"}</TableCell>
                          <TableCell>{farmer.crop_type || "-"}</TableCell>
                          <TableCell className={`font-medium ${
                            (farmer.balance || 0) > 0 
                              ? "text-green-600" 
                              : (farmer.balance || 0) < 0 
                              ? "text-red-600" 
                              : ""
                          }`}>
                            {(farmer.balance || 0) > 0 ? "+" : ""}₹{(farmer.balance || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <>
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
                                </>
                              )}
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
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredFarmers.length > 0 ? (
                  filteredFarmers.map((farmer) => (
                    <Card key={farmer.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{farmer.name}</h3>
                          <span className={`text-sm font-medium ${
                            (farmer.balance || 0) > 0 
                              ? "text-green-600" 
                              : (farmer.balance || 0) < 0 
                              ? "text-red-600" 
                              : ""
                          }`}>
                            ₹{(farmer.balance || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>{farmer.phone}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCall(farmer.phone)}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWhatsApp(farmer.phone)}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              WhatsApp
                            </Button>
                          </div>
                          {farmer.address && <p>📍 {farmer.address}</p>}
                          {farmer.crop_type && <p>🌾 {farmer.crop_type}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No farmers found matching your search.
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Farmers;
