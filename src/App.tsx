import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Capacitor } from "@capacitor/core";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Waitlist from "./pages/Waitlist";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import { track } from '@/lib/analytics';

const queryClient = new QueryClient();

const App = () => {
  // Detect if running on native mobile platform (iOS/Android)
  const isNativeMobile = Capacitor.isNativePlatform();

  useEffect(() => {
    track('app_open');
  }, []);
  // App Tracking Transparency is requested after onboarding (see requestTrackingOnce), not here

  return (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <div className="w-full h-full min-h-screen min-w-0 bg-background text-foreground transition-colors">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Mobile app: skip landing page, go straight to app */}
              {isNativeMobile ? (
                <>
                  <Route path="/" element={<Navigate to="/app" replace />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/app" element={<Index />} />
                  <Route path="*" element={<Navigate to="/app" replace />} />
                </>
              ) : (
                /* Web version: show landing page */
                <>
                  <Route path="/" element={<Landing />} />
                  <Route path="/waitlist" element={<Waitlist />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/app" element={<Index />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
