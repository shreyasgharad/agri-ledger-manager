
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Database, Download, Upload, FileText, RefreshCw, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const DataManagement = () => {
  const [exportFormat, setExportFormat] = useState("csv");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle, syncing, completed, failed

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImportFile(files[0]);
    }
  };

  const handleImport = () => {
    if (!importFile) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    // Simulating import progress
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulating export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleSync = () => {
    setSyncStatus("syncing");
    
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus("completed");
      
      // Reset status after showing completion
      setTimeout(() => {
        setSyncStatus("idle");
      }, 3000);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Data Management</h1>
      </div>
      
      <Tabs defaultValue="import-export">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import-export" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>
                  Upload CSV or Excel files to import data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm mb-2">
                      Drag & drop your file here or click to browse
                    </p>
                    <Input 
                      type="file" 
                      className="w-full"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  {importFile && (
                    <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm truncate max-w-[150px]">{importFile.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{Math.round(importFile.size / 1024)} KB</span>
                    </div>
                  )}
                  
                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Importing...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} />
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleImport}
                    disabled={!importFile || isImporting}
                    className="w-full bg-agri-green-500 hover:bg-agri-green-600"
                  >
                    {isImporting ? "Importing..." : "Import Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>
                  Export your data in various formats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exportFormat">Format</Label>
                    <Select 
                      value={exportFormat} 
                      onValueChange={setExportFormat}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dataType">Data to Export</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Data</SelectItem>
                        <SelectItem value="farmers">Farmers</SelectItem>
                        <SelectItem value="transactions">Transactions</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="bills">Bills</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateRange">Date Range</Label>
                    <Select defaultValue="all-time">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-time">All Time</SelectItem>
                        <SelectItem value="this-month">This Month</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="this-year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {isExporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Exporting...</span>
                        <span>{exportProgress}%</span>
                      </div>
                      <Progress value={exportProgress} />
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full bg-agri-green-500 hover:bg-agri-green-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : `Export as ${exportFormat.toUpperCase()}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="backup" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Backup</CardTitle>
              <CardDescription>
                Create and manage backups of your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-8 w-8 text-agri-green-500" />
                    <div>
                      <p className="font-semibold">Current Database</p>
                      <p className="text-sm text-muted-foreground">
                        Last synced: 24-Apr-2025, 10:30 AM
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                    onClick={handleSync}
                    disabled={syncStatus === "syncing"}
                  >
                    {syncStatus === "syncing" ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : syncStatus === "completed" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {syncStatus === "syncing" ? "Syncing..." : syncStatus === "completed" ? "Synced" : "Sync Now"}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Create Backup</h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupName">Backup Name</Label>
                    <Input id="backupName" placeholder="e.g., Full Backup April 2025" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupDescription">Description (Optional)</Label>
                    <Textarea id="backupDescription" placeholder="Optional description for this backup" />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-agri-green-500 hover:bg-agri-green-600">
                      Create Local Backup
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Create Cloud Backup
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Recent Backups</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">Full Backup - April 2025</p>
                        <p className="text-xs text-muted-foreground">24-Apr-2025, 09:15 AM • 5.2 MB</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">Monthly Backup - March 2025</p>
                        <p className="text-xs text-muted-foreground">30-Mar-2025, 11:45 PM • 4.8 MB</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Settings</CardTitle>
              <CardDescription>
                Configure database and data management settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cloudSync">Cloud Synchronization</Label>
                  <Select defaultValue="manual">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic (Every 6 hours)</SelectItem>
                      <SelectItem value="daily">Daily (At midnight)</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose how often data should sync with cloud storage.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="autoBackup">Automatic Backup</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set frequency for automatic local backups.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention</Label>
                  <Select defaultValue="one-year">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="three-months">Three Months</SelectItem>
                      <SelectItem value="six-months">Six Months</SelectItem>
                      <SelectItem value="one-year">One Year</SelectItem>
                      <SelectItem value="forever">Keep Forever</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    How long to retain old transaction data.
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-3">Database Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database Size:</span>
                      <span>12.4 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Optimized:</span>
                      <span>20-Apr-2025</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Records:</span>
                      <span>425</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4">
                    Optimize Database
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-3 text-red-600">Danger Zone</h3>
                  <div className="space-y-3">
                    <Button variant="destructive" className="w-full">Reset Application Data</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Warning: This action cannot be undone. All data will be permanently deleted.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataManagement;
