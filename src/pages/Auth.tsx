import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmailInput from '@/components/EmailInput';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { AppleIcon } from '@/components/SavePrompt';

// Account screens only. The values questions happen before this, in the app's onboarding,
// and their answers are saved to the account right after sign-in.
type View = 'account' | 'signin';

const fieldClass = 'h-12 bg-white border-line text-ink placeholder:text-ink-muted focus:border-primary rounded-xl';

const Auth = () => {
  const { user, signIn, signUp, signInWithApple, resetPassword, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fromSave = params.get('mode') === 'save';
  const [view, setView] = useState<View>(params.get('mode') === 'signin' ? 'signin' : 'account');
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  if (user && !loading) return <Navigate to="/app" replace />;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    );
  }

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    await signInWithApple();
    setIsAppleLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData(e.currentTarget);
    await signIn(data.get('email') as string, data.get('password') as string);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData(e.currentTarget);
    await signUp(data.get('email') as string, data.get('password') as string, data.get('fullName') as string);
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData(e.currentTarget);
    await resetPassword(data.get('email') as string);
    setIsLoading(false);
  };

  const appleButton = (
    <button onClick={handleAppleSignIn} disabled={isAppleLoading}
      className="w-full h-14 bg-black hover:bg-black/85 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-60 mb-4">
      {isAppleLoading
        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : <AppleIcon />}
      Continue with Apple
    </button>
  );

  const divider = (label: string) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px bg-line" />
      <span className="text-xs text-ink-faint">{label}</span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );

  const passwordField = (id: string, placeholder: string, minLength?: number) => (
    <div className="relative">
      <Input id={id} name="password" type={showPassword ? 'text' : 'password'} placeholder={placeholder} required minLength={minLength}
        className={`${fieldClass} pr-10`} />
      <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-3 flex items-center text-ink-muted hover:text-primary transition-colors">
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream bg-[radial-gradient(120%_55%_at_50%_0%,#FBE7DC_0%,rgba(250,246,239,0)_70%)] flex flex-col px-6 pb-8 pt-[env(safe-area-inset-top)]">
      <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-ink-soft hover:text-ink transition-colors mt-3 mb-8 min-h-[44px] self-start">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {view === 'signin' ? (
          <>
            <h2 className="text-3xl font-bold text-ink mb-2">Welcome back</h2>
            <p className="text-ink-soft mb-8">Sign in to see your matches.</p>
            {appleButton}
            {divider('or sign in with email')}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-ink-soft text-sm">Email</Label>
                <EmailInput id="signin-email" placeholder="you@example.com" className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-ink-soft text-sm">Password</Label>
                {passwordField('signin-password', 'Your password')}
              </div>
              <Button type="submit" disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-base font-semibold mt-2">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <button onClick={() => setShowReset(!showReset)} className="text-primary text-sm mt-4 hover:underline text-left min-h-[44px]">
              Forgot your password?
            </button>
            {showReset && (
              <form onSubmit={handleResetPassword} className="mt-2 space-y-3">
                <EmailInput placeholder="Enter your email" className={fieldClass} />
                <Button type="submit" variant="outline" disabled={isLoading}
                  className="w-full h-11 border-line bg-white text-ink hover:bg-sand rounded-xl">
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </form>
            )}
            <p className="text-center text-ink-faint text-sm mt-8">
              Don't have an account?{' '}
              <button onClick={() => setView('account')} className="text-primary hover:underline font-medium">Create one</button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-ink mb-2">{fromSave ? 'Save your matches' : 'Create your free account'}</h2>
            <p className="text-ink-soft mb-8">A free account keeps your likes and causes on any device.</p>
            {appleButton}
            {divider('or use email')}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-ink-soft text-sm">First name <span className="text-ink-faint">(optional)</span></Label>
                <Input id="signup-name" name="fullName" type="text" placeholder="What should we call you?" className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-ink-soft text-sm">Email</Label>
                <EmailInput id="signup-email" placeholder="you@example.com" className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-ink-soft text-sm">Password</Label>
                {passwordField('signup-password', 'Min. 6 characters', 6)}
              </div>
              <Button type="submit" disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-base font-semibold mt-2">
                {isLoading ? 'Creating account...' : fromSave ? 'Save my matches' : 'Create account'}
              </Button>
            </form>
            <p className="text-center text-ink-faint text-sm mt-6">
              Already have an account?{' '}
              <button onClick={() => setView('signin')} className="text-primary hover:underline font-medium">Sign in</button>
            </p>
          </>
        )}

        <p className="text-xs text-ink-faint mt-8 text-center">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <a href="https://stockmatcherai.com/support" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Auth;
