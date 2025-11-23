
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { stockDatabase } from '@/data/stockDatabase';
import { syncStaticDataToSupabase, getStockCountsByType } from '@/utils/supabaseStockManager';
import StockDataImporter from './StockDataImporter';
import AlphaVantageDataExpander from './AlphaVantageDataExpander';
import StockExpansionTrigger from './StockExpansionTrigger';
import StockAdder from './StockAdder';
import { useToast } from '@/hooks/use-toast';
import { StockRecommendation } from '@/types/stock-matcher';

const StockDatabaseManager = () => {
  const [loading, setLoading] = useState(false);
  const [supabaseCounts, setSupabaseCounts] = useState<Record<string, number>>({});
  const [synced, setSynced] = useState(false);
  const [importedStocks, setImportedStocks] = useState<Omit<StockRecommendation, 'whyItFits'>[]>([]);
  const { toast } = useToast();

  const handleSyncToSupabase = async () => {
    setLoading(true);
    try {
      const success = await syncStaticDataToSupabase();
      if (success) {
        const totalStocks = stockDatabase.length + importedStocks.length;
        toast({
          title: "Sync Successful",
          description: `Synced ${totalStocks} stocks to Supabase sector tables`,
        });
        setSynced(true);
        await loadSupabaseCounts();
      } else {
        toast({
          title: "Sync Failed",
          description: "Failed to sync some data to Supabase",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync data to Supabase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSupabaseCounts = async () => {
    try {
      const counts = await getStockCountsByType();
      setSupabaseCounts(counts);
      
      // Check if any data exists
      const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
      if (totalCount > 0) {
        setSynced(true);
      }
    } catch (error) {
      console.error('Error loading Supabase counts:', error);
      setSupabaseCounts({});
    }
  };

  const handleImportStocks = (newImportedStocks: Omit<StockRecommendation, 'whyItFits'>[]) => {
    console.log('Imported stocks:', newImportedStocks);
    setImportedStocks(prev => [...prev, ...newImportedStocks]);
    toast({
      title: "Import Successful",
      description: `Imported ${newImportedStocks.length} stocks. Click sync to add them to Supabase.`,
    });
  };

  const getTotalSupabaseCount = () => {
    return Object.values(supabaseCounts).reduce((sum, count) => sum + count, 0);
  };

  const getTotalAvailableStocks = () => {
    return stockDatabase.length + importedStocks.length;
  };

  React.useEffect(() => {
    loadSupabaseCounts();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Stock Database Manager</h1>
        <p className="text-muted-foreground">
          Manage your stock database with imports, exports, and Supabase sync
        </p>
      </div>

      {/* Database Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Stocks</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalAvailableStocks()}</div>
            <p className="text-xs text-muted-foreground">
              {stockDatabase.length} static + {importedStocks.length} imported
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="secondary">Static: {stockDatabase.length}</Badge>
              {importedStocks.length > 0 && (
                <Badge variant="outline">Imported: {importedStocks.length}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supabase Database</CardTitle>
            {synced ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalSupabaseCount()}
            </div>
            <p className="text-xs text-muted-foreground">stocks in sector tables</p>
            {Object.keys(supabaseCounts).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(supabaseCounts).map(([sector, count]) => (
                  <Badge key={sector} variant="outline">
                    {sector.charAt(0).toUpperCase() + sector.slice(1)}: {count}
                  </Badge>
                ))}
              </div>
            )}
            {getTotalSupabaseCount() === 0 && (
              <div className="flex items-center gap-2 mt-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">No data synced yet</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="add">Add Stocks</TabsTrigger>
          <TabsTrigger value="expand">Expand Stocks</TabsTrigger>
          <TabsTrigger value="sync">Supabase Sync</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-4">
          <StockAdder />
        </TabsContent>

        <TabsContent value="expand" className="space-y-4">
          <StockExpansionTrigger />
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Supabase Sector Tables
              </CardTitle>
              <CardDescription>
                Sync your stock data (static + imported) with Supabase sector-specific tables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {synced && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Data Successfully Synced</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Stock data has been organized into sector-specific tables in Supabase.
                  </p>
                </div>
              )}

              {importedStocks.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">Ready to Sync</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    You have {importedStocks.length} imported stocks ready to sync to Supabase.
                  </p>
                </div>
              )}

              <Button 
                onClick={handleSyncToSupabase}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Syncing...' : `Sync ${getTotalAvailableStocks()} Stocks to Sector Tables`}
              </Button>

              <div className="text-sm text-muted-foreground">
                This will organize all stock data into sector-specific tables in Supabase:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Technology stocks → technology_stocks table</li>
                  <li>Healthcare stocks → healthcare_stocks table</li>
                  <li>Finance stocks → finance_stocks table</li>
                  <li>Energy stocks → energy_stocks table</li>
                  <li>Consumer stocks → consumer_stocks table</li>
                  <li>Utilities stocks → utilities_stocks table</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Stock Data
              </CardTitle>
              <CardDescription>
                Upload CSV or JSON files to expand your stock database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockDataImporter onImport={handleImportStocks} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDatabaseManager;
