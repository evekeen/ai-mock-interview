"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const getQuestionForTopic = (topicId: string): string => {
  const questions: Record<string, string> = {
    conflict: "Tell me about a time when you had to resolve a conflict within your team. What was your approach, and what was the outcome?",
    leadership: "Describe a situation where you had to lead a team through a difficult situation. What challenges did you face and how did you overcome them?",
    challenge: "Share an example of a challenging project you worked on. What obstacles did you encounter and how did you handle them?",
    failure: "Tell me about a time you failed at something. What happened, and what did you learn from the experience?",
    teamwork: "Describe a situation where you had to work effectively as part of a team. What was your role, and how did you contribute to the team's success?",
    success: "Share an accomplishment you're particularly proud of. What was the situation, and how did you achieve this success?",
    pressure: "Tell me about a time when you had to work under significant pressure or tight deadlines. How did you handle it?",
    adaptability: "Describe a situation where you had to adapt to a significant change. How did you approach it?",
    problem: "Share an example of a difficult problem you solved. What was your approach to finding a solution?"
  };
  
  return questions[topicId] || "Tell me about a situation where you demonstrated strong skills in this area.";
};

const topicNames: Record<string, string> = {
  conflict: "Conflict Resolution",
  leadership: "Leadership Experience",
  challenge: "Challenging Work",
  failure: "Handling Failure",
  teamwork: "Teamwork",
  success: "Success Stories",
  pressure: "Working Under Pressure",
  adaptability: "Adaptability to Change",
  problem: "Problem Solving"
};

export default function PracticePage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.topic as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if topic exists
  const topicName = topicNames[topicId] || "Interview Practice";
  const question = getQuestionForTopic(topicId);
  
  useEffect(() => {
    // Get user profile from localStorage
    const profileData = localStorage.getItem('userProfile');
    if (!profileData) {
      router.push('/profile');
      return;
    }
    
    setUserProfile(JSON.parse(profileData));
    
    // Set initial assistant message with the question
    setMessages([
      {
        id: "initial",
        role: "assistant",
        content: question,
        timestamp: new Date()
      }
    ]);
  }, [router, question]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Get AI response
      const aiResponse = await fetchAIResponse([...messages, userMessage], userProfile, topicId);
      
      // Add AI response to chat
      setMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      // Add error message to chat
      setMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch AI response
  const fetchAIResponse = async (
    messageHistory: Message[], 
    profile: any, 
    topic: string
  ): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messageHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          profile,
          topic
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error fetching AI response:', error);
      return "I'm sorry, I encountered an error generating a response.";
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/stories"
          className="text-blue-600 hover:underline inline-flex items-center mb-4"
        >
          ← Back to Topics
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">{topicName}</h1>
        <p className="text-gray-600 mt-1">Practice your interview response with AI feedback</p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Chat messages */}
        <div className="h-[60vh] overflow-y-auto p-4 md:p-6 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 max-w-[85%] ${
                message.role === "user" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div
                className={`rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <p>{message.content}</p>
              </div>
              <div
                className={`text-xs mt-1 text-gray-500 ${
                  message.role === "user" ? "text-right" : ""
                }`}
              >
                {message.role === "user" ? "You" : "AI Coach"} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 mb-4 max-w-[85%]">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
              <div className="text-xs text-gray-500">AI Coach is typing...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={messages.length === 1 ? "Share your story..." : "Type your response..."}
              disabled={isLoading}
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              Send
            </button>
          </form>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>
          Remember to structure your response using the STAR method: Situation, Task, Action, Result
        </p>
      </div>
    </div>
  );
} 