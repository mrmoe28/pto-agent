import { SquareClient, SquareEnvironment } from 'square';

// Initialize Square Client
export const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: (process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox)
});

export const locationId = process.env.SQUARE_LOCATION_ID!;

// Square Application ID for frontend (public)
export const squareApplicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!;
