"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    resume: "",
    jobDescription: "",
    additionalNotes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real app, we would save this to a database
    // For now, just store in localStorage
    localStorage.setItem('userProfile', JSON.stringify(formState));
    
    // Navigate to interview preparation page
    router.push('/interview-prep');
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <UserButton afterSignOutUrl="/" />
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Build Your Interview Profile</h2>
        <p className="mb-6 text-gray-600">
          Complete your profile to get the most personalized interview preparation experience.
          We'll use this information to tailor your practice sessions.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">
              Your Resume / Experience
            </label>
            <textarea
              id="resume"
              name="resume"
              rows={8}
              value={formState.resume}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Paste your resume or describe your experience here..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              rows={6}
              value={formState.jobDescription}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Paste the job description you're applying for..."
              required
            />
          </div>
          
          <div>
            <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              rows={4}
              value={formState.additionalNotes}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Any other information you'd like us to know (skills, career goals, etc.)"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {isSubmitting ? "Saving..." : "Save Profile & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 