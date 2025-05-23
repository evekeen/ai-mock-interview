"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { storyApi } from "../../../lib/db-api";
import { Story as BaseStory } from "../../../types";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

// Extend the imported Story type with our needed properties
interface Story extends BaseStory {
  metadata?: {
    isFinal?: boolean;
  };
}

interface UserProfile {
  name: string;
  role?: string;
  experience?: string;
  skills?: string[];
  background?: string;
  interests?: string[];
  goals?: string[];
  education?: string;
  projects?: string[];
  achievements?: string[];
}

interface CategoryScore {
  category: string;
  score: number;
  strengths: string;
  improvements: string;
  explanation: string;
}

interface FeedbackData {
  categoryScores: CategoryScore[];
  totalScore: number;
  scoreBand: string;
  summary: string;
}

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

// Helper to get the name title cased and formatted
const getCategoryTitle = (category: string) => {
  // Add spaces before capitals and title case
  return category
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
};

// Helper to get color based on score
const getScoreColor = (score: number) => {
  if (score <= 5) return "bg-red-500";
  if (score <= 10) return "bg-orange-500";
  if (score <= 15) return "bg-yellow-500";
  return "bg-green-500";
};

// Helper to get text color based on score
const getScoreTextColor = (score: number) => {
  if (score <= 5) return "text-red-500";
  if (score <= 10) return "text-orange-500";
  if (score <= 15) return "text-yellow-500";
  return "text-green-500";
};

export default function PracticePage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.topic as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { userId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  
  // Check if topic exists
  const topicName = topicNames[topicId] || "Interview Practice";
  const question = getQuestionForTopic(topicId);
  
  // Load existing story if available
  useEffect(() => {
    const loadExistingStory = async () => {
      if (!userId) return;
      
      try {
        const existingStory = await storyApi.getUserStoryByCategory(userId, topicId);
        
        if (existingStory) {
          setCurrentStory(existingStory);
          
          // Add a message showing the current story if it exists
          setMessages([
            {
              id: "initial",
              role: "assistant",
              content: question,
              timestamp: new Date()
            },
            {
              id: "existing-story",
              role: "user",
              content: existingStory.bullet_points?.join("\n") || existingStory.title,
              timestamp: new Date()
            },
            {
              id: "evaluation",
              role: "assistant",
              content: "Here's your existing story. Would you like to continue improving it? I can help evaluate how well it follows the STAR framework and suggest improvements.",
              timestamp: new Date()
            }
          ]);

          // Removed automatic analysis when loading an existing story
        } else {
          // No existing story, just show the initial question
          setMessages([
            {
              id: "initial",
              role: "assistant",
              content: question,
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error("Error loading existing story:", error);
        setMessages([
          {
            id: "initial",
            role: "assistant",
            content: question,
            timestamp: new Date()
          }
        ]);
      }
    };
    
    // Get user profile from localStorage
    const profileData = localStorage.getItem('userProfile');
    if (!profileData) {
      return;
    }
    
    setUserProfile(JSON.parse(profileData));
    loadExistingStory();
  }, [router, question, topicId, userId]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Analyze the story using the OpenAI analyze endpoint
  const analyzeStory = async (storyContent: string) => {
    if (!storyContent.trim()) return;
    
    // Don't analyze if the content is a suggestion message
    if (isSuggestionMessage(storyContent)) return;
    
    setIsAnalyzing(true);
    
    try {
      const transcript = [
        { from: "assistant", text: question },
        { from: "user", text: storyContent }
      ];
      
      const response = await fetch('/api/openai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          topic: topicName
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze story');
      }
      
      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error("Error analyzing story:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveStory = async (storyContent: string) => {
    if (!userId || !storyContent.trim()) return;
    
    setIsSaving(true);
    try {
      if (currentStory) {
        // Update existing story
        const updatedStory = await storyApi.updateStory(currentStory.id, {
          bullet_points: [storyContent],
          title: topicName,
        });
        setCurrentStory(updatedStory);
      } else {
        // Create new story
        const newStory = await storyApi.createStory(
          userId,
          topicId,
          topicName,
          [storyContent]
        );
        setCurrentStory(newStory);
      }
      
      // Removed automatic analysis here
      
    } catch (error) {
      console.error("Error saving story:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
      if (!userProfile) {
        router.push('/profile');
        return;
      }
      
      // We'll no longer save the user message directly as the story
      // The updatedStory from the API response will be used instead
      
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
  
  // List of suggestion messages to filter out
  const suggestionMessages = [
    "Suggest a story based on my resume",
    "What counts as leadership for me?",
    "Help me structure this story",
    "Is this a strong PEI story?",
    "Help me show personal impact",
    "Make this story more quantifiable",
    "What follow-ups might I get?",
    "How do I sound more authentic?",
    "How do I highlight my role?",
    "Help with a challenge/conflict story"
  ];
  
  // Function to filter out suggestion messages
  const isSuggestionMessage = (content: string): boolean => {
    return suggestionMessages.includes(content.trim());
  };
  
  // Function to fetch AI response
  const fetchAIResponse = async (
    messageHistory: Message[], 
    profile: UserProfile, 
    topic: string
  ): Promise<string> => {
    try {
      // Filter out suggestion messages for the API request
      const filteredMessages = messageHistory.map(msg => ({
        role: msg.role,
        // Keep only user messages that aren't suggestions
        content: msg.role === "user" && isSuggestionMessage(msg.content) 
          ? "SUGGESTION_MESSAGE" // Mark as suggestion
          : msg.content
      }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: filteredMessages,
          profile,
          topic,
          currentStory: currentStory,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI response');
      }
      
      type ChatResponse = {
        response: string;
        updatedStory?: string;
      };
      
      const data = await response.json() as ChatResponse;
      
      // If there's an updated story, save it and analyze it
      if (data.updatedStory) {
        await saveStory(data.updatedStory);
        // Analyze the story after a user message and story update
        analyzeStory(data.updatedStory);
      }
      
      return data.response || 'No response received';
    } catch (error) {
      console.error('Error fetching AI response:', error);
      return "I'm sorry, I encountered an error generating a response.";
    }
  };

  
  const handleConfirmClear = async () => {
    if (!userId || !currentStory) return;
    
    setIsSaving(true);
    try {
      // Delete the story from the database
      if (currentStory.id) {
        await storyApi.deleteStory(currentStory.id);
      }
      
      // Reset state
      setCurrentStory(null);
      setFeedback(null);
      
      // Reset messages to just the initial question
      setMessages([
        {
          id: "initial",
          role: "assistant",
          content: question,
          timestamp: new Date()
        }
      ]);
      
      // Add confirmation message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Your story has been cleared. You can start fresh with a new response.",
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error("Error clearing story:", error);
    } finally {
      setIsSaving(false);
    }
    setShowClearDialog(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
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
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main chat panel */}
        <div className="lg:w-2/3">
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
                    {message.role === "user" ? (
                      <p>{message.content}</p>
                    ) : (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    )}
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
              {isSaving && (
                <div className="text-xs text-center text-gray-500 mb-2">
                  Saving your story...
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
                  disabled={isLoading || isSaving}
                  className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  Send
                </button>
              </form>
              
              {/* Suggestion buttons */}
              {!messages.some(message => message.role === "user") && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestionMessages.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-xs bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-indigo-700 px-3 py-1.5 rounded-full transition-all hover:from-indigo-500/20 hover:to-blue-500/20 hover:shadow-md hover:shadow-blue-200 border border-indigo-200/50 relative overflow-hidden group"
                      disabled={isLoading || isSaving}
                    >
                      <span className="relative z-10">{suggestion}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 group-hover:opacity-100 opacity-0 transition-opacity"></div>
                      <div className="absolute top-0 left-0 h-full w-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 group-hover:w-full transition-all duration-300"></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-sm text-gray-500 text-center">
            <p>
              Remember to structure your response using the STAR method: Situation, Task, Action, Result
            </p>
          </div>
        </div>
        
        {/* Feedback panel - right side */}
        <div className="lg:w-1/3">
          {/* Current Story */}
          {currentStory?.bullet_points && currentStory.bullet_points.length > 0 && (
            <Card className="p-4 mb-6">
              <h2 className="text-lg font-semibold mb-2">Current Story</h2>
              <div className="bg-gray-50 p-3 rounded-md mb-2 text-sm">
                {currentStory.bullet_points[0]}
              </div>
              {currentStory.metadata?.isFinal === true && (
                <div className="text-xs text-green-600 font-medium mb-3">
                  ✓ Final Version
                </div>
              )}
              
              <div className="flex justify-between mt-3">                
                {currentStory && (
                  <button
                    onClick={() => setShowClearDialog(true)}
                    className="px-3 py-1.5 border border-red-600 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
                    disabled={isLoading || isSaving}
                  >
                    Start Over
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Feedback Analysis */}
          {isAnalyzing ? (
            <div className="bg-white shadow-md rounded-lg p-4 mb-6 relative overflow-hidden">
              <div className="flex items-center justify-center p-8">
                <div className="relative">                  
                  {/* Floating particles */}
                  <div className="absolute top-0 left-0 w-full h-full">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${1 + Math.random() * 3}s`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-2">
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 font-bold animate-pulse">Analyzing your story with AI magic</p>
                <p className="text-xs text-gray-500 mt-1">Creating comprehensive feedback...</p>
              </div>
            </div>
          ) : feedback ? (
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
              <div className="p-4 bg-gray-100 border-b">
                <h3 className="font-semibold">Story Analysis</h3>
                <div className="flex items-center mt-2">
                  <div className="font-bold text-xl mr-2">{feedback.totalScore}</div>
                  <div className="text-xs text-gray-500">/100</div>
                  <div className="ml-auto text-sm font-medium">
                    {feedback.scoreBand}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  {feedback.categoryScores.map((category) => (
                    <div key={category.category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium">
                          {getCategoryTitle(category.category)}
                        </span>
                        <span
                          className={`text-xs font-medium ${getScoreTextColor(
                            category.score
                          )}`}
                        >
                          {category.score}/20
                        </span>
                      </div>
                      <Progress
                        value={category.score * 5}
                        className="h-1 mb-1"
                        indicatorClassName={getScoreColor(category.score)}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <div className="text-xs text-gray-700">
                    {typeof feedback.summary === 'string' ? feedback.summary.split('\n\n')[0] : ''}
                  </div>
                  
                  <button
                    className="text-xs text-blue-600 hover:underline mt-2"
                    onClick={() => {
                      if (feedback.categoryScores.length > 0) {
                        const strengths = feedback.categoryScores[0].strengths;
                        const improvements = feedback.categoryScores[0].improvements;
                        
                        // Add a message with the detailed feedback
                        setMessages(prev => [
                          ...prev,
                          {
                            id: Date.now().toString(),
                            role: "assistant",
                            content: `Here's some detailed feedback on your story:\n\n**Strengths:**\n${strengths}\n\n**Areas for improvement:**\n${improvements}`,
                            timestamp: new Date()
                          }
                        ]);
                      }
                    }}
                  >
                    Show detailed feedback
                  </button>
                </div>
              </div>
            </div>
          ) : (
            currentStory?.bullet_points && currentStory.bullet_points.length > 0 && (
              <div className="bg-white shadow-md rounded-lg p-4 mb-6 text-center">
                <p className="text-sm text-gray-600">
                  Your story will be analyzed when you send a message and the story updates.
                </p>
              </div>
            )
          )}
        </div>
      </div>          

      {/* Clear story dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Clear Story</h3>
            <p className="mb-4 text-sm text-gray-600">
              Are you sure you want to clear your story? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isSaving}
              >
                {isSaving ? "Clearing..." : "Clear Story"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 