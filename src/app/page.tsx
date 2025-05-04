import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Interview Coach</h1>
      <h2 className="text-2xl mb-8">AI-powered interview preparation assistant</h2>
      
      {userId ? (
        <div className="flex flex-col gap-4 items-center">
          <p className="mb-4">Welcome back! Continue your interview preparation.</p>
          <Link 
            href="/dashboard" 
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center">
          <p className="mb-4">Sign in to start your interview preparation journey.</p>
          <div className="flex gap-4">
            <Link 
              href="/sign-in" 
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
