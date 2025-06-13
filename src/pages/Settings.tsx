
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, MessageCircle, Users, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { organization, profile } = useAuth();
  const { toast } = useToast();
  
  const [businessInfo, setBusinessInfo] = useState({
    name: organization?.settings?.name || organization?.name || '',
    address: organization?.settings?.address || '',
    gstin: organization?.settings?.gstin || '',
    email: organization?.settings?.email || '',
    phone: organization?.settings?.phone || '',
  });

  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: organization?.settings?.integrations?.whatsapp?.enabled || false,
    apiUrl: organization?.settings?.integrations?.whatsapp?.apiUrl || '',
    token: organization?.settings?.integrations?.whatsapp?.token || '',
  });

  // Mock user data - will be replaced with real Supabase query
  const mockUsers = [
    {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
      created_at: '2025-01-01',
    },
    {
      id: '2',
      email: 'employee@example.com',
      role: 'employee',
      created_at: '2025-01-05',
    }
  ];

  const handleSaveBusinessInfo = async () => {
    try {
      // In a real implementation, this would update the organization settings in Supabase
      console.log('Saving business info:', businessInfo);
      
      toast({
        title: 'Success',
        description: 'Business information updated successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update business information.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveWhatsAppSettings = async () => {
    try {
      // In a real implementation, this would update the WhatsApp settings in Supabase
      console.log('Saving WhatsApp settings:', whatsappSettings);
      
      toast({
        title: 'Success',
        description: 'WhatsApp settings updated successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update WhatsApp settings.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Settings</h1>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Manage your organization's basic information and details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                    placeholder="Enter business email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Phone</Label>
                  <Input
                    id="business-phone"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                    placeholder="Enter business phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-gstin">GSTIN</Label>
                  <Input
                    id="business-gstin"
                    value={businessInfo.gstin}
                    onChange={(e) => setBusinessInfo({...businessInfo, gstin: e.target.value})}
                    placeholder="Enter GSTIN number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-address">Address</Label>
                <Textarea
                  id="business-address"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  placeholder="Enter complete business address"
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveBusinessInfo} className="bg-agri-green-500 hover:bg-agri-green-600">
                <Save className="h-4 w-4 mr-2" />
                Save Business Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Integration
              </CardTitle>
              <CardDescription>
                Configure WhatsApp API settings for sending bills and notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable WhatsApp Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sending bills and notifications via WhatsApp
                  </p>
                </div>
                <Switch
                  checked={whatsappSettings.enabled}
                  onCheckedChange={(checked) => 
                    setWhatsappSettings({...whatsappSettings, enabled: checked})
                  }
                />
              </div>
              
              {whatsappSettings.enabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-api-url">API URL</Label>
                    <Input
                      id="whatsapp-api-url"
                      value={whatsappSettings.apiUrl}
                      onChange={(e) => setWhatsappSettings({...whatsappSettings, apiUrl: e.target.value})}
                      placeholder="Enter WhatsApp API URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-token">API Token</Label>
                    <Input
                      id="whatsapp-token"
                      type="password"
                      value={whatsappSettings.token}
                      onChange={(e) => setWhatsappSettings({...whatsappSettings, token: e.target.value})}
                      placeholder="Enter WhatsApp API token"
                    />
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Setup Instructions:</strong>
                      <br />
                      1. Register for a WhatsApp Business API account
                      <br />
                      2. Get your API URL and token from your provider
                      <br />
                      3. Enter the details above and test the connection
                    </p>
                  </div>
                </div>
              )}
              
              <Button onClick={handleSaveWhatsAppSettings} className="bg-agri-green-500 hover:bg-agri-green-600">
                <Save className="h-4 w-4 mr-2" />
                Save WhatsApp Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage user accounts in your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                          Active
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> User invitation and role management features will be available in a future update. 
                  Currently showing read-only view of existing users.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
