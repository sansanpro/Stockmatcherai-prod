import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

// Where the AI consent lives; Settings can turn it off again
export const AI_CONSENT_KEY = 'ai_data_consent';

interface AIDataConsentDialogProps {
  isOpen: boolean;
  onConsent: () => void;
  onCancel: () => void;
}

const AIDataConsentDialog = ({ isOpen, onConsent, onCancel }: AIDataConsentDialogProps) => {
  const handleConsent = () => {
    localStorage.setItem(AI_CONSENT_KEY, 'true');
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
              <li>What you told us you care about: your causes, companies you'd never fund, how you'd react to a drop, what the money is for, and your investing experience</li>
              <li>The questions you send to Ask AI</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Who receives it:</p>
            <p>Your data is sent to our server, which processes requests using <strong>Google Gemini</strong> (a third-party AI service by Google).</p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Purpose:</p>
            <p>To answer your questions about companies and investing terms, with your causes in mind.</p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Data protection:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your data is not used for third-party marketing</li>
              <li>Google may use your questions and its answers to improve its services, and its reviewers may read them. Please don't include personal details like your name or account numbers.</li>
              <li>You can turn this off at any time in Settings</li>
              <li>See our{' '}
                <a href="https://stockmatcherai.com/support" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Privacy Policy
                </a>{' '}
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
