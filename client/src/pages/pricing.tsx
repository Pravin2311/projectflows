import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery<Array<{
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: string;
    features: string[];
  }>>({
    queryKey: ["/api/subscription/plans"],
  });

  const handleUpgrade = async (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    if (planId === 'free') {
      return;
    }

    setIsUpgrading(planId);
    try {
      // Create payment intent
      const response = await apiRequest("POST", "/api/create-payment-intent", { planId });
      const data = await response.json();
      
      if (data.clientSecret) {
        // Store the client secret and plan info for the checkout
        sessionStorage.setItem('stripe_client_secret', data.clientSecret);
        sessionStorage.setItem('stripe_plan_id', planId);
        
        // Navigate to a simple checkout page
        window.location.href = `/checkout?planId=${planId}`;
      } else {
        throw new Error(data.message || 'Failed to create payment intent');
      }
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(null);
    }
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case "free": return <Star className="h-6 w-6" />;
      case "premium": return <Crown className="h-6 w-6" />;
      default: return <Star className="h-6 w-6" />;
    }
  };

  const getCurrentUserTier = () => {
    return (user as any)?.subscriptionTier || "free";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Start free and upgrade when you need more power. All plans include data ownership in your Google Drive.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          {plans.filter(plan => plan.id === "free" || plan.id === "premium").map((plan) => {
            const currentTier = getCurrentUserTier();
            const isCurrentPlan = plan.id === currentTier;
            const isUpgrade = plan.id !== "free" && currentTier === "free";
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.id === "premium" ? "border-blue-500 shadow-lg scale-105" : ""} ${isCurrentPlan ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                data-testid={`plan-card-${plan.id}`}
              >
                {plan.id === "premium" && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Advanced Features
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4 text-blue-600">
                    {getPlanIcon(plan.id)}
                  </div>
                  
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-lg mb-4">
                    {plan.id === "free" && "Complete project management platform - forever free"}
                    {plan.id === "premium" && "Advanced AI features and priority support"}
                  </CardDescription>
                  
                  <div className="text-center">
                    <span className="text-4xl font-bold">${(plan.amount / 100).toFixed(0)}</span>
                    <span className="text-gray-500 dark:text-gray-400">/month</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    data-testid={`button-${plan.id}-upgrade`}
                    variant={plan.id === "managed_api" ? "default" : "outline"}
                    disabled={isCurrentPlan || isUpgrading === plan.id || plan.id === 'free'}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isUpgrading === plan.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    ) : (
                      <>
                        {isCurrentPlan ? "Current Plan" : 
                         plan.id === 'free' ? "Get Started" :
                         isUpgrade ? "Upgrade with Stripe" : "Subscribe with Stripe"}
                        {!isCurrentPlan && plan.id !== 'free' && <ArrowRight className="h-4 w-4 ml-2" />}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Value Propositions */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-bold mb-4">Why Choose Managed API?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <strong>Zero Technical Setup</strong> - No need to create Google API keys or configure OAuth
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <strong>Higher Rate Limits</strong> - 10x more API calls than free Google tier
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <strong>Priority Support</strong> - Direct access to our support team
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <strong>Data Still Yours</strong> - Your projects remain in your Google Drive
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <strong className="block mb-1">Can I cancel anytime?</strong>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, cancel anytime. Your data stays in your Google Drive even after cancellation.
                </p>
              </div>
              <div>
                <strong className="block mb-1">What happens to my data?</strong>
                <p className="text-gray-600 dark:text-gray-400">
                  All your data remains in your Google Drive. We never store or have access to your project data.
                </p>
              </div>
              <div>
                <strong className="block mb-1">Can I switch plans?</strong>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, upgrade or downgrade anytime. Changes take effect immediately.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center bg-blue-600 text-white rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-6">
            Join thousands of teams using ProjectFlow for their project management needs.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = isAuthenticated ? "/dashboard" : "/api/login"}
            data-testid="button-cta-start"
          >
            {isAuthenticated ? "Go to Dashboard" : "Start Free Today"}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}