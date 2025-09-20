// Next.js instrumentation file
// This file is optional but can help resolve instrument-related warnings

export async function register() {
  // Optional instrumentation setup
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode instrumentation loaded')
  }
}