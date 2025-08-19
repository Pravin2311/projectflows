import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CreditCard } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const CheckoutForm = ({ planId }: { planId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Activate subscription on our backend
        await apiRequest('POST', '/api/subscription/activate', {
          paymentIntentId: paymentIntent.id
        });

        toast({
          title: "Payment Successful!",
          description: "Your subscription has been activated. Redirecting to dashboard...",
        });

        // Clear stored data and redirect
        sessionStorage.removeItem('stripe_client_secret');
        sessionStorage.removeItem('stripe_plan_id');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const planNames: Record<string, string> = {
    managed_api: 'Managed API - $9/month',
    premium: 'Premium - $19/month'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pricing')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Complete Your Subscription</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              {planNames[planId] || 'Subscription Plan'}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <PaymentElement />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!stripe || !elements || isProcessing}
                data-testid="button-complete-payment"
              >
                {isProcessing ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : null}
                {isProcessing ? 'Processing...' : `Subscribe Now`}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>🔒 Secure payment powered by Stripe</p>
              <p className="mt-2">Your project data remains in your Google Drive</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string>('');
  const [, navigate] = useLocation();

  useEffect(() => {
    // Get client secret and plan ID from session storage
    const storedSecret = sessionStorage.getItem('stripe_client_secret');
    const storedPlanId = sessionStorage.getItem('stripe_plan_id');
    
    if (!storedSecret || !storedPlanId) {
      // Redirect back to pricing if no payment data
      navigate('/pricing');
      return;
    }

    setClientSecret(storedSecret);
    setPlanId(storedPlanId);
  }, [navigate]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm planId={planId} />
    </Elements>
  );
}