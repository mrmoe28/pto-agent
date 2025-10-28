import { Client } from 'square';

// Initialize Square Client
export const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
});

export const locationId = process.env.SQUARE_LOCATION_ID!;

// Square Application ID for frontend (public)
export const squareApplicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!;
