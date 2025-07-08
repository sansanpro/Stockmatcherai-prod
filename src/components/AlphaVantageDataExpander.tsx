import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createStockDataService } from '@/services/stockDataService';
import { addImportedStocks, syncStaticDataToSupabase } from '@/utils/supabaseStockManager';

const AlphaVantageDataExpander = () => {
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const { toast } = useToast();

  const expandTechnologyStocks = async () => {
    setLoading(true);
    try {
      // Get Alpha Vantage API key from environment
      const apiKey = 'demo'; // This will use the demo key, user needs to set up real key
      
      toast({
        title: "Starting Import",
        description: "Fetching live stock data from Alpha Vantage...",
      });

      const stockDataService = createStockDataService(apiKey);
      const liveStockData = await stockDataService.getStockData();
      
      // Filter for technology stocks only
      const techStocks = liveStockData.filter(stock => 
        stock.sector.toLowerCase().includes('technology') || 
        stock.sector.toLowerCase().includes('tech')
      );
      
      console.log(`Found ${techStocks.length} technology stocks from Alpha Vantage`);
      
      // Add to imported stocks
      addImportedStocks(techStocks);
      setImportedCount(techStocks.length);
      
      // Sync to database
      const syncSuccess = await syncStaticDataToSupabase();
      
      if (syncSuccess) {
        toast({
          title: "Success!",
          description: `Imported ${techStocks.length} technology stocks from Alpha Vantage`,
        });
      } else {
        throw new Error('Failed to sync imported stocks to database');
      }
      
    } catch (error) {
      console.error('Error expanding technology stocks:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import stocks from Alpha Vantage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Expand Technology Stocks
        </CardTitle>
        <CardDescription>
          Import more technology stocks from Alpha Vantage to give users more variety
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">What this does:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Fetches live data for 40+ technology stocks from Alpha Vantage</li>
              <li>Adds them to your database alongside the existing 10 stocks</li>
              <li>Users will have 50+ technology stocks to swipe through</li>
              <li>Data includes current prices, P/E ratios, and market caps</li>
            </ul>
          </div>
        </div>

        {importedCount > 0 && (
          <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              ✅ Successfully imported {importedCount} technology stocks!
            </p>
          </div>
        )}

        <Button 
          onClick={expandTechnologyStocks}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing from Alpha Vantage...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Import Technology Stocks from Alpha Vantage
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Note: This will use your Alpha Vantage API quota. Make sure you have sufficient API calls remaining.
        </p>
      </CardContent>
    </Card>
  );
};

export default AlphaVantageDataExpander;