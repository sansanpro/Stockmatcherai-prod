import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const StockExpansionTrigger = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const sectors = ['technology', 'healthcare', 'finance', 'energy', 'consumer', 'utilities'];

  const expandAllSectors = async () => {
    setLoading(true);
    setResults({});
    
    toast({
      title: "Starting Expansion",
      description: "Expanding all sectors to 50+ stocks each...",
    });

    try {
      const expansionResults: Record<string, any> = {};
      
      for (const sector of sectors) {
        try {
          console.log(`Expanding ${sector} sector...`);
          
          const { data, error } = await supabase.functions.invoke('update-stock-data', {
            body: { 
              sector: sector,
              expand: true,
              updateType: 'manual_expansion'
            }
          });

          if (error) {
            throw error;
          }

          expansionResults[sector] = {
            success: true,
            data: data
          };
          
          console.log(`${sector} expansion result:`, data);
          
        } catch (error) {
          console.error(`Error expanding ${sector}:`, error);
          expansionResults[sector] = {
            success: false,
            error: error.message
          };
        }
        
        // Update results in real-time
        setResults(prev => ({ ...prev, ...expansionResults }));
        
        // Wait between sectors to avoid overwhelming the API
        if (sector !== sectors[sectors.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const successCount = Object.values(expansionResults).filter(r => r.success).length;
      
      toast({
        title: "Expansion Complete!",
        description: `Successfully expanded ${successCount}/${sectors.length} sectors`,
        variant: successCount === sectors.length ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Error during expansion:', error);
      toast({
        title: "Expansion Failed",
        description: error.message || "Failed to expand stock databases",
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
          <Database className="w-5 h-5" />
          Expand All Stock Databases
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          This will immediately expand all sector databases to have at least 50 stocks each using Alpha Vantage data.
        </div>

        <Button 
          onClick={expandAllSectors}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Expanding Databases...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Expand All Sectors Now
            </>
          )}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Expansion Results:</h4>
            {sectors.map(sector => {
              const result = results[sector];
              if (!result) return (
                <div key={sector} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {sector}: Pending...
                </div>
              );
              
              return (
                <div key={sector} className="flex items-center gap-2 text-sm">
                  {result.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="capitalize">{sector}: ✅ Success</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-red-500 rounded-full" />
                      <span className="capitalize">{sector}: ❌ Failed</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockExpansionTrigger;