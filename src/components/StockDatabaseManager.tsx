
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { stockDatabase } from '@/data/stockDatabase';
import { syncStaticDataToSupabase, getStocksFromSupabase } from '@/utils/supabaseStockManager';
import StockDataImporter from './StockDataImporter';
import { useToast } from '@/hooks/use-toast';
import { StockRecommendation } from '@/types/stock-matcher';

const StockDatabaseManager = () => {
  const [loading, setLoading] = useState(false);
  const [supabaseCount, setSupabaseCount] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSyncToSupabase = async () => {
    setLoading(true);
    try {
      const success = await syncStaticDataToSupabase();
      if (success) {
        toast({
          title: "Sync Successful",
          description: `Synced ${stockDatabase.length} stocks to Supabase`,
        });
        await loadSupabaseCount();
      } else {
        toast({
          title: "Sync Failed",
          description: "Please create the stocks table in Supabase first using the SQL migration",
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

  const loadSupabaseCount = async () => {
    try {
      const stocks = await getStocksFromSupabase();
      setSupabaseCount(stocks.length);
    } catch (error) {
      console.error('Error loading Supabase count:', error);
      setSupabaseCount(0);
    }
  };

  const handleImportStocks = (importedStocks: Omit<StockRecommendation, 'whyItFits'>[]) => {
    console.log('Imported stocks:', importedStocks);
    toast({
      title: "Import Successful",
      description: `Imported ${importedStocks.length} stocks`,
    });
    // In a real implementation, you'd add these to your database
    // For now, we just log them and show a success message
  };

  React.useEffect(() => {
    loadSupabaseCount();
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
            <CardTitle className="text-sm font-medium">Static Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockDatabase.length}</div>
            <p className="text-xs text-muted-foreground">stocks in local files</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="secondary">Technology: 10</Badge>
              <Badge variant="secondary">Healthcare: 10</Badge>
              <Badge variant="secondary">Finance: 10</Badge>
              <Badge variant="secondary">Energy: 3</Badge>
              <Badge variant="secondary">Consumer: 4</Badge>
              <Badge variant="secondary">Utilities: 3</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supabase Database</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supabaseCount !== null ? supabaseCount : '...'}
            </div>
            <p className="text-xs text-muted-foreground">stocks in Supabase</p>
            {supabaseCount === 0 && (
              <div className="flex items-center gap-2 mt-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Table not created yet</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="sync">Supabase Sync</TabsTrigger>
        </TabsList>

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

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Supabase Integration
              </CardTitle>
              <CardDescription>
                Sync your static stock data with Supabase for dynamic updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Setup Required</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  You need to create the stocks table in Supabase first. Run this SQL migration:
                </p>
                <pre className="bg-amber-100 p-2 rounded mt-2 text-xs overflow-x-auto">
{`CREATE TABLE public.stocks (
  id TEXT PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  ceo_name TEXT NOT NULL,
  ceo_highlights TEXT NOT NULL,
  pe_ratio DECIMAL NOT NULL,
  market_cap TEXT NOT NULL,
  one_year_return DECIMAL NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  price_per_share DECIMAL NOT NULL,
  dividend_yield DECIMAL NOT NULL,
  esg_score INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);`}
                </pre>
              </div>

              <Button 
                onClick={handleSyncToSupabase}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Syncing...' : `Sync ${stockDatabase.length} Stocks to Supabase`}
              </Button>

              <div className="text-sm text-muted-foreground">
                This will sync all static stock data to your Supabase database,
                allowing for dynamic updates and better performance.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDatabaseManager;
