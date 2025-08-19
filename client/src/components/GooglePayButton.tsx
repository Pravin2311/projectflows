import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GooglePayButtonProps {
  planId: string;
  planName: string;
  amount: number; // in cents
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export function GooglePayButton({ 
  planId, 
  planName, 
  amount, 
  onSuccess, 
  onError 
}: GooglePayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [googlePayReady, setGooglePayReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load Google Pay API if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://pay.google.com/gp/p/js/pay.js';
      script.onload = initializeGooglePay;
      document.head.appendChild(script);
    } else {
      initializeGooglePay();
    }
  }, []);

  const initializeGooglePay = async () => {
    try {
      if (!window.google?.payments?.api) {
        return;
      }

      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: 'TEST' // Change to 'PRODUCTION' for live
      });

      // Check if Google Pay is available
      const isReadyToPay = await paymentsClient.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
          }
        }]
      });

      if (isReadyToPay.result) {
        setGooglePayReady(true);
      }
    } catch (error) {
      console.error('Error initializing Google Pay:', error);
    }
  };

  const handleGooglePayClick = async () => {
    setIsLoading(true);
    
    try {
      if (!window.google?.payments?.api) {
        throw new Error('Google Pay not available');
      }

      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: 'TEST'
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'googlepay',
              merchantId: 'your-merchant-id' // TODO: Replace with actual merchant ID
            }
          }
        }],
        merchantInfo: {
          merchantId: 'your-merchant-id',
          merchantName: 'ProjectFlow'
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPriceLabel: 'Subscription',
          totalPrice: (amount / 100).toString(),
          currencyCode: 'USD',
          countryCode: 'US'
        }
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      
      // Process the payment with our backend
      const result = await apiRequest('POST', '/api/subscription/create', {
        planId,
        paymentData
      });
      
      const response = await result.json();

      if (response.success) {
        toast({
          title: "Subscription Created!",
          description: `Successfully subscribed to ${planName}`,
        });
        
        onSuccess?.(response.subscription.subscriptionId);
      } else {
        throw new Error(response.message || 'Failed to create subscription');
      }

    } catch (error: any) {
      console.error('Google Pay error:', error);
      
      if (error.statusCode === 'CANCELED') {
        // User canceled the payment
        return;
      }
      
      const errorMessage = error.message || 'Payment failed. Please try again.';
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback for when Google Pay is not available
  const handleFallbackSubscription = async () => {
    setIsLoading(true);
    
    try {
      const result = await apiRequest('POST', '/api/subscription/create', {
        planId
      });
      
      const response = await result.json();

      if (response.success) {
        toast({
          title: "Subscription Created!",
          description: `Successfully subscribed to ${planName}`,
        });
        
        onSuccess?.(response.subscription.subscriptionId);
      } else {
        throw new Error(response.message || 'Failed to create subscription');
      }
    } catch (error: any) {
      toast({
        title: "Subscription Failed",
        description: error.message || 'Failed to create subscription',
        variant: "destructive",
      });
      
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (planId === 'free') {
    return (
      <Button 
        className="w-full" 
        variant="outline"
        disabled
        data-testid="button-free-plan"
      >
        Current Plan
      </Button>
    );
  }

  return (
    <div className="w-full">
      {googlePayReady ? (
        <Button
          onClick={handleGooglePayClick}
          disabled={isLoading}
          className="w-full bg-black hover:bg-gray-800 text-white"
          data-testid={`button-google-pay-${planId}`}
        >
          {isLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMTciIHZpZXdCb3g9IjAgMCA0MCAxNyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTM5LjA5IDkuMjVIMjAuMjVWNS4yNUgzOS4wOVY5LjI1WiIgZmlsbD0iIzQyODVGNCIvPgo8L3N2Zz4K"
              alt="Google Pay"
              className="h-5 mr-2"
            />
          )}
          {isLoading ? 'Processing...' : 'Subscribe with Google Pay'}
        </Button>
      ) : (
        <Button
          onClick={handleFallbackSubscription}
          disabled={isLoading}
          className="w-full"
          data-testid={`button-subscribe-${planId}`}
        >
          {isLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : null}
          {isLoading ? 'Processing...' : 'Subscribe Now'}
        </Button>
      )}
    </div>
  );
}