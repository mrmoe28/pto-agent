'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FavoriteButtonProps {
  permitOfficeId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
}

export default function FavoriteButton({
  permitOfficeId,
  className = '',
  size = 'default',
  showText = false
}: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');

  // Check if user has Enterprise plan
  useEffect(() => {
    if (isLoaded && user) {
      const subscriptionPlan = user?.subscriptionPlan as string;
      setUserPlan(subscriptionPlan || 'free');
    }
  }, [isLoaded, user]);

  // Check if this office is already favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isLoaded || !user || userPlan !== 'enterprise') {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch('/api/user/favorites');
        if (response.ok) {
          const favorites = await response.json();
          const isFavorited = favorites.some((fav: { permitOfficeId: string }) => fav.permitOfficeId === permitOfficeId);
          setIsFavorite(isFavorited);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkFavoriteStatus();
  }, [isLoaded, user, permitOfficeId, userPlan]);

  const handleToggleFavorite = async () => {
    if (!user || userPlan !== 'enterprise') {
      // Show upgrade modal or redirect to pricing
      window.location.href = '/pricing';
      return;
    }

    setIsLoading(true);
    try {
      const action = isFavorite ? 'remove' : 'add';
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          permitOfficeId,
        }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
      } else if (response.status === 403) {
        // User doesn't have Enterprise plan
        window.location.href = '/pricing';
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if user is not loaded or not authenticated
  if (!isLoaded || !user) {
    return null;
  }

  // Show upgrade prompt for non-Enterprise users
  if (userPlan !== 'enterprise') {
    return (
      <Button
        onClick={() => window.location.href = '/pricing'}
        variant="outline"
        size={size}
        className={`${className} border-purple-200 text-purple-600 hover:bg-purple-50`}
      >
        <Heart className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />
        {showText && 'Upgrade to Save'}
      </Button>
    );
  }

  // Show loading state while checking favorite status
  if (isChecking) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={className}
      >
        <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} animate-spin`} />
        {showText && 'Loading...'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleToggleFavorite}
      variant="outline"
      size={size}
      disabled={isLoading}
      className={`${className} ${
        isFavorite 
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' 
          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {isLoading ? (
        <Loader2 className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} animate-spin`} />
      ) : (
        <Heart 
          className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} ${
            isFavorite ? 'fill-current' : ''
          }`} 
        />
      )}
      {showText && (isFavorite ? 'Saved' : 'Save')}
    </Button>
  );
}
