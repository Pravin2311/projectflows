import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, useGoogleConfig } from "@/hooks/useAuth";
import { GoogleConfig } from "@/components/ui/google-config";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ProjectPage from "@/pages/project";
import Pricing from "@/pages/pricing";
import Checkout from "@/pages/checkout";
import InvitePage from "@/pages/invite";

function Router() {
  const { isAuthenticated, isLoading, hasGoogleConfig } = useAuth();
  const { submitConfig, isLoading: configLoading } = useGoogleConfig();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/invite/:id" component={InvitePage} />
        </>
      ) : !hasGoogleConfig ? (
        <Route path="/">
          <GoogleConfig onConfigSubmit={submitConfig} isLoading={configLoading} />
        </Route>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/project/:id" component={ProjectPage} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/checkout">
            {process.env.NODE_ENV === 'development' ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout (Development)</h1>
                  <p className="text-gray-600 mb-4">Checkout functionality requires Stripe configuration.</p>
                  <p className="text-sm text-gray-500">This feature will be available when Stripe keys are configured.</p>
                </div>
              </div>
            ) : (
              <Checkout />
            )}
          </Route>
          <Route path="/invite/:id" component={InvitePage} />
          {/* Add more authenticated routes here */}
        </>
      )}
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
