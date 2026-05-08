import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UpgradeModal from '@/components/UpgradeModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UserProfile } from '@/types/stock-matcher';
import { toast } from 'sonner';
import { User, Save, ArrowLeft, Trash2, AlertTriangle, RotateCcw, Crown, Zap } from 'lucide-react';
import { saveUserProfile, getUserProfile } from '@/utils/profileManager';
import { Capacitor } from '@capacitor/core';
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
  userProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
}

const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

const incomeRangeMap: { [key: string]: number } = {
  '0-50000': 25000,
  '50000-85000': 67500,
  '85000-100000': 92500,
  '100000-150000': 125000,
  '150000-200000': 175000,
  '200000+': 250000,
};

const getIncomeRangeFromSalary = (salary: number | null | undefined): string => {
  if (!salary) return '';
  if (salary < 50000) return '0-50000';
  if (salary < 85000) return '50000-85000';
  if (salary < 100000) return '85000-100000';
  if (salary < 150000) return '100000-150000';
  if (salary < 200000) return '150000-200000';
  return '200000+';
};

const Settings = ({ onBack, userProfile, onProfileUpdate }: SettingsProps) => {
  const { user, deleteAccount } = useAuth();
  const { checkSubscription, subscribed } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(userProfile);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
    if (userProfile) {
      setProfile(userProfile);
    } else if (user?.id) {
      loadUserProfile();
    }
  }, [userProfile, user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    try {
      const loaded = await getUserProfile(user.id);
      if (loaded) {
        setProfile(loaded);
        onProfileUpdate(loaded);
      }
    } catch {}
  };

  const handleProfileSave = async () => {
    if (!profile || !user?.id) return;
    setLoading(true);
    try {
      const success = await saveUserProfile(profile, user.id);
      if (success) {
        onProfileUpdate(profile);
        toast.success('Profile updated!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof UserProfile, value: string | number) => {
    if (!profile) return;
    setProfile(prev => ({ ...prev!, [field]: value }));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f0a1e] via-[#130d2a] to-[#0a0614] text-white overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#130d2a]/80 backdrop-blur-md border-b border-white/10 px-4 py-3 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
          {subscribed && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full border border-yellow-400/20">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* Upgrade banner — only shown to free users */}
        {!subscribed && (
          <section className="rounded-2xl overflow-hidden border border-yellow-400/30 bg-gradient-to-r from-yellow-400/10 to-orange-500/10">
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Upgrade to Premium</p>
                <p className="text-xs text-white/60">Unlimited swipes, AI assistant & more</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
                className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold border-0"
              >
                Upgrade
              </Button>
            </div>
          </section>
        )}

        {/* Account section */}
        <section className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="font-semibold text-sm">Account</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60 uppercase tracking-wide">Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
                className="bg-white/8 border-white/15 text-white placeholder:text-white/30 focus:border-primary rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60 uppercase tracking-wide">Email</Label>
              <Input value={user?.email || ''} disabled
                className="bg-white/5 border-white/10 text-white/40 rounded-xl h-11 cursor-not-allowed" />
              <p className="text-xs text-white/30">Email cannot be changed</p>
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

        {/* Investment Profile */}
        {profile && (
          <section className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="font-semibold text-sm">Investment Profile</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/60 uppercase tracking-wide">Age</Label>
                  <Input type="number" min="18" max="100" value={profile.age}
                    onChange={e => set('age', parseInt(e.target.value))}
                    className="bg-white/8 border-white/15 text-white rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/60 uppercase tracking-wide">Gender</Label>
                  <Select value={profile.gender} onValueChange={v => set('gender', v)}>
                    <SelectTrigger className="bg-white/8 border-white/15 text-white rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {[
                {
                  label: 'Annual Income', key: 'salary' as keyof UserProfile, type: 'select',
                  value: getIncomeRangeFromSalary(profile.salary),
                  onChange: (v: string) => set('salary', incomeRangeMap[v]),
                  options: [
                    { value: '0-50000', label: '$0 – $50,000' },
                    { value: '50000-85000', label: '$50,000 – $85,000' },
                    { value: '85000-100000', label: '$85,000 – $100,000' },
                    { value: '100000-150000', label: '$100,000 – $150,000' },
                    { value: '150000-200000', label: '$150,000 – $200,000' },
                    { value: '200000+', label: '$200,000+' },
                  ]
                },
                {
                  label: 'Experience', key: 'experience' as keyof UserProfile, type: 'select',
                  value: profile.experience,
                  onChange: (v: string) => set('experience', v),
                  options: [
                    { value: 'none', label: 'Never invested before' },
                    { value: 'beginner', label: 'Less than 1 year' },
                    { value: 'intermediate', label: '1–5 years' },
                    { value: 'advanced', label: '5+ years' },
                  ]
                },
                {
                  label: 'Risk Tolerance', key: 'riskTolerance' as keyof UserProfile, type: 'select',
                  value: profile.riskTolerance,
                  onChange: (v: string) => set('riskTolerance', v),
                  options: [
                    { value: 'low', label: 'Low — Stable returns' },
                    { value: 'medium', label: 'Medium — Some volatility ok' },
                    { value: 'high', label: 'High — Max growth' },
                  ]
                },
                {
                  label: 'Preferred Sector', key: 'sectorPreference' as keyof UserProfile, type: 'select',
                  value: profile.sectorPreference,
                  onChange: (v: string) => set('sectorPreference', v),
                  options: [
                    { value: 'technology', label: 'Technology' },
                    { value: 'healthcare', label: 'Healthcare' },
                    { value: 'finance', label: 'Finance' },
                    { value: 'energy', label: 'Energy' },
                    { value: 'consumer', label: 'Consumer Goods' },
                    { value: 'utilities', label: 'Utilities' },
                    { value: 'any', label: 'No preference' },
                  ]
                },
                {
                  label: 'Investment Goal', key: 'investmentGoal' as keyof UserProfile, type: 'select',
                  value: profile.investmentGoal,
                  onChange: (v: string) => set('investmentGoal', v),
                  options: [
                    { value: 'growth', label: 'Long-term growth' },
                    { value: 'income', label: 'Regular income (dividends)' },
                    { value: 'balance', label: 'Balanced' },
                    { value: 'retirement', label: 'Retirement planning' },
                    { value: 'short-term', label: 'Short-term gains' },
                  ]
                },
              ].map(field => (
                <div key={field.label} className="space-y-1.5">
                  <Label className="text-xs text-white/60 uppercase tracking-wide">{field.label}</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-white/8 border-white/15 text-white rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <Button onClick={handleProfileSave} disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2">
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </section>
        )}

        {/* Danger Zone */}
        <section className="rounded-2xl overflow-hidden border border-red-500/20 bg-red-500/5">
          <div className="px-4 py-3 border-b border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="font-semibold text-sm text-red-400">Danger Zone</h2>
          </div>
          <div className="p-4">
            <p className="text-xs text-white/40 mb-4">
              Permanently delete your account and all data. This cannot be undone.
            </p>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"
                  className="flex items-center gap-2 rounded-xl h-11 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30">
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
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default Settings;
