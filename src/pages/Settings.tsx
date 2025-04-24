
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building, Languages, Printer } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const [businessInfo, setBusinessInfo] = useState({
    name: "AgriVendor Solutions",
    ownerName: "Suresh Patel",
    address: "123 Farm Road, Agricultural District",
    phone: "9876543210",
    email: "contact@agrivendor.com",
    gstin: "22AAAAA0000A1Z5",
  });
  
  const [bankInfo, setBankInfo] = useState({
    accountName: "AgriVendor Solutions",
    accountNumber: "1234567890123456",
    ifscCode: "ABCD0001234",
    bankName: "Agricultural Bank",
    branch: "Main Branch",
  });

  const handleBusinessInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleBankInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveBusinessInfo = () => {
    console.log("Saving business info:", businessInfo);
    toast.success("Business information updated successfully");
  };

  const handleSaveBankInfo = () => {
    console.log("Saving bank info:", bankInfo);
    toast.success("Banking information updated successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Settings</h1>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your business details that appear on invoices and receipts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={businessInfo.name}
                    onChange={handleBusinessInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    value={businessInfo.ownerName}
                    onChange={handleBusinessInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={businessInfo.address}
                    onChange={handleBusinessInfoChange}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={businessInfo.phone}
                      onChange={handleBusinessInfoChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      value={businessInfo.email}
                      onChange={handleBusinessInfoChange}
                      type="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    name="gstin"
                    value={businessInfo.gstin}
                    onChange={handleBusinessInfoChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will appear on your invoices and receipts.
                  </p>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveBusinessInfo}
                    className="bg-agri-green-500 hover:bg-agri-green-600"
                  >
                    Save Business Information
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banking Information</CardTitle>
              <CardDescription>
                Update your banking details for transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    name="accountName"
                    value={bankInfo.accountName}
                    onChange={handleBankInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    value={bankInfo.accountNumber}
                    onChange={handleBankInfoChange}
                  />
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      name="ifscCode"
                      value={bankInfo.ifscCode}
                      onChange={handleBankInfoChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      value={bankInfo.bankName}
                      onChange={handleBankInfoChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    name="branch"
                    value={bankInfo.branch}
                    onChange={handleBankInfoChange}
                  />
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveBankInfo}
                    className="bg-agri-green-500 hover:bg-agri-green-600"
                  >
                    Save Banking Information
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users who can access this application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 rounded-lg border border-agri-green-200 bg-agri-green-100">
                  <div className="flex gap-4 items-center">
                    <div className="bg-agri-green-500 text-white p-3 rounded-full">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">Admin (You)</h3>
                      <p className="text-sm text-muted-foreground">admin@agrivendor.com • Full Access</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Staff Users</h3>
                  
                  <div className="p-4 rounded-lg border">
                    <div className="flex gap-4 items-center">
                      <div className="bg-gray-200 p-3 rounded-full">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Ramesh Kumar</h3>
                        <p className="text-sm text-muted-foreground">ramesh@agrivendor.com • Limited Access</p>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <div className="flex gap-4 items-center">
                      <div className="bg-gray-200 p-3 rounded-full">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">Priya Singh</h3>
                        <p className="text-sm text-muted-foreground">priya@agrivendor.com • Limited Access</p>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-agri-green-500 hover:bg-agri-green-600">
                  Add New User
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Permissions</CardTitle>
              <CardDescription>
                Define what different user roles can access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Admin Role</h3>
                  <p className="text-sm text-muted-foreground">Full access to all features and settings</p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">Staff Role</h3>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="farmers">Farmer Management</Label>
                      <p className="text-xs text-muted-foreground">Can view and edit farmer details</p>
                    </div>
                    <Switch id="farmers" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="transactions">Transactions</Label>
                      <p className="text-xs text-muted-foreground">Can record transactions but not delete</p>
                    </div>
                    <Switch id="transactions" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="inventory">Inventory Management</Label>
                      <p className="text-xs text-muted-foreground">Can track inventory and bags</p>
                    </div>
                    <Switch id="inventory" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="billing">Billing</Label>
                      <p className="text-xs text-muted-foreground">Can create and print bills</p>
                    </div>
                    <Switch id="billing" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="dataManagement">Data Management</Label>
                      <p className="text-xs text-muted-foreground">Can import/export data</p>
                    </div>
                    <Switch id="dataManagement" />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="settings">Settings</Label>
                      <p className="text-xs text-muted-foreground">Can change application settings</p>
                    </div>
                    <Switch id="settings" />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button className="bg-agri-green-500 hover:bg-agri-green-600">
                    Save Permissions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Customize how the application works for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="notificationsEnabled">Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive alerts about important events</p>
                    </div>
                    <Switch id="notificationsEnabled" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoBackup">Automatic Backups</Label>
                      <p className="text-xs text-muted-foreground">Back up your data regularly</p>
                    </div>
                    <Switch id="autoBackup" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="darkMode">Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">Use dark theme for the application</p>
                    </div>
                    <Switch id="darkMode" />
                  </div>
                </div>
                
                <div className="space-y-2 pt-4">
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                      <SelectItem value="gu">Gujarati</SelectItem>
                      <SelectItem value="pa">Punjabi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select defaultValue="dd-mm-yyyy">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency Format</Label>
                  <Select defaultValue="inr">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="usd">US Dollar ($)</SelectItem>
                      <SelectItem value="eur">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button className="bg-agri-green-500 hover:bg-agri-green-600">
                    Save Preferences
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Printer Settings</CardTitle>
              <CardDescription>
                Configure your printer connection and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Printer className="h-8 w-8 text-agri-green-500" />
                  <div>
                    <p className="font-medium">Bluetooth Thermal Printer</p>
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="printerSize">Printer Type</Label>
                  <Select defaultValue="58mm">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm Thermal Printer</SelectItem>
                      <SelectItem value="80mm">80mm Thermal Printer</SelectItem>
                      <SelectItem value="a4">A4 Printer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paperSize">Paper Size</Label>
                  <Select defaultValue="58mm">
                    <SelectTrigger className="w-full">
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
                  <Label htmlFor="printCopies">Default Print Copies</Label>
                  <Select defaultValue="1">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button className="bg-agri-green-500 hover:bg-agri-green-600">
                    Connect Printer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
