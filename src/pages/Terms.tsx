import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Terms of Use</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Terms of Service</h2>
          </div>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Last updated:</strong> April 3, 2026
            </p>
            <p>
              By using StockMatcherAI ("the App"), you agree to these Terms of Service.
              If you do not agree, please do not use the App.
            </p>

            <h3 className="text-foreground font-semibold text-base">Educational Purpose Only</h3>
            <p>
              StockMatcherAI is an educational and research tool designed to help users
              explore and learn about publicly traded stocks. The App does not provide
              personalized financial advice, investment recommendations, or trading services.
              All information presented is for informational and educational purposes only.
            </p>
            <p>
              You should always consult a qualified financial advisor before making any
              investment decisions. StockMatcherAI is not a registered broker-dealer,
              investment adviser, or financial planner.
            </p>

            <h3 className="text-foreground font-semibold text-base">No Trading or Execution</h3>
            <p>
              The App does not facilitate, execute, or process any securities transactions.
              You cannot buy, sell, or trade stocks through StockMatcherAI. Any action you
              take based on information from the App is entirely at your own risk.
            </p>

            <h3 className="text-foreground font-semibold text-base">Subscriptions &amp; Payments</h3>
            <p>
              StockMatcherAI offers optional premium subscriptions. On iOS, subscriptions are
              billed through your Apple ID account and managed by Apple. Subscription
              auto-renews monthly unless cancelled at least 24 hours before the end of the
              current billing period. You can manage or cancel your subscription in your
              device's Settings → Apple ID → Subscriptions.
            </p>

            <h3 className="text-foreground font-semibold text-base">User Responsibilities</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 18 years old to use the App</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You agree not to misuse the App or attempt to access it through unauthorized means</li>
              <li>You acknowledge that stock data may be delayed or imprecise</li>
            </ul>

            <h3 className="text-foreground font-semibold text-base">Disclaimer of Warranties</h3>
            <p>
              The App is provided "as is" without warranties of any kind. We do not guarantee
              the accuracy, completeness, or timeliness of any stock data or AI-generated
              content. Past performance of any stock does not guarantee future results.
            </p>

            <h3 className="text-foreground font-semibold text-base">Limitation of Liability</h3>
            <p>
              StockMatcherAI shall not be liable for any financial losses, damages, or
              other consequences resulting from the use of the App or reliance on its content.
            </p>

            <h3 className="text-foreground font-semibold text-base">Contact</h3>
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:support@stockmatcherai.com" className="text-primary underline">
                support@stockmatcherai.com
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 StockMatcherAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
