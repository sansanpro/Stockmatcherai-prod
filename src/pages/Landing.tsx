import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Shield, Target, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import ScreenshotShowcase from "@/components/landing/ScreenshotShowcase";

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
              <Heart className="h-4 w-4 text-primary" />
              <span>Values-first investing for beginners</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Invest in what
              <span className="block text-primary mt-2">you believe in.</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Find companies working on the causes you care about. You decide.
            </p>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Pick what matters to you, like beating cancer or clean energy. Each day you get a short deck of companies working on it, with the story, the proof and the numbers in plain English. Swipe right on the ones you'd be proud to own a piece of.
            </p>

            <div className="flex justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/waitlist")}
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
      <ScreenshotShowcase />

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Know what your money supports
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for first-time investors who want their money to stand for something
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Heart className="h-8 w-8" />}
              title="Start with your causes"
              description="Choose what you care about, like beating cancer, healthier lives, clean energy or keeping people safe. Rule out what you'd never fund."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8" />}
              title="A short daily deck"
              description="A few companies a day that work on your causes, so you can take your time with each one."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Proof, not hype"
              description="Every company comes with its story, a fact with its source, and the things to know before you decide."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="Ask AI"
              description="Ask what a company does, how it connects to your causes, or what a number means. Educational only, never advice."
              featured
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
              title="Pick your causes"
              description="Tell us what you care about and what you'd never fund. It takes about a minute."
            />
            <StepCard
              number="2"
              title="Swipe your daily matches"
              description="Right if you'd be proud to own a piece, left to pass."
            />
            <StepCard
              number="3"
              title="Decide for yourself"
              description="Keep your likes in one place, read up and ask questions. Whether and when to invest is always your call."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Heart className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-3xl md:text-5xl font-bold">
              Let your money stand for something.
            </h2>
            <p className="text-xl text-muted-foreground">
              Find the companies working on what you care about.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/waitlist")}
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
          <p>© {new Date().getFullYear()} StockMatcherAI. Educational only, not investment advice.</p>
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
        Unlimited with Premium
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
