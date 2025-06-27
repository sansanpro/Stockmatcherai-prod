
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StockRecommendation } from '@/types/stock-matcher';
import { Share, Twitter, Facebook, Link2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialSharingProps {
  stock: StockRecommendation;
}

const SocialSharing = ({ stock }: SocialSharingProps) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareText = `Check out ${stock.companyName} (${stock.ticker})! ${stock.oneYearReturn > 0 ? '+' : ''}${stock.oneYearReturn.toFixed(1)}% return this year. Found on Stock Matcher AI! 📈`;
  const shareUrl = window.location.origin;

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowShareOptions(!showShareOptions)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Share className="w-4 h-4" />
        Share
      </Button>

      {showShareOptions && (
        <Card className="absolute top-12 right-0 w-48 z-50 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-3 space-y-2">
            <Button
              onClick={shareToTwitter}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Twitter className="w-4 h-4 text-blue-500" />
              Twitter
            </Button>
            <Button
              onClick={shareToFacebook}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SocialSharing;
