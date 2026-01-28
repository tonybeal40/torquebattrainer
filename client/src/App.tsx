import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SwingAnalyzerPage from "@/pages/swing-analyzer";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import SwingViewPage from "@/pages/swing-view";
import AgeVerificationPage from "@/pages/age-verification";
import AppleSignInSetupPage from "@/pages/apple-signin-setup";
import ProgressDashboardPage from "@/pages/progress-dashboard";
import { useEffect, useState } from "react";

function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const isVerified = localStorage.getItem("age_verified") === "true";
    setVerified(isVerified);
  }, []);

  if (verified === null) return null;

  if (!verified) {
    return <AgeVerificationPage />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/age-verify" component={AgeVerificationPage} />
      <Route path="/apple-signin-setup" component={AppleSignInSetupPage} />
      <Route path="/progress" component={ProgressDashboardPage} />
      <Route path="/swing/:id" component={SwingViewPage} />
      <Route path="/">
        <AgeGate>
          <SwingAnalyzerPage />
        </AgeGate>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
