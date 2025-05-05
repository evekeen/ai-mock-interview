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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
        conflict:
            "Tell me about a time when you had to resolve a conflict within your team. What was your approach, and what was the outcome?",
        leadership:
            "Describe a situation where you had to lead a team through a difficult situation. What challenges did you face and how did you overcome them?",
        challenge:
            "Share an example of a challenging project you worked on. What obstacles did you encounter and how did you handle them?",
        failure:
            "Tell me about a time you failed at something. What happened, and what did you learn from the experience?",
        teamwork:
            "Describe a situation where you had to work effectively as part of a team. What was your role, and how did you contribute to the team's success?",
        success:
            "Share an accomplishment you're particularly proud of. What was the situation, and how did you achieve this success?",
        pressure:
            "Tell me about a time when you had to work under significant pressure or tight deadlines. How did you handle it?",
        adaptability:
            "Describe a situation where you had to adapt to a significant change. How did you approach it?",
        problem:
            "Share an example of a difficult problem you solved. What was your approach to finding a solution?",
    };

    return (
        questions[topicId] ||
        "Tell me about a situation where you demonstrated strong skills in this area."
    );
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
    problem: "Problem Solving",
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

    // Save the story (draft)
    const saveStory = async (storyContent: string) => {
        if (!userId || !storyContent.trim()) return;

        setIsSaving(true);
        try {
            let savedStory:
                | Pick<
                      Story,
                      | "id"
                      | "title"
                      | "user_id"
                      | "bullet_points"
                      | "metadata"
                      | "category"
                  > // Use specific fields
                | undefined;

            if (currentStory?.id) {
                // Update existing story
                savedStory = await storyApi.updateStory(currentStory.id, {
                    bullet_points: [storyContent],
                    title: topicName, // Update title if needed
                    metadata: { isFinal: false }, // Mark as draft
                    category: topicId, // Ensure category is set
                });
                console.log("Story updated:", savedStory);
            } else {
                // Create new story
                savedStory = await storyApi.createStory({
                    title: topicName,
                    user_id: userId,
                    bullet_points: [storyContent],
                    metadata: { isFinal: false }, // Mark as draft
                    category: topicId,
                });
                console.log("Story created:", savedStory);
            }

            if (savedStory) {
                // Explicitly create a new Story object for the state update
                const updatedCurrentStory: Story = {
                    id: savedStory.id,
                    title: savedStory.title,
                    user_id: savedStory.user_id,
                    bullet_points: savedStory.bullet_points,
                    metadata: savedStory.metadata,
                    category: savedStory.category,
                    created_at:
                        currentStory?.created_at || new Date().toISOString(), // Keep original or set new
                    updated_at: new Date().toISOString(), // Set current time
                };
                setCurrentStory(updatedCurrentStory);
                // Provide user feedback (e.g., toast notification)
                console.log("Draft saved successfully!");
            }
        } catch (error) {
            console.error("Error saving story draft:", error);
            // Provide error feedback
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
        <div className="container mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
            {/* Left Panel: Story Input & Feedback */}
            <div className="md:w-1/2 flex flex-col">
                <h1 className="text-2xl font-bold mb-4">
                    Practice: {topicName}
                </h1>
                <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
                    <p className="font-semibold">Interview Question:</p>
                    <p>{question}</p>
                </Card>

                <div className="flex-1 flex flex-col mb-4">
                    <label htmlFor="storyInput" className="font-semibold mb-2">
                        Your Story Draft:
                    </label>
                    <Textarea
                        id="storyInput"
                        value={input} // Use input state for textarea
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Draft your response here using the STAR method (Situation, Task, Action, Result)..."
                        className="flex-1 text-base resize-none mb-4"
                        rows={15} // Adjust rows as needed
                    />
                    <div className="flex justify-between items-center">
                        {/* Clear Button */}
                        <Button
                            variant="destructive"
                            onClick={() => setShowClearDialog(true)}
                            size="sm"
                        >
                            {/* <Trash2 className="mr-2 h-4 w-4" />  */} Clear
                            Draft
                        </Button>
                        {/* Save Draft Button */}
                        <Button
                            onClick={() => saveStory(input)}
                            disabled={isSaving || !input.trim()}
                            size="sm"
                        >
                            {/* <Save className="mr-2 h-4 w-4" /> */}
                            {isSaving ? "Saving..." : "Save Draft"}
                        </Button>
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

                {/* Feedback Display Area */}
                {isAnalyzing && (
                    <div className="text-center p-4">
                        <p>Analyzing feedback...</p>
                    </div>
                )}
                {feedback && (
                    <div className="mt-6">
                        <h2 className="text-xl font-bold mb-4">
                            Feedback Analysis
                        </h2>
                        <div className="space-y-4">
                            {/* Overall Score */}
                            <Card className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold">
                                        Overall Score
                                    </h3>
                                    <span className="font-bold text-lg">
                                        {feedback.totalScore}/100
                                    </span>
                                </div>
                                <Progress
                                    value={feedback.totalScore}
                                    className="h-2"
                                />
                                <p className="text-sm text-gray-600 mt-2">
                                    {feedback.scoreBand}
                                </p>
                            </Card>
                            {/* Category Scores */}
                            {feedback.categoryScores.map((category) => (
                                <Card key={category.category} className="p-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-medium">
                                            {getCategoryTitle(
                                                category.category
                                            )}
                                        </h4>
                                        <span
                                            className={`font-semibold ${getScoreTextColor(
                                                category.score
                                            )}`}
                                        >
                                            {category.score}/20
                                        </span>
                                    </div>
                                    <Progress
                                        value={category.score * 5}
                                        className="h-1 mb-3"
                                        indicatorClassName={getScoreColor(
                                            category.score
                                        )}
                                    />
                                    <div className="text-xs space-y-2">
                                        <p>
                                            <strong>Strengths:</strong>{" "}
                                            {category.strengths}
                                        </p>
                                        <p>
                                            <strong>Improvements:</strong>{" "}
                                            {category.improvements}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                            {/* Summary */}
                            <Card className="p-4">
                                <h3 className="font-semibold mb-2">Summary</h3>
                                <ReactMarkdown className="prose prose-sm max-w-none">
                                    {feedback.summary}
                                </ReactMarkdown>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Chat Interaction (If needed) */}
            {/* This section can be used for a more traditional chatbot if required */}
            {/* For now, it might be less relevant if focus is on story drafting/analysis */}
            {/* 
            <div className="md:w-1/2 flex flex-col border rounded-lg shadow-sm">
                <div className="p-4 border-b font-semibold bg-gray-50 rounded-t-lg">
                    AI Assistant
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-md ${
                                    message.role === "user"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                            >
                                <ReactMarkdown className="prose prose-sm max-w-none break-words">
                                    {message.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="px-4 py-2 rounded-lg shadow-md bg-gray-100 text-gray-800 animate-pulse">
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form
                    onSubmit={handleSendMessage} // This needs implementation
                    className="p-4 border-t bg-gray-50 rounded-b-lg flex items-center"
                >
                    <Input
                        value={input} // Should this be a separate input from story draft?
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask for specific feedback or help..." // Placeholder adjusted
                        className="flex-1 mr-2"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                        Send
                    </Button>
                </form>
            </div>
            */}

            {/* Clear Confirmation Dialog */}
            {showClearDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md p-6">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                {/* <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" /> */}{" "}
                                Confirm Clear Draft
                            </CardTitle>
                            <CardDescription>
                                Are you sure you want to clear your current
                                draft?
                                {currentStory &&
                                currentStory.metadata?.isFinal !== true
                                    ? " If you confirm, the saved draft will also be deleted."
                                    : " This action cannot be undone."}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-end space-x-3 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowClearDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmClear}
                            >
                                Confirm Clear
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* --- Commented out Save Dialog --- */}
            {/* {showSaveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md p-6">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" /> Confirm Save Final Story?
                            </CardTitle>
                            <CardDescription>
                                Saving this as final means it will be considered your primary answer for this topic.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm font-medium mb-2">Final Story:</p>
                            <div className="max-h-32 overflow-y-auto p-2 border rounded bg-gray-50 text-sm">
                                {finalStoryToSave}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Confirm & Save Final"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )} */}
        </div>
    );
}
