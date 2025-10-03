import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUserSearch, incrementSearchUsage } from '@/lib/subscription-utils';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const searchCapability = await canUserSearch(userId);

    return NextResponse.json({
      success: true,
      canSearch: searchCapability.canSearch,
      plan: searchCapability.plan,
      usage: searchCapability.usage,
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const result = await incrementSearchUsage(userId);

    return NextResponse.json({
      success: result.success,
      canSearch: result.canSearch,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Error incrementing search usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
