import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/types/stock-matcher';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface UserProfileFormProps {
  onComplete: (profile: UserProfile) => void;
  existingProfile?: UserProfile;
  isUpdate?: boolean;
}

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

// Read onboarding answers saved during Auth flow to pre-populate
const getOnboardingDefaults = (): Partial<UserProfile> => {
  try {
    const raw = localStorage.getItem('onboarding_answers');
    if (!raw) return {};
    const answers = JSON.parse(raw);
    return {
      riskTolerance: answers.style || undefined,
      sectorPreference: answers.interests?.[0] || undefined,
      investmentGoal: answers.goal === 'none' ? 'growth' : (answers.goal || undefined),
    };
  } catch {
    return {};
  }
};

const STEP_LABELS = ['About you', 'Experience', 'Preferences'];

const UserProfileForm = ({ onComplete, existingProfile, isUpdate = false }: UserProfileFormProps) => {
  const { user } = useAuth();
  const defaults = isUpdate ? {} : getOnboardingDefaults();
  const [profile, setProfile] = useState<Partial<UserProfile>>(existingProfile || defaults);
  const [loading, setLoading] = useState(false);
  // isUpdate shows all fields at once; new users go step-by-step
  const [step, setStep] = useState(0);
  const totalSteps = isUpdate ? 1 : 3;

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to save your profile');
      return;
    }
    if (!isProfileComplete(profile)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        user_id: user.id,
        age: profile.age,
        gender: profile.gender,
        salary: profile.salary,
        investment_experience: profile.experience,
        risk_tolerance: profile.riskTolerance,
        sectors_of_interest: [profile.sectorPreference],
        investment_goals: [profile.investmentGoal],
        age_range: `${profile.age}-${(profile.age ?? 0) + 10}`,
        income_level: profile.salary?.toString() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        toast.error('Failed to save profile. Please try again.');
        return;
      }

      localStorage.removeItem('onboarding_answers');
      toast.success(isUpdate ? 'Profile updated!' : 'Profile saved!');
      onComplete(profile as UserProfile);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (msg.includes('row-level security')) {
        toast.error('Permission denied. Please refresh and try again.');
      } else {
        toast.error(`Failed to save profile: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = (p: Partial<UserProfile>): p is UserProfile =>
    !!(p.age && p.gender && (p.salary || p.salary === 0) && p.experience && p.riskTolerance && p.sectorPreference && p.investmentGoal);

  const canAdvanceStep = () => {
    if (step === 0) return !!(profile.age && profile.salary !== undefined && profile.gender);
    if (step === 1) return !!(profile.experience && profile.riskTolerance);
    return !!(profile.sectorPreference && profile.investmentGoal);
  };

  const set = (field: keyof UserProfile, value: unknown) =>
    setProfile(prev => ({ ...prev, [field]: value }));

  // ── UPDATE MODE: single page ───────────────────────────────────────────────
  if (isUpdate) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6">Update your profile</h2>
        <div className="space-y-5">
          <StepAbout profile={profile} set={set} />
          <StepExperience profile={profile} set={set} />
          <StepPreferences profile={profile} set={set} />
          <Button onClick={handleSubmit} disabled={!isProfileComplete(profile) || loading}
            className="w-full" size="lg">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    );
  }

  // ── NEW USER: 3-step wizard ────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full flex flex-col p-6 pt-[env(safe-area-inset-top)] max-w-md mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{STEP_LABELS[step]}</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-2xl font-bold dark:text-white mb-1">Tell us a bit about you</h2>
              <p className="text-gray-500 text-sm">We use this to find stocks that actually fit your life.</p>
            </div>
            <StepAbout profile={profile} set={set} />
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-2xl font-bold dark:text-white mb-1">Your investing background</h2>
              <p className="text-gray-500 text-sm">No experience needed — we'll match accordingly.</p>
            </div>
            <StepExperience profile={profile} set={set} />
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-2xl font-bold dark:text-white mb-1">Almost done!</h2>
              <p className="text-gray-500 text-sm">Pick your favourite sector and goal to finalize your matches.</p>
            </div>
            <StepPreferences profile={profile} set={set} />
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)}
            className="flex-1 h-12 rounded-xl flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}

        {step < totalSteps - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvanceStep()}
            className="flex-1 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-40">
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!isProfileComplete(profile) || loading}
            className="flex-1 h-12 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-semibold disabled:opacity-40">
            {loading ? 'Saving...' : 'Find My Matches 🚀'}
          </Button>
        )}
      </div>
    </div>
  );
};

// ── Sub-components for each step ──────────────────────────────────────────────

const StepAbout = ({ profile, set }: { profile: Partial<UserProfile>; set: (f: keyof UserProfile, v: unknown) => void }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input id="age" type="number" min="18" max="100" placeholder="29"
          inputMode="numeric"
          value={profile.age || ''}
          onChange={e => {
            const v = e.target.value;
            const n = v === '' ? null : parseInt(v, 10);
            set('age', isNaN(n as number) ? null : n);
          }} required className="text-base" />
      </div>
      <div className="space-y-2">
        <Label>Gender</Label>
        <Select onValueChange={v => set('gender', v)} value={profile.gender}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="space-y-2">
      <Label>Annual Income</Label>
      <Select onValueChange={v => set('salary', incomeRangeMap[v])} value={getIncomeRangeFromSalary(profile.salary)}>
        <SelectTrigger><SelectValue placeholder="Select your income range" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="0-50000">$0 – $50,000</SelectItem>
          <SelectItem value="50000-85000">$50,000 – $85,000</SelectItem>
          <SelectItem value="85000-100000">$85,000 – $100,000</SelectItem>
          <SelectItem value="100000-150000">$100,000 – $150,000</SelectItem>
          <SelectItem value="150000-200000">$150,000 – $200,000</SelectItem>
          <SelectItem value="200000+">$200,000+</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const StepExperience = ({ profile, set }: { profile: Partial<UserProfile>; set: (f: keyof UserProfile, v: unknown) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Investment Experience</Label>
      <Select onValueChange={v => set('experience', v)} value={profile.experience}>
        <SelectTrigger><SelectValue placeholder="How long have you been investing?" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Never invested before</SelectItem>
          <SelectItem value="beginner">Less than 1 year</SelectItem>
          <SelectItem value="intermediate">1–5 years</SelectItem>
          <SelectItem value="advanced">5+ years</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Risk Tolerance</Label>
      <Select onValueChange={v => set('riskTolerance', v)} value={profile.riskTolerance}>
        <SelectTrigger><SelectValue placeholder="How much risk are you comfortable with?" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low — Stable, predictable returns</SelectItem>
          <SelectItem value="medium">Medium — Some volatility is fine</SelectItem>
          <SelectItem value="high">High — Max growth potential</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const StepPreferences = ({ profile, set }: { profile: Partial<UserProfile>; set: (f: keyof UserProfile, v: unknown) => void }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Preferred Sector</Label>
      <Select onValueChange={v => set('sectorPreference', v)} value={profile.sectorPreference}>
        <SelectTrigger><SelectValue placeholder="Which sector interests you most?" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="technology">Technology</SelectItem>
          <SelectItem value="healthcare">Healthcare</SelectItem>
          <SelectItem value="finance">Finance</SelectItem>
          <SelectItem value="energy">Energy</SelectItem>
          <SelectItem value="consumer">Consumer Goods</SelectItem>
          <SelectItem value="utilities">Utilities</SelectItem>
          <SelectItem value="any">No preference</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Investment Goal</Label>
      <Select onValueChange={v => set('investmentGoal', v)} value={profile.investmentGoal}>
        <SelectTrigger><SelectValue placeholder="What's your primary goal?" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="growth">Long-term growth</SelectItem>
          <SelectItem value="income">Regular income (dividends)</SelectItem>
          <SelectItem value="balance">Balanced growth and income</SelectItem>
          <SelectItem value="retirement">Retirement planning</SelectItem>
          <SelectItem value="short-term">Short-term gains</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default UserProfileForm;
