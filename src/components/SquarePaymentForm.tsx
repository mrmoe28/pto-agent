'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Square?: any;
  }
}

interface SquarePaymentFormProps {
  amount: number; // Amount in cents
  plan: 'pro' | 'enterprise';
  onSuccess: (paymentId: string, cardId: string) => void;
  onError?: (error: string) => void;
}

export function SquarePaymentForm({ amount, plan, onSuccess, onError }: SquarePaymentFormProps) {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [squareLoaded, setSquareLoaded] = useState(false);

  useEffect(() => {
    async function initializeSquare() {
      try {
        // Wait for Square.js to load
        if (!window.Square) {
          console.error('Square.js failed to load');
          setError('Payment system failed to load. Please refresh the page.');
          return;
        }

        const payments = window.Square.payments(
          process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ''
        );

        const cardElement = await payments.card();
        await cardElement.attach('#card-container');
        setCard(cardElement);
        setSquareLoaded(true);
      } catch (e: any) {
        console.error('Failed to initialize Square:', e);
        setError('Failed to initialize payment form. Please try again.');
      }
    }

    // Check if Square.js is already loaded
    if (window.Square) {
      initializeSquare();
    } else {
      // Wait for Square.js to load
      const checkSquare = setInterval(() => {
        if (window.Square) {
          clearInterval(checkSquare);
          initializeSquare();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkSquare);
        if (!window.Square) {
          setError('Payment system failed to load. Please refresh the page.');
        }
      }, 10000);
    }
  }, []);

  async function handlePayment() {
    if (!card) {
      setError('Payment form not ready. Please wait or refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Tokenize card
      const result = await card.tokenize();

      if (result.status === 'OK') {
        // Send token to backend to create subscription
        const response = await fetch('/api/square/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: result.token,
            plan,
          }),
        });

        const data = await response.json();

        if (data.success) {
          onSuccess(data.subscriptionId, data.cardId);
        } else {
          const errorMessage = data.error || 'Payment failed. Please try again.';
          setError(errorMessage);
          onError?.(errorMessage);
        }
      } else {
        let errorMessage = 'Card tokenization failed. ';
        result.errors?.forEach((error: any) => {
          errorMessage += error.message + ' ';
        });
        setError(errorMessage.trim());
        onError?.(errorMessage);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Payment processing failed. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const planNames = {
    pro: 'Pro',
    enterprise: 'Enterprise',
  };

  const planDescriptions = {
    pro: '40 searches per month',
    enterprise: 'Unlimited searches',
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Subscribe to {planNames[plan]} Plan</CardTitle>
        <CardDescription>
          {planDescriptions[plan]} • ${(amount / 100).toFixed(2)}/month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div id="card-container" className="min-h-[120px]"></div>

        <Button
          onClick={handlePayment}
          disabled={!card || loading || !squareLoaded}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Subscribe for $${(amount / 100).toFixed(2)}/month`
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Your subscription will begin immediately and you'll be charged ${(amount / 100).toFixed(2)} per month.
          Cancel anytime from your account dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
