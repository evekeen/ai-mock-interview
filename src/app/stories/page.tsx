import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StoriesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Placeholder data - in a real app, this would come from the database
  const storiesData = {
    challenge: [
      { id: 'c1', title: 'Difficult Project Deadline', score: 7 },
      { id: 'c2', title: 'Handling Client Expectations', score: 4 },
    ],
    leadership: [
      { id: 'l1', title: 'Leading Cross-functional Team', score: 6 },
    ],
    teamwork: [
      { id: 't1', title: 'Resolving Team Conflict', score: 8 },
      { id: 't2', title: 'Collaboration on Major Release', score: 5 },
    ],
    technical: [
      { id: 'tech1', title: 'Complex System Architecture', score: 6 },
      { id: 'tech2', title: 'Performance Optimization', score: 9 },
    ]
  };

  const categoryLabels = {
    challenge: 'Challenges & Obstacles',
    leadership: 'Leadership',
    teamwork: 'Teamwork',
    technical: 'Technical Problems'
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Interview Stories</h1>
        <Link 
          href="/brainstorm" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Create New Story
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(categoryLabels).map(([category, label]) => (
          <div key={category} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{label}</h2>
            
            {storiesData[category as keyof typeof storiesData]?.length > 0 ? (
              <div className="space-y-3">
                {storiesData[category as keyof typeof storiesData].map(story => (
                  <div 
                    key={story.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{story.title}</h3>
                      <div className={`rounded-full h-8 w-8 flex items-center justify-center text-white ${
                        story.score >= 8 ? 'bg-green-500' : 
                        story.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {story.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No stories yet</p>
                <Link 
                  href={`/brainstorm?category=${category}`}
                  className="inline-block mt-2 text-blue-600 hover:underline"
                >
                  Add your first {label.toLowerCase()} story
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 