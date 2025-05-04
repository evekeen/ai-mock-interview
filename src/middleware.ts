import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const publicPaths = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
];

const isPublicPath = createRouteMatcher(publicPaths);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicPath(req)) {
    return NextResponse.next();
  }
  
  // Check auth status
  const { userId, redirectToSignIn } = await auth();
  
  // If the user is not signed in and the route is not public, redirect to sign-in
  if (!userId) {
    return redirectToSignIn();
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}; 