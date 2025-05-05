"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertTriangle,
    Clock,
    Lightbulb,
    MessagesSquare,
    Mountain,
    RefreshCw,
    Trophy,
    Users,
    UsersRound
} from "lucide-react";
import Link from "next/link";
import React from 'react';

// Define the structure for a story topic
interface StoryTopic {
    id: string;
    title: string;
    description: string;
    exampleQuestion: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

// List of common behavioral interview topics
const storyTopics: StoryTopic[] = [
    {
        id: "conflict-resolution",
        title: "Conflict Resolution",
        description:
            "Describe a time you encountered conflict with a colleague or supervisor and how you handled it.",
        exampleQuestion:
            "Tell me about a time you had a disagreement with a team member. How did you resolve it?",
        icon: <MessagesSquare className="h-5 w-5" strokeWidth={2} />,
        color: "#e74c3c",
        bgColor: "#fdedec",
    },
    {
        id: "leadership-experience",
        title: "Leadership Experience",
        description:
            "Share an example of a time you demonstrated leadership skills, formally or informally.",
        exampleQuestion:
            "Describe a situation where you had to take the lead on a project. What was the outcome?",
        icon: <Users className="h-5 w-5" strokeWidth={2} />,
        color: "#3498db",
        bgColor: "#ebf5fb",
    },
    {
        id: "challenging-work-situations",
        title: "Challenging Work Situations",
        description:
            "Discuss a challenging project or task you faced and how you overcame obstacles.",
        exampleQuestion:
            "Tell me about the most challenging project you've worked on. What made it challenging and how did you manage it?",
        icon: <Mountain className="h-5 w-5" strokeWidth={2} />,
        color: "#8e44ad",
        bgColor: "#f4ecf7",
    },
    {
        id: "failure-handling",
        title: "Handling Failure",
        description:
            "Talk about a time you made a mistake or failed at something. What did you learn from it?",
        exampleQuestion:
            "Describe a time you failed to meet a goal or expectation. What happened and what did you learn?",
        icon: <AlertTriangle className="h-5 w-5" strokeWidth={2} />,
        color: "#f39c12",
        bgColor: "#fef5e7",
    },
    {
        id: "teamwork-examples",
        title: "Teamwork Examples",
        description:
            "Provide an example of a time you worked effectively as part of a team.",
        exampleQuestion:
            "Tell me about a time you collaborated with others on a difficult project.",
        icon: <UsersRound className="h-5 w-5" strokeWidth={2} />,
        color: "#2ecc71",
        bgColor: "#eafaf1",
    },
    {
        id: "success-stories",
        title: "Success Stories",
        description:
            "Share one of your most significant accomplishments at work.",
        exampleQuestion:
            "What is your greatest professional achievement, and why?",
        icon: <Trophy className="h-5 w-5" strokeWidth={2} />,
        color: "#f1c40f",
        bgColor: "#fef9e7",
    },
    {
        id: "handling-pressure-stress",
        title: "Handling Pressure/Stress",
        description:
            "Describe how you handle work pressure and tight deadlines.",
        exampleQuestion:
            "Tell me about a time you had to work under significant pressure. How did you cope?",
        icon: <Clock className="h-5 w-5" strokeWidth={2} />,
        color: "#e67e22",
        bgColor: "#fdf2e9",
    },
    {
        id: "adaptability-to-change",
        title: "Adaptability to Change",
        description:
            "Discuss a situation where you had to adapt to unexpected changes at work.",
        exampleQuestion:
            "Describe a time when your work priorities changed suddenly. How did you adapt?",
        icon: <RefreshCw className="h-5 w-5" strokeWidth={2} />,
        color: "#16a085",
        bgColor: "#e8f8f5",
    },
    {
        id: "problem-solving-approach",
        title: "Problem-Solving Approach",
        description:
            "Explain your process for analyzing and solving complex problems.",
        exampleQuestion:
            "Walk me through a complex problem you had to solve recently. What was your approach?",
        icon: <Lightbulb className="h-5 w-5" strokeWidth={2} />,
        color: "#9b59b6",
        bgColor: "#f5eef8",
    },
];

export default function StoriesPage() {
    return (
        <div className="container mx-auto p-4 bg-gradient-to-b from-slate-50 to-gray-100">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
                    Select a Story Topic
                </h1>
                <p className="mb-8 text-lg text-gray-600 text-center max-w-2xl mx-auto">
                    Choose a common behavioral interview question topic below to
                    practice your response. We&apos;ll help you structure your story
                    using the STAR method and provide feedback.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storyTopics.map((topic) => (
                    <Card 
                        key={topic.id} 
                        className="flex flex-col transition-all duration-300 hover:shadow-lg"
                        style={{ 
                            borderTop: `3px solid ${topic.color}`,
                            backgroundColor: topic.bgColor,
                        }}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div 
                                    className="p-2 rounded-full" 
                                    style={{ 
                                        backgroundColor: `${topic.color}25`,
                                        color: topic.color 
                                    }}
                                >
                                    <div style={{ color: topic.color }}>
                                        {topic.icon}
                                    </div>
                                </div>
                                <CardTitle style={{ color: topic.color }}>{topic.title}</CardTitle>
                            </div>
                            <CardDescription className="mt-2 text-gray-700">
                                {topic.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-gray-600 italic">
                                Example: &quot;{topic.exampleQuestion}&quot;
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Link
                                href={`/practice/${topic.id}`}
                                passHref
                            >
                                <Button 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-gray-100"
                                    style={{ borderColor: topic.color, color: topic.color }}
                                >
                                    Help Me Brainstorm
                                </Button>
                            </Link>
                            <Link
                                href={`/mock?topic=${encodeURIComponent(
                                    topic.title
                                )}`}
                                passHref
                            >
                                <Button 
                                    className="cursor-pointer"
                                    style={{ backgroundColor: topic.color }}
                                >
                                    Practice the Question
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
