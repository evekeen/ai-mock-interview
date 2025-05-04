import { getAuth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function OnboardingPage() {
  const { userId } = getAuth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return (
    <div className="container mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to Interview Coach</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Let's get started</h2>
        <p className="mb-6">Complete your profile to get personalized interview preparation recommendations.</p>
        
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">What type of role are you applying for?</label>
            <input 
              type="text" 
              className="w-full rounded-md border border-gray-300 p-3" 
              placeholder="e.g. Software Engineer, Product Manager"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Years of experience</label>
            <select className="w-full rounded-md border border-gray-300 p-3">
              <option value="">Select experience level</option>
              <option value="0-1">0-1 years</option>
              <option value="1-3">1-3 years</option>
              <option value="3-5">3-5 years</option>
              <option value="5-10">5-10 years</option>
              <option value="10+">10+ years</option>
            </select>
          </div>
          
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Complete Onboarding
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 