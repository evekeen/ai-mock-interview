import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Behavioral Interview Coach</h1>
      <h2 className="text-2xl mb-8 text-center">Master your interview stories with AI-powered feedback</h2>
      
      <div className="max-w-2xl text-center mb-8">
        <p className="mb-4">
          Prepare compelling STAR-format responses for your behavioral interviews.
          Get instant AI feedback to strengthen your storytelling skills.
        </p>
      </div>
      
      {userId ? (
        <div className="flex flex-col gap-4 items-center">
          <p className="mb-4">Welcome back! Continue your interview preparation.</p>
          <div className="flex gap-4">
            <Link 
              href="/profile" 
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Build Your Profile
            </Link>
            <Link 
              href="/stories" 
              className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition"
            >
              Practice Responses
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center">
          <p className="mb-4">Sign in to start your behavioral interview preparation journey.</p>
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
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 text-2xl font-bold mb-2">1</div>
          <h3 className="text-lg font-semibold mb-2">Create Your Profile</h3>
          <p className="text-gray-600">Upload your resume and job description to personalize your practice sessions.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 text-2xl font-bold mb-2">2</div>
          <h3 className="text-lg font-semibold mb-2">Choose a Topic</h3>
          <p className="text-gray-600">Select from common behavioral interview topics like conflict resolution or leadership.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 text-2xl font-bold mb-2">3</div>
          <h3 className="text-lg font-semibold mb-2">Practice & Improve</h3>
          <p className="text-gray-600">Get instant AI feedback on your responses and improve your storytelling skills.</p>
        </div>
      </div>
    </div>
  );
}
