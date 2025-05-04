// Copy this file to .env.local and fill in the values
export const requiredEnvVars = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '',
  CLERK_SECRET_KEY: '',
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/onboarding',

  // OpenAI (for future steps)
  OPENAI_API_KEY: ''
}; 