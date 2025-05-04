"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useEffect, useState } from "react";

// Define types
interface Message {
    from: "user" | "assistant";
    text: string;
}

interface TranscriptData {
    topic: string;
    transcript: Message[];
    timestamp: string;
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

export default function FeedbackPage() {
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(
        null
    );
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progressAnimation, setProgressAnimation] = useState(0);

    useEffect(() => {
        // Load transcript data from localStorage
        try {
            const savedData = localStorage.getItem("interviewTranscript");
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                setTranscriptData(parsedData);
            } else {
                setError(
                    "No interview transcript found. Please complete an interview first."
                );
            }
        } catch (e) {
            console.error("Error loading transcript data:", e);
            setError("Failed to load interview data.");
        }
        setLoading(false);
    }, []);

    // Animate total score filling when feedback is loaded
    useEffect(() => {
        if (feedback) {
            // Animate from 0 to total score over 1.5 seconds
            const totalScore = feedback.totalScore;
            const duration = 1500; // ms
            const interval = 10; // ms
            const step = totalScore / (duration / interval);
            let current = 0;

            const timer = setInterval(() => {
                current += step;
                if (current >= totalScore) {
                    current = totalScore;
                    clearInterval(timer);
                }
                setProgressAnimation(Math.round(current));
            }, interval);

            return () => clearInterval(timer);
        }
    }, [feedback]);

    const analyzeInterview = async () => {
        if (!transcriptData) return;

        setAnalyzing(true);
        setError(null);

        try {
            const response = await fetch("/api/openai/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    transcript: transcriptData.transcript,
                    topic: transcriptData.topic,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to analyze interview"
                );
            }

            const data = await response.json();
            setFeedback(data);
        } catch (e: Error | unknown) {
            console.error("Error analyzing interview:", e);
            setError(
                e instanceof Error ? e.message : "An error occurred while analyzing your interview."
            );
        } finally {
            setAnalyzing(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Loading your interview data...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container mx-auto p-8">
                <Card className="p-6 max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Error
                    </h1>
                    <p className="mb-6">{error}</p>
                    <Link href="/stories">
                        <Button>Return to Stories</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    // No transcript found
    if (!transcriptData) {
        return (
            <div className="container mx-auto p-8">
                <Card className="p-6 max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">
                        No Interview Found
                    </h1>
                    <p className="mb-6">
                        No interview transcript was found. Please complete a
                        mock interview first.
                    </p>
                    <Link href="/stories">
                        <Button>Go to Stories</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Interview Feedback</h1>

            {/* Topic Info */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Interview Topic</h2>
                <Card className="p-4">
                    <p className="font-medium">{transcriptData.topic}</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Completed on{" "}
                        {new Date(transcriptData.timestamp).toLocaleString()}
                    </p>
                </Card>
            </div>

            {/* Analysis Button (if not yet analyzed) */}
            {!feedback && !analyzing && (
                <div className="mb-8">
                    <Button
                        onClick={analyzeInterview}
                        className="text-lg py-6 px-8"
                        size="lg"
                    >
                        Analyze My Interview
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                        This will use AI to evaluate your interview performance
                        across 5 key dimensions.
                    </p>
                </div>
            )}

            {/* Loading state for analysis */}
            {analyzing && (
                <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                        <p>Analyzing your interview performance...</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                        This may take a moment as we&apos;re carefully evaluating
                        your responses across multiple dimensions.
                    </p>
                </div>
            )}

            {/* Feedback Results */}
            {feedback && (
                <div className="space-y-8">
                    {/* Overall Score Circle */}
                    <div className="flex flex-col items-center mb-10">
                        <h2 className="text-2xl font-bold mb-4">
                            Overall Score
                        </h2>
                        <div className="relative w-48 h-48">
                            {/* Circle background */}
                            <div className="absolute inset-0 rounded-full bg-gray-200"></div>

                            {/* Circle fill based on score */}
                            <svg
                                className="absolute inset-0"
                                viewBox="0 0 100 100"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#ddd"
                                    strokeWidth="10"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke={
                                        progressAnimation > 80
                                            ? "#22c55e"
                                            : progressAnimation > 60
                                            ? "#eab308"
                                            : progressAnimation > 40
                                            ? "#f97316"
                                            : "#ef4444"
                                    }
                                    strokeWidth="10"
                                    strokeDasharray={`${
                                        (progressAnimation / 100) * 283
                                    } 283`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 50 50)"
                                    className="transition-all duration-300 ease-out"
                                />
                            </svg>

                            {/* Score text */}
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-4xl font-bold">
                                    {progressAnimation}
                                </span>
                                <span className="text-lg">/100</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xl font-semibold">
                                {feedback.scoreBand}
                            </p>
                        </div>
                    </div>

                    {/* Category Scores */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">
                            Detailed Scores
                        </h2>
                        <div className="space-y-6">
                            {feedback.categoryScores.map((category) => (
                                <div
                                    key={category.category}
                                    className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-lg font-semibold">
                                            {getCategoryTitle(
                                                category.category
                                            )}
                                        </h3>
                                        <span
                                            className={`font-bold text-lg ${getScoreTextColor(
                                                category.score
                                            )}`}
                                        >
                                            {category.score}/20
                                        </span>
                                    </div>

                                    <Progress
                                        value={category.score * 5}
                                        className="h-2 mb-4"
                                        indicatorClassName={getScoreColor(
                                            category.score
                                        )}
                                    />

                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <h4 className="font-medium text-green-700">
                                                Strengths
                                            </h4>
                                            <p className="text-sm mt-1">
                                                {category.strengths}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-amber-700">
                                                Areas for Improvement
                                            </h4>
                                            <p className="text-sm mt-1">
                                                {category.improvements}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Overall Summary */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">
                            Summary Feedback
                        </h2>
                        <Card className="p-6">
                            <div className="prose max-w-none">
                                {feedback.summary
                                    .split("\n\n")
                                    .map((paragraph, i) => (
                                        <p key={i} className="mb-4">
                                            {paragraph}
                                        </p>
                                    ))}
                            </div>
                        </Card>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-4 mt-8 mb-16">
                        <Link href="/stories">
                            <Button variant="outline" size="lg">
                                Practice Another Question
                            </Button>
                        </Link>
                        {/* Could add more actions like "Review Transcript", "Share Results", etc. */}
                    </div>
                </div>
            )}

            {/* Transcript Display */}
            <div className="mt-8 mb-16">
                <h2 className="text-xl font-semibold mb-4">
                    Interview Transcript
                </h2>
                <Card className="p-4">
                    <div className="max-h-96 overflow-y-auto">
                        {transcriptData.transcript.map((message, i) => (
                            <div
                                key={i}
                                className={`mb-2 p-2 rounded-md ${
                                    message.from === "user"
                                        ? "bg-blue-50 ml-8"
                                        : "bg-gray-50 mr-8"
                                }`}
                            >
                                <p>
                                    <strong>
                                        {message.from === "user"
                                            ? "You"
                                            : "Interviewer"}
                                        :{" "}
                                    </strong>
                                    {message.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
