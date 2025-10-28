import { squareClient } from './client';
import { db } from '../db';
import { userSubscriptions, users } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Create a Square customer for a user
 */
export async function createSquareCustomer(data: {
  userId: string;
  email: string;
  givenName?: string;
  familyName?: string;
  phoneNumber?: string;
}) {
  try {
    const response = await squareClient.customers.create({
      emailAddress: data.email,
      givenName: data.givenName,
      familyName: data.familyName,
      phoneNumber: data.phoneNumber,
      referenceId: data.userId, // Link to our internal user ID
    });

    if (response.errors) {
      throw new Error(response.errors.map(e => e.detail).join(', '));
    }

    // Update user subscription with Square customer ID
    await db
      .update(userSubscriptions)
      .set({
        squareCustomerId: response.customer!.id,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, data.userId));

    return response.customer;
  } catch (error) {
    console.error('[Square] Error creating customer:', error);
    throw error;
  }
}

/**
 * Get Square customer by ID
 */
export async function getSquareCustomer(customerId: string) {
  try {
    const response = await squareClient.customers.get({ customerId });
    if (response.errors) {
      throw new Error(response.errors.map(e => e.detail).join(', '));
    }
    return response.customer;
  } catch (error) {
    console.error('[Square] Error retrieving customer:', error);
    throw error;
  }
}

/**
 * Update Square customer information
 */
export async function updateSquareCustomer(
  customerId: string,
  data: Partial<{
    emailAddress: string;
    givenName: string;
    familyName: string;
    phoneNumber: string;
  }>
) {
  try {
    const response = await squareClient.customers.update({
      customerId,
      ...data
    });
    if (response.errors) {
      throw new Error(response.errors.map(e => e.detail).join(', '));
    }
    return response.customer;
  } catch (error) {
    console.error('[Square] Error updating customer:', error);
    throw error;
  }
}

/**
 * Get or create Square customer for a user
 */
export async function getOrCreateSquareCustomer(userId: string) {
  try {
    // Check if user already has a Square customer
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(userSubscriptions.userId, userId),
    });

    if (subscription?.squareCustomerId) {
      return await getSquareCustomer(subscription.squareCustomerId);
    }

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create new Square customer
    const [firstName, ...lastNameParts] = (user.name || '').split(' ');
    return await createSquareCustomer({
      userId: user.id,
      email: user.email,
      givenName: firstName,
      familyName: lastNameParts.join(' ') || undefined,
    });
  } catch (error) {
    console.error('[Square] Error getting or creating customer:', error);
    throw error;
  }
}
