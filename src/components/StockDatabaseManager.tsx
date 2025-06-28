
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Upload, RefreshCw, FileText } from 'lucide-react';
import StockDataImporter from './StockDataImporter';
import { StockRecommendation } from '@/types/stock-matcher';
import { insertStocksToSupabase, syncStaticDataToSupabase, getStocksFromSupabase } from '@/utils/supabaseStockManager';
import { stockDatabase } from '@/data/stockDatabase';

const StockDatabaseManager = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [stockCount, setStockCount] = useState(stockDatabase.length);

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setSyncStatus(null);
    
    try {
      const success = await syncStaticDataToSupabase();
      if (success) {
        setSyncStatus(`Successfully synced ${stockDatabase.length} stocks to Supabase database`);
      } else {
        setSyncStatus('Failed to sync stocks to database');
      }
    } catch (error) {
      setSyncStatus(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleImportStocks = async (stocks: Omit<StockRecommendation, 'whyItFits'>[]) => {
    const success = await insertStocksToSupabase(stocks);
    if (success) {
      setSyncStatus(`Successfully imported ${stocks.length} new stocks to database`);
      setStockCount(prev => prev + stocks.length);
    } else {
      setSyncStatus('Failed to import stocks to database');
    }
  };

  const handleCheckSupabase = async () => {
    const supabaseStocks = await getStocksFromSupabase();
    setSyncStatus(`Found ${supabaseStocks.length} stocks in Supabase database`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            Stock Database Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stockCount}</div>
              <div className="text-sm text-blue-600">Static Database Stocks</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">6</div>
              <div className="text-sm text-green-600">Sectors Covered</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-sm text-purple-600">Scalable to Any Size</div>
            </div>
          </div>

          <Tabs defaultValue="manage" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manage">Manage</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="manage" className="space-y-4">
              <div className="grid gap-4">
                <Button 
                  onClick={handleSyncToSupabase}
                  disabled={syncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Static Data to Supabase'}
                </Button>
                
                <Button 
                  onClick={handleCheckSupabase}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Check Supabase Database
                </Button>
              </div>

              {syncStatus && (
                <div className={`p-3 rounded-lg text-sm ${
                  syncStatus.includes('Failed') || syncStatus.includes('failed') 
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                    : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                }`}>
                  {syncStatus}
                </div>
              )}
            </TabsContent>

            <TabsContent value="import">
              <StockDataImporter onImport={handleImportStocks} />
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Current Database Structure
                </h4>
                <div className="text-sm space-y-2">
                  <p><strong>Technology:</strong> Apple, Microsoft, Google, Amazon, Tesla, NVIDIA, Meta, Netflix, Adobe, Salesforce</p>
                  <p><strong>Healthcare:</strong> Johnson & Johnson, Pfizer, UnitedHealth, Merck, AbbVie, Eli Lilly, Thermo Fisher</p>
                  <p><strong>Finance:</strong> JPMorgan Chase, Bank of America, Visa, Mastercard, Goldman Sachs</p>
                  <p><strong>Energy:</strong> Exxon Mobil, Chevron, ConocoPhillips</p>
                  <p><strong>Consumer:</strong> Coca-Cola, PepsiCo, Walmart, Home Depot</p>
                  <p><strong>Utilities:</strong> Verizon, AT&T, NextEra Energy</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Scaling Options</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ <strong>Sector-based files:</strong> Organized by industry for easy management</li>
                  <li>✅ <strong>CSV/JSON import:</strong> Bulk import from external data sources</li>
                  <li>✅ <strong>Supabase storage:</strong> Database-backed stock management</li>
                  <li>🔄 <strong>API integration:</strong> Optional live data when available</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockDatabaseManager;
