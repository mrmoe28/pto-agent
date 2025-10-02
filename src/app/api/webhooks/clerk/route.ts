import { NextRequest } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userProfiles, userSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, first_name, last_name } = evt.data;

    try {
      // Create user profile in database
      await db.insert(userProfiles).values({
        userId: id,
        firstName: first_name || null,
        lastName: last_name || null,
        preferences: {
          notifications: true,
          theme: 'light',
          emailUpdates: true,
        },
      });

      console.log('✅ User profile created:', { userId: id, firstName: first_name, lastName: last_name });

      // Create free subscription for new user
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month from now

      await db.insert(userSubscriptions).values({
        userId: id,
        plan: 'free',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        searchesUsed: 0,
        searchesLimit: 1, // Free plan: 1 search
      });

      console.log('✅ Free subscription created:', { userId: id, plan: 'free', limit: 1 });

    } catch (error) {
      console.error('❌ Error creating user profile/subscription:', error);
      // Don't fail the webhook - log and continue
    }
  }

  if (eventType === 'user.updated') {
    const { id, first_name, last_name, public_metadata } = evt.data;

    try {
      // Update user profile if name changed
      if (first_name || last_name) {
        await db
          .update(userProfiles)
          .set({
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, id));

        console.log('✅ User profile updated:', { userId: id, firstName: first_name, lastName: last_name });
      }

      // Update subscription if plan changed
      if (public_metadata?.subscriptionPlan) {
        const plan = public_metadata.subscriptionPlan as string;
        const searchesLimit = plan === 'free' ? 1 : plan === 'pro' ? 40 : null;

        await db
          .update(userSubscriptions)
          .set({
            plan,
            searchesLimit,
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.userId, id));

        console.log('✅ User subscription updated:', { userId: id, plan, searchesLimit });
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // Import necessary tables for cleanup
      const { userFavorites, userPermitSearches } = await import('@/lib/db/schema');

      // Delete user-related data (must be done in correct order)
      await db.delete(userFavorites).where(eq(userFavorites.userId, id || ''));
      await db.delete(userPermitSearches).where(eq(userPermitSearches.userId, id || ''));
      await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, id || ''));
      await db.delete(userProfiles).where(eq(userProfiles.userId, id || ''));

      console.log('✅ User data deleted:', { userId: id });
    } catch (error) {
      console.error('❌ Error deleting user data:', error);
    }
  }

  return new Response('', { status: 200 });
}
