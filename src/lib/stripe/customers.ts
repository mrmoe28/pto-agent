import { stripe } from './client';
import { db } from '../db';
import { userSubscriptions, users } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(data: {
  userId: string;
  email: string;
  name?: string;
}) {
  try {
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.name,
      metadata: {
        userId: data.userId,
      },
    });

    // Update user subscription with Stripe customer ID
    await db
      .update(userSubscriptions)
      .set({
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, data.userId));

    return customer;
  } catch (error) {
    console.error('[Stripe] Error creating customer:', error);
    // Throw user-friendly error instead of exposing internal details
    throw new Error('Unable to create payment account. Please try again or contact support.');
  }
}

/**
 * Get Stripe customer by ID
 */
export async function getStripeCustomer(customerId: string) {
  try {
    return await stripe.customers.retrieve(customerId);
  } catch (error) {
    console.error('[Stripe] Error retrieving customer:', error);
    // Throw user-friendly error instead of exposing internal details
    throw new Error('Unable to retrieve payment information. Please try again or contact support.');
  }
}

/**
 * Get or create Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: string) {
  try {
    // Check if user already has a Stripe customer
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
    });

    if (subscription?.stripeCustomerId) {
      return await getStripeCustomer(subscription.stripeCustomerId);
    }

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create new Stripe customer
    return await createStripeCustomer({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
    });
  } catch (error) {
    console.error('[Stripe] Error getting or creating customer:', error);
    // Throw user-friendly error instead of exposing database details
    throw new Error('Unable to process payment information. Please try again or contact support.');
  }
}
