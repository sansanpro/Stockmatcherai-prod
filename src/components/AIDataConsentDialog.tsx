import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIDataConsentDialogProps {
  isOpen: boolean;
  onConsent: () => void;
  onCancel: () => void;
}

const AIDataConsentDialog = ({ isOpen, onConsent, onCancel }: AIDataConsentDialogProps) => {
  const navigate = useNavigate();

  const handleConsent = () => {
    localStorage.setItem('ai_data_consent', 'true');
    onConsent();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            AI Data Sharing Disclosure
          </DialogTitle>
          <DialogDescription>
            Please review how your data is used before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">What data is shared:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your investment profile (risk tolerance, goals, experience level, sector interests)</li>
              <li>Your chat messages sent to the AI assistant</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Who receives it:</p>
            <p>Your data is sent to our server, which processes requests using <strong>Google Gemini</strong> (a third-party AI service by Google).</p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Purpose:</p>
            <p>To provide personalized stock education and research responses tailored to your investment profile.</p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Data protection:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your data is not used for third-party marketing</li>
              <li>You can revoke consent at any time in Settings</li>
              <li>See our{' '}
                <button
                  onClick={() => { onCancel(); navigate('/support'); }}
                  className="text-primary underline inline"
                >
                  Privacy Policy
                </button>{' '}
                for full details
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleConsent} className="w-full">
            I Agree
          </Button>
          <Button onClick={onCancel} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIDataConsentDialog;
