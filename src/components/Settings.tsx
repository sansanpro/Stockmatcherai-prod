import Disclaimer from '@/components/values/Disclaimer';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UpgradeModal from '@/components/UpgradeModal';
import SupportSheet from '@/components/support/SupportSheet';
import heart3d from '@/assets/3d/red-heart.png';
import { tipsAvailable, TIP_PRICE } from '@/lib/support';
import { PLAN_LIMITS } from '@/contexts/SubscriptionContext';
import CausePicker from '@/components/onboarding/CausePicker';
import { ChipGroup, ChoiceList } from '@/components/onboarding/Choices';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Save, ArrowLeft, Trash2, AlertTriangle, RotateCcw, Crown, Heart, Shield, ChevronRight } from 'lucide-react';
import { AI_CONSENT_KEY } from '@/components/AIDataConsentDialog';
import { Capacitor } from '@capacitor/core';
import { fetchCauses, type CauseInfo } from '@/lib/matchFeed';
import { DEALBREAKERS, GOAL_OPTIONS, RISK_OPTIONS, toProfileRow, type OnboardingAnswers } from '@/lib/onboarding';
import { track } from '@/lib/analytics';
import { restoreApplePurchases } from '@/services/appleIAPService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SettingsProps {
  onBack: () => void;
  answers: OnboardingAnswers;
  onCausesSaved: (answers: OnboardingAnswers) => void;
}

const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

const Settings = ({ onBack, answers, onCausesSaved }: SettingsProps) => {
  const { user, deleteAccount } = useAuth();
  const { checkSubscription, subscribed } = useSubscription();
  const [values, setValues] = useState<OnboardingAnswers>(answers);
  const [causes, setCauses] = useState<CauseInfo[]>([]);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [aiSharing, setAiSharing] = useState(() => {
    try { return localStorage.getItem(AI_CONSENT_KEY) === 'true'; } catch { return false; }
  });

  // Ask AI asks for permission again before it next sends anything
  const turnOffAiSharing = () => {
    try { localStorage.removeItem(AI_CONSENT_KEY); } catch { /* storage blocked */ }
    setAiSharing(false);
    toast.success("Ask AI will ask for your permission again before sending anything.");
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      await restoreApplePurchases();
      await checkSubscription();
      toast.success('Purchases restored!');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to restore purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    const { error } = await deleteAccount();
    setIsDeleting(false);
    if (!error) onBack();
  };

  useEffect(() => {
    fetchCauses().then(setCauses).catch(() => {});
  }, []);

  const changed = JSON.stringify(values) !== JSON.stringify(answers);

  const handleValuesSave = async () => {
    if (!user?.id || values.causes.length === 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert(toProfileRow(values, user.id), { onConflict: 'user_id' });
      if (error) throw error;
      track('causes_updated', { source: 'settings', causes: values.causes });
      onCausesSaved(values);
      toast.success('Saved.');
    } catch {
      toast.error("Couldn't save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDealbreaker = (id: string) => setValues(v => ({
    ...v,
    dealbreakers: v.dealbreakers.includes(id) ? v.dealbreakers.filter(d => d !== id) : [...v.dealbreakers, id],
  }));

  return (
    <div className="min-h-screen w-full bg-cream text-ink overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/85 backdrop-blur-md border-b border-line px-4 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={onBack}
            className="w-9 h-9 rounded-full bg-white border border-line hover:bg-sand flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
          {subscribed && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-premium-ink bg-premium-tint px-2.5 py-1 rounded-full border border-premium-line">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* Upgrade banner — only shown to free users */}
        {!subscribed && (
          <section className="rounded-2xl overflow-hidden border border-premium-line bg-premium-tint">
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-premium flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">Go deeper with Premium</p>
                <p className="text-xs text-ink-soft">{PLAN_LIMITS.premium.dailyMatches} matches a day, unlimited Ask AI, side-by-side compare</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
                className="flex-shrink-0 bg-premium hover:bg-premium/90 text-white font-semibold border-0"
              >
                See Premium
              </Button>
            </div>
          </section>
        )}

        {/* Account section */}
        <section className="rounded-2xl overflow-hidden border border-line bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-clay-tint flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">Account</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-ink-faint uppercase tracking-wide">Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
                autoCorrect="off"
                autoComplete="name"
                className="bg-white border-line text-ink placeholder:text-ink-muted focus:border-primary rounded-xl h-11 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-ink-faint uppercase tracking-wide">Email</Label>
              <Input value={user?.email || ''} disabled
                className="bg-sand border-line text-ink-faint rounded-xl h-11 cursor-not-allowed" />
              <p className="text-xs text-ink-faint">Email cannot be changed</p>
            </div>
            {isIOSNative && (
              <button onClick={handleRestorePurchases} disabled={isRestoring}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
                <RotateCcw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </button>
            )}
          </div>
        </section>

        {/* What you care about (drives matching) */}
        <section className="rounded-2xl overflow-hidden border border-line bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-clay-tint flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">What you care about</h2>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <Label className="text-xs text-ink-faint uppercase tracking-wide">Your causes</Label>
              <p className="text-xs text-ink-faint mt-1 mb-3">Pick up to 3. Your first pick matters most.</p>
              <CausePicker causes={causes} selected={values.causes} onChange={c => setValues(v => ({ ...v, causes: c }))} />
            </div>
            <div>
              <Label className="text-xs text-ink-faint uppercase tracking-wide">Never show me companies tied to</Label>
              <div className="mt-3">
                <ChipGroup name="Dealbreakers" multiple options={DEALBREAKERS} selected={values.dealbreakers} onToggle={toggleDealbreaker} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-ink-faint uppercase tracking-wide">If a company you own drops 20% in a month</Label>
              <div className="mt-3">
                <ChoiceList name="If a stock drops 20%" options={RISK_OPTIONS} value={values.risk} onSelect={id => setValues(v => ({ ...v, risk: id }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-ink-faint uppercase tracking-wide">What this money is for</Label>
              <div className="mt-3">
                <ChoiceList name="Goal" options={GOAL_OPTIONS} value={values.goal} onSelect={id => setValues(v => ({ ...v, goal: id }))} />
              </div>
            </div>
            <Button onClick={handleValuesSave} disabled={loading || !changed || values.causes.length === 0}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </section>

        {/* Privacy */}
        <section className="rounded-2xl overflow-hidden border border-line bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-clay-tint flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">Privacy</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Ask AI data sharing</p>
                <p className="text-xs text-ink-faint">
                  {aiSharing
                    ? 'On: your causes and questions are sent to Google Gemini when you use Ask AI.'
                    : "Off: Ask AI will ask before sending anything."}
                </p>
              </div>
              {aiSharing && (
                <Button size="sm" variant="outline" onClick={turnOffAiSharing}
                  className="flex-shrink-0 rounded-xl border-line bg-white text-ink hover:bg-sand">
                  Turn off
                </Button>
              )}
            </div>
            <a href="https://stockmatcherai.com/support" target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary underline">
              Privacy Policy
            </a>
          </div>
        </section>

        {/* Optional tip to StockMatcherAI: always here, never asked for elsewhere except once a week on the recap */}
        {tipsAvailable() && (
          <section className="rounded-2xl overflow-hidden border border-support-line bg-support-tint">
            <button onClick={() => setShowSupport(true)} className="w-full p-4 flex items-center gap-4 text-left">
              <img src={heart3d} alt="" aria-hidden className="w-10 h-10 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">Support StockMatcherAI</p>
                <p className="text-xs text-ink-soft">An optional {TIP_PRICE} tip that helps keep the app going. It doesn't unlock anything.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-soft flex-shrink-0" aria-hidden />
            </button>
          </section>
        )}

        {/* Danger Zone */}
        <section className="rounded-2xl overflow-hidden border border-caution-line bg-caution-tint">
          <div className="px-4 py-3 border-b border-caution-line flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-caution" />
            <h2 className="font-semibold text-sm text-caution">Danger Zone</h2>
          </div>
          <div className="p-4">
            <p className="text-xs text-ink-faint mb-4">
              Permanently delete your account and all data. This cannot be undone.
            </p>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"
                  className="flex items-center gap-2 rounded-xl h-11 bg-white hover:bg-caution-soft text-caution border border-caution-line">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>This will permanently delete your account including your profile, matches, and chat history.</p>
                    <p className="font-semibold text-foreground pt-2">
                      Type <span className="font-mono bg-muted px-1 rounded">DELETE</span> to confirm:
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="mt-2"
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                  <Button variant="destructive" onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete My Account'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
        <Disclaimer className="pb-6" />
      </div>

      <SupportSheet isOpen={showSupport} onClose={() => setShowSupport(false)} source="profile" />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default Settings;
