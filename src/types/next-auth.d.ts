import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    subscriptionPlan?: 'free' | 'pro' | 'enterprise';
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      subscriptionPlan?: 'free' | 'pro' | 'enterprise';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    subscriptionPlan?: 'free' | 'pro' | 'enterprise';
  }
}
