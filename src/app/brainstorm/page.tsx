import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function BrainstormPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Brainstorm Your Experiences</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="mb-6">
          Freely write about your professional experiences. Think about challenges you've overcome, projects you're proud of, 
          and situations where you demonstrated leadership, teamwork, or problem-solving skills.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
            <input
              id="title"
              type="text"
              className="w-full rounded-md border border-gray-300 p-3"
              placeholder="Give your story a title"
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">Category</label>
            <select
              id="category"
              className="w-full rounded-md border border-gray-300 p-3"
            >
              <option value="">Select a category</option>
              <option value="challenge">Challenge / Obstacle</option>
              <option value="leadership">Leadership</option>
              <option value="teamwork">Teamwork</option>
              <option value="technical">Technical Problem</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">Your Story</label>
            <textarea
              id="content"
              className="w-full h-64 rounded-md border border-gray-300 p-3 resize-none"
              placeholder="Start writing your experience here... What happened? What was your role? What actions did you take? What was the result?"
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">Auto-saving draft every 5 seconds</p>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Save Draft
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Analyze & Extract Key Points
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 