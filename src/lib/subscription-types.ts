export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  searchesLimit: number | null; // null means unlimited
  canSaveFavorites: boolean;
  canExportResults: boolean;
  hasPrioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    searchesLimit: 1,
    canSaveFavorites: false,
    canExportResults: false,
    hasPrioritySupport: false,
  },
  pro: {
    searchesLimit: 50,
    canSaveFavorites: true,
    canExportResults: true,
    hasPrioritySupport: false,
  },
  enterprise: {
    searchesLimit: null, // unlimited
    canSaveFavorites: true,
    canExportResults: true,
    hasPrioritySupport: true,
  },
};