// Test configuration for sign-in workflow tests
export const TEST_CONFIG = {
  // Test user credentials - these should be created in your Clerk dashboard
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  },
  
  // Invalid credentials for error testing
  invalidCredentials: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
    invalidEmail: 'notanemail',
    shortPassword: '123'
  },
  
  // URLs for testing
  urls: {
    signIn: '/sign-in',
    signUp: '/sign-up',
    dashboard: '/dashboard',
    forgotPassword: '/forgot-password',
    home: '/'
  },
  
  // Timeouts
  timeouts: {
    pageLoad: 10000,
    elementWait: 5000,
    networkRequest: 15000
  },
  
  // Test data
  testData: {
    validEmail: 'test@example.com',
    validPassword: 'TestPassword123!',
    invalidEmail: 'invalid@example.com',
    invalidPassword: 'wrongpassword'
  }
};

// Helper function to get test credentials from environment
export function getTestCredentials() {
  return {
    email: process.env.TEST_USER_EMAIL || TEST_CONFIG.testUser.email,
    password: process.env.TEST_USER_PASSWORD || TEST_CONFIG.testUser.password
  };
}

// Helper function to check if we're in test mode
export function isTestMode() {
  return process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_BASE_URL?.includes('localhost');
}