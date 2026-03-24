import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { requestTrackingPermission } from "@/lib/att";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Waitlist from "./pages/Waitlist";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Detect if running on native mobile platform (iOS/Android)
  const isNativeMobile = Capacitor.isNativePlatform();

  // Request ATT permission on first user interaction (iOS only)
  useEffect(() => {
    if (localStorage.getItem('att_status')) return;
    
    const handleFirstInteraction = async () => {
      const status = await requestTrackingPermission();
      localStorage.setItem('att_status', status);
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  return (
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
                  <Route path="/app" element={<Index />} />
                  <Route path="*" element={<Navigate to="/app" replace />} />
                </>
              ) : (
                /* Web version: show landing page */
                <>
                  <Route path="/" element={<Landing />} />
                  <Route path="/waitlist" element={<Waitlist />} />
                  <Route path="/support" element={<Support />} />
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
  );
};

export default App;
