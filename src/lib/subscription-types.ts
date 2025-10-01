export type PlanType = 'free' | 'pro' | 'enterprise' | 'admin';

export interface PlanLimits {
  searchesLimit: number | null; // null means unlimited
  canSaveFavorites: boolean;
  canExportResults: boolean;
  hasTeamCollaboration: boolean;
  hasPrioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    searchesLimit: 1,
    canSaveFavorites: false,
    canExportResults: false,
    hasTeamCollaboration: false,
    hasPrioritySupport: false,
  },
  pro: {
    searchesLimit: 40,
    canSaveFavorites: false,
    canExportResults: false,
    hasTeamCollaboration: false,
    hasPrioritySupport: false,
  },
  enterprise: {
    searchesLimit: null, // unlimited
    canSaveFavorites: true,
    canExportResults: true,
    hasTeamCollaboration: true,
    hasPrioritySupport: true,
  },
  admin: {
    searchesLimit: null, // unlimited
    canSaveFavorites: true,
    canExportResults: true,
    hasTeamCollaboration: true,
    hasPrioritySupport: true,
  },
};

// Check if user can access a specific feature
export function canUserAccessFeature(userPlan: PlanType, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[userPlan];
  return limits[feature] === true;
}

// Get remaining searches for a user
export function getRemainingSearches(userPlan: PlanType, searchesUsed: number): number | null {
  const limits = PLAN_LIMITS[userPlan];
  if (limits.searchesLimit === null) {
    return null; // unlimited
  }
  return Math.max(0, limits.searchesLimit - searchesUsed);
}