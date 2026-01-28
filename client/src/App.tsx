import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SwingAnalyzerPage from "@/pages/swing-analyzer";
import PrivacyPage from "@/pages/privacy";
import SwingViewPage from "@/pages/swing-view";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SwingAnalyzerPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/swing/:id" component={SwingViewPage} />
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
