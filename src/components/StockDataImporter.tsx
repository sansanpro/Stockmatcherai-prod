
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseCSVStockData, parseJSONStockData, downloadSampleCSV } from '@/utils/csvImporter';
import { addImportedStocks } from '@/utils/supabaseStockManager';
import { StockRecommendation } from '@/types/stock-matcher';
import { Upload, Download, FileText, Database } from 'lucide-react';

interface StockDataImporterProps {
  onImport: (stocks: Omit<StockRecommendation, 'whyItFits'>[]) => void;
}

const StockDataImporter = ({ onImport }: StockDataImporterProps) => {
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    try {
      const content = await file.text();
      let stocks: Omit<StockRecommendation, 'whyItFits'>[] = [];
      
      if (file.name.endsWith('.csv')) {
        stocks = parseCSVStockData(content);
      } else if (file.name.endsWith('.json')) {
        stocks = parseJSONStockData(content);
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }
      
      if (stocks.length > 0) {
        // Add to global imported stocks storage
        addImportedStocks(stocks);
        
        // Call the callback to update UI
        onImport(stocks);
        setImportedCount(stocks.length);
      } else {
        throw new Error('No valid stock data found in file.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Stock Data Importer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Import from CSV or JSON</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              disabled={importing}
              className="flex-1"
            />
            <Button
              onClick={downloadSampleCSV}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Sample CSV
            </Button>
          </div>
          {importing && (
            <p className="text-sm text-blue-600">Importing stock data...</p>
          )}
          {importedCount > 0 && (
            <p className="text-sm text-green-600">
              Successfully imported {importedCount} stocks! Now go to the Sync tab to add them to Supabase.
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Import Instructions
          </h4>
          <div className="text-sm space-y-2">
            <p><strong>CSV Format:</strong> Include headers: ticker, companyName, sector, peRatio, marketCap, pricePerShare, dividendYield, oneYearReturn, riskLevel, ceoName, ceoHighlights, esgScore</p>
            <p><strong>JSON Format:</strong> Array of objects with the same properties as CSV headers</p>
            <p><strong>Risk Levels:</strong> Use 'low', 'medium', or 'high'</p>
            <p><strong>Sample Data:</strong> Download the sample CSV to see the expected format</p>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Recommended Data Sources</h4>
          <ul className="text-sm space-y-1">
            <li>• Yahoo Finance (export historical data)</li>
            <li>• SEC EDGAR database (company filings)</li>
            <li>• Kaggle financial datasets</li>
            <li>• Financial data APIs (IEX Cloud, Finnhub)</li>
            <li>• Manual compilation from financial websites</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockDataImporter;
