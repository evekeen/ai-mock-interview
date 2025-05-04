"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StoriesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check for user profile in localStorage
    const userProfile = localStorage.getItem('userProfile');
    if (!userProfile) {
      // Redirect to profile page if profile not found
      router.push('/profile');
    } else {
      setIsLoading(false);
    }
  }, [router]);
  
  // Common behavioral interview topics
  const topics = [
    {
      id: 'conflict',
      title: 'Conflict Resolution',
      description: 'Tell me about a time when you had to resolve a conflict within your team.',
      color: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      id: 'leadership',
      title: 'Leadership Experience',
      description: 'Describe a situation where you had to lead a team through a difficult situation.',
      color: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100'
    },
    {
      id: 'challenge',
      title: 'Challenging Work',
      description: 'Share an example of a challenging project and how you overcame obstacles.',
      color: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100'
    },
    {
      id: 'failure',
      title: 'Handling Failure',
      description: 'Tell me about a time you failed and what you learned from it.',
      color: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverColor: 'hover:bg-red-100'
    },
    {
      id: 'teamwork',
      title: 'Teamwork',
      description: 'Describe a situation where you had to work effectively as part of a team.',
      color: 'bg-amber-50',
      borderColor: 'border-amber-200',
      hoverColor: 'hover:bg-amber-100'
    },
    {
      id: 'success',
      title: 'Success Stories',
      description: 'Share an accomplishment you\'re particularly proud of and how you achieved it.',
      color: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      hoverColor: 'hover:bg-emerald-100'
    },
    {
      id: 'pressure',
      title: 'Working Under Pressure',
      description: 'Tell me about a time when you had to work under pressure or tight deadlines.',
      color: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-100'
    },
    {
      id: 'adaptability',
      title: 'Adaptability to Change',
      description: 'Describe a situation where you had to adapt to a significant change.',
      color: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      hoverColor: 'hover:bg-indigo-100'
    },
    {
      id: 'problem',
      title: 'Problem Solving',
      description: 'Share an example of a difficult problem you solved through your analytical approach.',
      color: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      hoverColor: 'hover:bg-cyan-100'
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Behavioral Interview Topics</h1>
        <p className="mt-2 text-gray-600">Select a topic to practice your interview storytelling</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <div 
            key={topic.id}
            className={`rounded-lg p-6 border ${topic.color} ${topic.borderColor} ${topic.hoverColor} transition cursor-pointer`}
            onClick={() => router.push(`/practice/${topic.id}`)}
          >
            <h2 className="font-semibold text-lg mb-2">{topic.title}</h2>
            <p className="text-gray-700 mb-4">{topic.description}</p>
            <div className="flex justify-end">
              <span className="text-blue-600 text-sm">Practice this response →</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-10 pt-6 border-t border-gray-200">
        <Link 
          href="/interview-prep"
          className="text-blue-600 hover:underline inline-flex items-center"
        >
          ← Back to Interview Preparation
        </Link>
      </div>
    </div>
  );
} 