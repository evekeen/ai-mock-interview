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
import Link from "next/link"; // Import Link

// Define the structure for a story topic
interface StoryTopic {
    id: string;
    title: string;
    description: string;
    exampleQuestion: string;
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
    },
    {
        id: "leadership-experience",
        title: "Leadership Experience",
        description:
            "Share an example of a time you demonstrated leadership skills, formally or informally.",
        exampleQuestion:
            "Describe a situation where you had to take the lead on a project. What was the outcome?",
    },
    {
        id: "challenging-work-situations",
        title: "Challenging Work Situations",
        description:
            "Discuss a challenging project or task you faced and how you overcame obstacles.",
        exampleQuestion:
            "Tell me about the most challenging project you've worked on. What made it challenging and how did you manage it?",
    },
    {
        id: "failure-handling",
        title: "Handling Failure",
        description:
            "Talk about a time you made a mistake or failed at something. What did you learn from it?",
        exampleQuestion:
            "Describe a time you failed to meet a goal or expectation. What happened and what did you learn?",
    },
    {
        id: "teamwork-examples",
        title: "Teamwork Examples",
        description:
            "Provide an example of a time you worked effectively as part of a team.",
        exampleQuestion:
            "Tell me about a time you collaborated with others on a difficult project.",
    },
    {
        id: "success-stories",
        title: "Success Stories",
        description:
            "Share one of your most significant accomplishments at work.",
        exampleQuestion:
            "What is your greatest professional achievement, and why?",
    },
    {
        id: "handling-pressure-stress",
        title: "Handling Pressure/Stress",
        description:
            "Describe how you handle work pressure and tight deadlines.",
        exampleQuestion:
            "Tell me about a time you had to work under significant pressure. How did you cope?",
    },
    {
        id: "adaptability-to-change",
        title: "Adaptability to Change",
        description:
            "Discuss a situation where you had to adapt to unexpected changes at work.",
        exampleQuestion:
            "Describe a time when your work priorities changed suddenly. How did you adapt?",
    },
    {
        id: "problem-solving-approach",
        title: "Problem-Solving Approach",
        description:
            "Explain your process for analyzing and solving complex problems.",
        exampleQuestion:
            "Walk me through a complex problem you had to solve recently. What was your approach?",
    },
];

export default function StoriesPage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Select a Story Topic</h1>
            <p className="mb-8 text-lg text-gray-600">
                Choose a common behavioral interview question topic below to
                practice your response. We'll help you structure your story
                using the STAR method and provide feedback.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storyTopics.map((topic) => (
                    <Card key={topic.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{topic.title}</CardTitle>
                            <CardDescription>
                                {topic.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-gray-500 italic">
                                Example: "{topic.exampleQuestion}"
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Link
                                href={`/practice/${topic.id}`}
                                passHref
                            >
                                <Button variant="outline" className="cursor-pointer">
                                    Help Me Brainstorm
                                </Button>
                            </Link>
                            <Link
                                href={`/mock?topic=${encodeURIComponent(
                                    topic.title
                                )}`}
                                passHref
                            >
                                <Button className="cursor-pointer">Practice the Question</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
