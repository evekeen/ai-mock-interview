"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InterviewPrepPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Behavioral Interview Preparation</h1>
        <p className="mt-2 text-gray-600">Learn how to effectively structure your interview responses</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">What are Behavioral Interviews?</h2>
            <p className="mb-4">
              Behavioral interviews are based on the premise that past behavior is the best predictor of future 
              performance. Interviewers ask questions about your past experiences to understand how you might 
              handle similar situations in the future.
            </p>
            <p>
              These questions typically start with phrases like:
            </p>
            <ul className="list-disc pl-5 my-4 space-y-2">
              <li>&quot;Tell me about a time when...&quot;</li>
              <li>&quot;Describe a situation where...&quot;</li>
              <li>&quot;Give me an example of...&quot;</li>
              <li>&quot;How have you handled...&quot;</li>
            </ul>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">The STAR Method</h2>
            <p className="mb-4">
              The STAR method is a structured approach to answering behavioral interview questions effectively:
            </p>
            
            <div className="space-y-4 mt-6">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-bold text-blue-700">Situation</h3>
                <p>Set the context by describing the specific situation you were in. Be concise but provide enough detail.</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h3 className="font-bold text-green-700">Task</h3>
                <p>Explain your responsibility or what you were trying to accomplish in that situation.</p>
              </div>
              
              <div className="border-l-4 border-amber-500 pl-4 py-2">
                <h3 className="font-bold text-amber-700">Action</h3>
                <p>Describe the specific actions you took to address the situation. Focus on YOUR contribution.</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <h3 className="font-bold text-purple-700">Result</h3>
                <p>Share the outcomes of your actions. Quantify results when possible and include what you learned.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-blue-50 shadow-md rounded-lg p-6 border border-blue-100">
            <h2 className="text-xl font-semibold mb-4">Ready to Practice?</h2>
            <p className="mb-6">
              Select a behavioral interview topic to practice your storytelling skills. Our AI coach will provide 
              feedback to help you improve your responses.
            </p>
            
            <button
              onClick={() => router.push('/stories')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Choose a Topic to Practice
            </button>
            
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <h3 className="font-medium text-yellow-800 mb-2">Pro Tip</h3>
              <p className="text-sm text-yellow-700">
                Prepare 5-7 strong STAR stories that can be adapted to answer different behavioral questions. 
                This gives you flexibility during your interview.
              </p>
            </div>
            
            <div className="mt-4">
              <Link 
                href="/profile"
                className="block text-center text-blue-600 hover:underline mt-4"
              >
                ← Update Your Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 