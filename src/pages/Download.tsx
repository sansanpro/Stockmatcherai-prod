import { Button } from "@/components/ui/button";

const APP_STORE_URL = "https://apps.apple.com/app/id6758280940";

// Where the Meta ads land: Meta rejects traffic ads that link or redirect straight to the App Store
const Download = () => (
  <main className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-md space-y-6 text-center">
      <h1 className="text-3xl font-bold">Swipe through real companies working on the causes you care about.</h1>
      <p className="text-lg text-muted-foreground">
        Pick the causes you care about and swipe through real companies working on them. See what each one does, the proof behind it, and what to watch out for.
      </p>
      <Button asChild size="lg" className="w-full min-h-[44px]">
        <a href={APP_STORE_URL}>Download free on the App Store</a>
      </Button>
      <p className="text-sm text-muted-foreground">
        For iPhone, iOS 15 or later. Educational only, not investment advice.
      </p>
      <p className="text-sm text-muted-foreground">
        <a href="/terms" className="underline">Terms</a>
        {" · "}
        <a href="/support" className="underline">Privacy and support</a>
      </p>
    </div>
  </main>
);

export default Download;
