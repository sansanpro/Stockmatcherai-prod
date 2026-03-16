import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, Heart, Zap, Shield, Target, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import appScreenshotMobile from "@/assets/app-screenshot-mobile.png";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to app if already logged in
  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/15 pointer-events-none" />
        
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium">
              <Zap className="h-4 w-4 text-primary" />
              <span>Smart Investing Made Simple</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              It's like Tinder...
              <span className="block text-primary mt-2">But for Stocks!</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Invest in your future before you invest in somebody else.
            </p>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Swipe through stocks tailored to your goals. Chat with your <span className="text-primary font-semibold">AI Research Assistant 24/7</span>. No jargon, no overwhelm—just instant insights that power your financial future.
            </p>

            <div className="flex justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/waitlist")}
                onTouchEnd={(e) => { e.preventDefault(); navigate("/waitlist"); }}
                className="text-lg px-8 py-6 group relative z-10 min-h-[44px] min-w-[44px]"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A glimpse of what's coming - your personalized stock matching experience
            </p>
          </div>

          <div className="flex justify-center max-w-md mx-auto">
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-border">
                <img src={appScreenshotMobile} alt="Stock matching interface preview" className="w-full" />
              </div>
              <p className="text-center text-muted-foreground">Swipe through stocks, find your perfect match</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Investing Should Be This Easy
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for new investors who want to grow their wealth without the complexity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="AI Research Assistant"
              description="Get instant, real-time stock insights from your personal AI advisor. Ask anything, anytime—live market intelligence at your fingertips."
              featured
            />
            <FeatureCard
              icon={<Heart className="h-8 w-8" />}
              title="Swipe to Match"
              description="Like dating, but better. Swipe right on stocks that align with your financial goals and risk tolerance."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8" />}
              title="Personalized Picks"
              description="AI-powered recommendations based on your profile. No two portfolios are the same."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Beginner Friendly"
              description="Clear explanations, no financial jargon. Learn as you swipe and build confidence."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Three Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard
              number="1"
              title="Create Your Profile"
              description="Tell us your goals, risk tolerance, and investment timeline in minutes."
            />
            <StepCard
              number="2"
              title="Start Swiping"
              description="Browse stocks matched to your profile. Right for yes, left for pass."
            />
            <StepCard
              number="3"
              title="Build Your Portfolio"
              description="Review your matches and take action. Your financial future starts now."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <TrendingUp className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Make Your Money Work?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of new investors taking control of their financial future.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/waitlist")}
              onTouchEnd={(e) => { e.preventDefault(); navigate("/waitlist"); }}
              className="text-lg px-8 py-6 mt-8 relative z-10 min-h-[44px] min-w-[44px]"
            >
              Join the Waitlist
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 StockMatcherAI. Your financial future, simplified.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, featured }: { icon: React.ReactNode; title: string; description: string; featured?: boolean }) => (
  <div className={`p-6 rounded-lg bg-card border transition-all hover:shadow-lg ${
    featured 
      ? 'border-primary/70 shadow-lg shadow-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5' 
      : 'border-border hover:border-primary/50'
  }`}>
    <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-primary mb-4 ${
      featured ? 'bg-gradient-to-br from-primary to-purple-500' : 'bg-primary/10'
    }`}>
      <div className={featured ? 'text-white' : ''}>
        {icon}
      </div>
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
    {featured && (
      <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
        <Sparkles className="h-3 w-3" />
        Premium Feature
      </div>
    )}
  </div>
);

const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="text-center space-y-4">
    <div className="h-16 w-16 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
      {number}
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Landing;
