
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DataManagement = () => {
  const [importType, setImportType] = useState('');
  const [exportType, setExportType] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    details?: any;
  }>({ status: 'idle', message: '' });
  
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setImportStatus({ status: 'processing', message: 'Processing file...' });
    
    // Simulate file processing
    setTimeout(() => {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setImportStatus({
          status: 'success',
          message: 'File imported successfully!',
          details: {
            totalRows: 45,
            successfulImports: 42,
            errors: 3
          }
        });
        toast({
          title: 'Import Successful',
          description: '42 records imported successfully with 3 errors.',
        });
      } else {
        setImportStatus({
          status: 'error',
          message: 'Invalid file format. Please upload a CSV file.'
        });
      }
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleExport = () => {
    if (!exportType) {
      toast({
        title: 'Error',
        description: 'Please select a data type to export.',
        variant: 'destructive'
      });
      return;
    }

    // Simulate export
    const filename = `${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
    toast({
      title: 'Export Started',
      description: `Downloading ${filename}...`,
    });

    // In a real implementation, this would call the Supabase API with CSV format
    console.log('Exporting:', { exportType, dateRange });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-agri-green-700">Data Management</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload CSV files to import farmers or transactions data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-type">Data Type</Label>
              <Select value={importType} onValueChange={setImportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type to import" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmers">Farmers</SelectItem>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-agri-green-500 bg-agri-green-50'
                  : 'border-gray-300 hover:border-agri-green-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-medium">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Choose File
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            {importStatus.status !== 'idle' && (
              <div className={`p-4 rounded-lg border ${
                importStatus.status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : importStatus.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {importStatus.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {importStatus.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  {importStatus.status === 'processing' && <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />}
                  <span className="font-medium">{importStatus.message}</span>
                </div>
                {importStatus.details && (
                  <div className="text-sm space-y-1">
                    <p>Total rows: {importStatus.details.totalRows}</p>
                    <p>Successful imports: {importStatus.details.successfulImports}</p>
                    <p>Errors: {importStatus.details.errors}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download your data as CSV files for backup or analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-type">Data Type</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type to export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmers">Farmers</SelectItem>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="bills">Bills</SelectItem>
                  <SelectItem value="all">All Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="from-date" className="text-xs">From</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="to-date" className="text-xs">To</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleExport} 
              className="w-full bg-agri-green-500 hover:bg-agri-green-600"
              disabled={!exportType}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
          <CardDescription>
            Overview of your current data in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-agri-green-600">42</div>
              <div className="text-sm text-muted-foreground">Farmers</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">124</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-agri-brown-600">87</div>
              <div className="text-sm text-muted-foreground">Inventory Items</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">23</div>
              <div className="text-sm text-muted-foreground">Bills Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagement;
