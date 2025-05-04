import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const user = await currentUser();
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName || "User"}</h2>
        <p className="mb-4">Your interview preparation journey starts here.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Link href="/upload" className="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition">
            <h3 className="font-medium mb-2">Upload Resume</h3>
            <p className="text-sm text-gray-600">Upload your resume to get started</p>
          </Link>
          
          <Link href="/upload?type=jd" className="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition">
            <h3 className="font-medium mb-2">Job Description</h3>
            <p className="text-sm text-gray-600">Add the job you're applying for</p>
          </Link>
          
          <Link href="/stories" className="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition">
            <h3 className="font-medium mb-2">Practice Stories</h3>
            <p className="text-sm text-gray-600">Prepare your interview stories</p>
          </Link>
          
          <Link href="/brainstorm" className="bg-amber-50 p-6 rounded-lg hover:bg-amber-100 transition">
            <h3 className="font-medium mb-2">Brainstorm</h3>
            <p className="text-sm text-gray-600">Free-write your experiences</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 