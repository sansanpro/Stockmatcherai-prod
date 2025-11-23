import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddResult {
  ticker: string;
  success: boolean;
  error?: string;
  sector?: string;
  companyName?: string;
  price?: number;
  alreadyExists?: boolean;
}

const StockAdder = () => {
  const [tickerInput, setTickerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AddResult[]>([]);
  const { toast } = useToast();

  const handleAddStocks = async () => {
    if (!tickerInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter at least one ticker symbol",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const tickers = tickerInput
        .split(',')
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0);

      const { data, error } = await supabase.functions.invoke('add-stocks', {
        body: { tickers }
      });

      if (error) {
        if (error.message?.includes('update is currently running')) {
          toast({
            title: "Update in Progress",
            description: "Stock data is currently being updated. Please wait a few minutes and try again.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      setResults(data.results || []);
      
      const successCount = data.results?.filter((r: AddResult) => r.success).length || 0;
      const failCount = data.results?.filter((r: AddResult) => !r.success).length || 0;

      if (successCount > 0) {
        toast({
          title: "Stocks Added",
          description: `Successfully added ${successCount} stock${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      } else {
        toast({
          title: "Addition Failed",
          description: `Failed to add stocks. ${failCount} error${failCount > 1 ? 's' : ''}`,
          variant: "destructive"
        });
      }

      // Clear input on success
      if (successCount > 0) {
        setTickerInput('');
      }

    } catch (error) {
      console.error('Error adding stocks:', error);
      toast({
        title: "Error",
        description: "Failed to add stocks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Stocks by Ticker
          </CardTitle>
          <CardDescription>
            Enter ticker symbols separated by commas (e.g., AAPL, MSFT, GOOGL)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter ticker symbols (comma-separated)"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleAddStocks()}
              disabled={loading}
            />
            <Button 
              onClick={handleAddStocks} 
              disabled={loading || !tickerInput.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stocks
                </>
              )}
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Each stock addition requires 2 API calls. With 300 calls/minute, you can add ~150 stocks per minute. 
              Stock additions are paused if a data update is running to prevent rate limit conflicts.
            </AlertDescription>
          </Alert>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Results:</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : result.alreadyExists
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : result.alreadyExists ? (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{result.ticker}</span>
                        {result.success && result.companyName && (
                          <span className="text-sm text-muted-foreground">
                            {result.companyName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.success && result.sector && (
                          <Badge variant="secondary">
                            {result.sector}
                          </Badge>
                        )}
                        {result.success && result.price && (
                          <Badge variant="outline">
                            ${result.price.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {result.error && (
                      <p className="text-sm mt-1 text-muted-foreground">
                        {result.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Popular Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['NVDA', 'AMD', 'TSM', 'INTC', 'QCOM', 'AVGO', 'MU', 'AMAT', 'LRCX', 'KLAC'].map(ticker => (
              <Button
                key={ticker}
                variant="outline"
                size="sm"
                onClick={() => setTickerInput(prev => prev ? `${prev}, ${ticker}` : ticker)}
                disabled={loading}
              >
                {ticker}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAdder;
