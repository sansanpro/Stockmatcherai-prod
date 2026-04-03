import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, MessageCircle, Shield, HelpCircle, FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Support</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl space-y-16">
        {/* Contact Support */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Contact Us</h2>
          </div>
          <p className="text-muted-foreground">
            Need help? We're here for you. Reach out and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:support@stockmatcherai.com"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium min-h-[44px] hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email Support
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            Or email us directly at{" "}
            <a href="mailto:support@stockmatcherai.com" className="text-primary underline">
              support@stockmatcherai.com
            </a>
          </p>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is">
              <AccordionTrigger>What is StockMatcherAI?</AccordionTrigger>
              <AccordionContent>
                StockMatcherAI is an AI-powered stock discovery app that matches you with stocks 
                based on your financial goals, risk tolerance, and investment preferences — similar 
                to how dating apps match people, but for investing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="free">
              <AccordionTrigger>Is StockMatcherAI free to use?</AccordionTrigger>
              <AccordionContent>
                Yes! StockMatcherAI offers a free tier with daily swipes. Premium features like 
                unlimited swipes and the AI Research Assistant are available with a subscription.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="advice">
              <AccordionTrigger>Does StockMatcherAI provide financial advice?</AccordionTrigger>
              <AccordionContent>
                No. StockMatcherAI is an educational and research tool. It does not provide 
                personalized financial advice. All stock information is for informational purposes 
                only. Always consult a qualified financial advisor before making investment decisions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data">
              <AccordionTrigger>Where does the stock data come from?</AccordionTrigger>
              <AccordionContent>
                We use reputable financial data providers to source real-time and historical stock 
                data. Prices and metrics are updated regularly to ensure accuracy.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="account">
              <AccordionTrigger>How do I delete my account?</AccordionTrigger>
              <AccordionContent>
                You can delete your account directly in the app by going to{" "}
                <strong>Settings → Danger Zone → Delete Account</strong>. This will
                permanently remove all your data including your profile, matches, watchlists,
                and chat history.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="subscription">
              <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
              <AccordionContent>
                You can manage or cancel your subscription from the Settings page within the app. 
                If you need further assistance, contact us at support@stockmatcherai.com.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Privacy Policy */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Privacy Policy</h2>
          </div>
          <div className="prose prose-sm text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Last updated:</strong> March 16, 2026
            </p>
            <p>
              StockMatcherAI ("we", "our", "us") respects your privacy and is committed to 
              protecting your personal data. This policy explains how we collect, use, and 
              safeguard your information.
            </p>

            <h3 className="text-foreground font-semibold text-base">Information We Collect</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information (name, email address)</li>
              <li>Investment profile data (goals, risk tolerance, experience level)</li>
              <li>Usage data (swipe history, watchlist activity)</li>
              <li>Device information (device type, operating system)</li>
            </ul>

            <h3 className="text-foreground font-semibold text-base">How We Use Your Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide personalized stock recommendations</li>
              <li>To improve our AI matching algorithms</li>
              <li>To communicate important updates about the service</li>
              <li>To process subscriptions and payments</li>
            </ul>

            <h3 className="text-foreground font-semibold text-base">Third-Party AI Services</h3>
            <p>
              Our AI Stock Assistant feature uses <strong>Google Gemini</strong>, a third-party
              AI service provided by Google, to generate personalized stock education responses.
            </p>
            <p><strong>Data shared with the AI service:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your investment profile (risk tolerance, investment goals, experience level, sector interests)</li>
              <li>Chat messages you send to the AI assistant</li>
            </ul>
            <p><strong>How this data is used:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Solely to generate personalized educational responses about stocks</li>
              <li>Your data is not used for third-party marketing or advertising</li>
              <li>You must provide explicit consent before any data is shared with the AI service</li>
              <li>You can revoke consent at any time by clearing your app data or contacting support</li>
            </ul>
            <p>
              Google Gemini processes your data in accordance with{" "}
              <a href="https://policies.google.com/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                Google's Privacy Policy
              </a>.
            </p>

            <h3 className="text-foreground font-semibold text-base">Data Security</h3>
            <p>
              We use industry-standard encryption and security measures to protect your data. 
              Your financial profile information is stored securely and is never shared with 
              third parties for marketing purposes.
            </p>

            <h3 className="text-foreground font-semibold text-base">Your Rights</h3>
            <p>
              You have the right to access, correct, or delete your personal data at any time. 
              Contact us at{" "}
              <a href="mailto:support@stockmatcherai.com" className="text-primary underline">
                support@stockmatcherai.com
              </a>{" "}
              to exercise these rights.
            </p>

            <h3 className="text-foreground font-semibold text-base">Contact</h3>
            <p>
              For privacy-related questions, contact our team at{" "}
              <a href="mailto:support@stockmatcherai.com" className="text-primary underline">
                support@stockmatcherai.com
              </a>
              .
            </p>
          </div>
        </section>

        {/* Terms of Service */}
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
            <p>
              On the web, payments are processed securely by Stripe. Subscription terms and
              cancellation options are available in the App's Settings page.
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

      {/* Footer */}
      <footer className="py-8 border-t mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 StockMatcherAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Support;
