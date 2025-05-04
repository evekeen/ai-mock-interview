import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Define the category scoring functions
const scoreFunctions = [
    {
        name: "scoreStoryStrength",
        description: "Score the story's strength and relevance (0-20 points)",
        parameters: {
            type: "object",
            properties: {
                score: {
                    type: "integer",
                    description: "Score from 0-20",
                    minimum: 0,
                    maximum: 20,
                },
                strengths: {
                    type: "string",
                    description: "What the candidate did well in this category",
                },
                improvements: {
                    type: "string",
                    description:
                        "How the candidate could improve in this category",
                },
                explanation: {
                    type: "string",
                    description: "Explanation of the score",
                },
            },
            required: ["score", "strengths", "improvements", "explanation"],
        },
    },
    {
        name: "scoreStructureClarity",
        description: "Score the story's structure and clarity (0-20 points)",
        parameters: {
            type: "object",
            properties: {
                score: {
                    type: "integer",
                    description: "Score from 0-20",
                    minimum: 0,
                    maximum: 20,
                },
                strengths: {
                    type: "string",
                    description: "What the candidate did well in this category",
                },
                improvements: {
                    type: "string",
                    description:
                        "How the candidate could improve in this category",
                },
                explanation: {
                    type: "string",
                    description: "Explanation of the score",
                },
            },
            required: ["score", "strengths", "improvements", "explanation"],
        },
    },
    {
        name: "scorePersonalOwnership",
        description:
            "Score the candidate's personal ownership and action (0-20 points)",
        parameters: {
            type: "object",
            properties: {
                score: {
                    type: "integer",
                    description: "Score from 0-20",
                    minimum: 0,
                    maximum: 20,
                },
                strengths: {
                    type: "string",
                    description: "What the candidate did well in this category",
                },
                improvements: {
                    type: "string",
                    description:
                        "How the candidate could improve in this category",
                },
                explanation: {
                    type: "string",
                    description: "Explanation of the score",
                },
            },
            required: ["score", "strengths", "improvements", "explanation"],
        },
    },
    {
        name: "scoreImpactResults",
        description: "Score the impact and results of the story (0-20 points)",
        parameters: {
            type: "object",
            properties: {
                score: {
                    type: "integer",
                    description: "Score from 0-20",
                    minimum: 0,
                    maximum: 20,
                },
                strengths: {
                    type: "string",
                    description: "What the candidate did well in this category",
                },
                improvements: {
                    type: "string",
                    description:
                        "How the candidate could improve in this category",
                },
                explanation: {
                    type: "string",
                    description: "Explanation of the score",
                },
            },
            required: ["score", "strengths", "improvements", "explanation"],
        },
    },
    {
        name: "scoreDeliveryAuthenticity",
        description:
            "Score the delivery, authenticity and reflection (0-20 points)",
        parameters: {
            type: "object",
            properties: {
                score: {
                    type: "integer",
                    description: "Score from 0-20",
                    minimum: 0,
                    maximum: 20,
                },
                strengths: {
                    type: "string",
                    description: "What the candidate did well in this category",
                },
                improvements: {
                    type: "string",
                    description:
                        "How the candidate could improve in this category",
                },
                explanation: {
                    type: "string",
                    description: "Explanation of the score",
                },
            },
            required: ["score", "strengths", "improvements", "explanation"],
        },
    },
];

export async function POST(req: NextRequest) {
    try {
        const { transcript, topic } = await req.json();

        if (
            !transcript ||
            !Array.isArray(transcript) ||
            transcript.length === 0
        ) {
            return NextResponse.json(
                {
                    error: "Invalid transcript. Please provide a valid interview transcript array.",
                },
                { status: 400 }
            );
        }

        // Create prompt with scoring criteria
        const systemPrompt = `You are an expert interview coach evaluating a behavioral interview response.
    
    You will be analyzing the candidate's response to the question about: "${topic}".
    
    The scoring criteria (0-20 points each) are:
    
    1. Story Strength & Relevance (20 points)
    - Does the story showcase a meaningful challenge or resistance?
    - Was the candidate in a leading, proactive, or decision-making role?
    - Is the story unique, engaging, and memorable?
    
    Score guide:
    0–5: Vague, team-based, or unclear personal contribution
    6–10: Basic story with moderate relevance, limited ownership
    11–15: Strong context, but lacks complexity or stakes
    16–20: Clear challenge, ownership, strong outcome, and relevance
    
    2. Structure & Clarity (20 points)
    - Was the story well-organized using STAR?
    - Did it have a logical beginning, middle, and end?
    - Was it easy to follow?
    
    Score guide:
    0–5: Rambly, hard to follow, unstructured
    6–10: Structure attempted but imbalanced (e.g. too much context)
    11–15: Mostly structured, but slight flow issues
    16–20: Concise, balanced, highly structured and logical
    
    3. Personal Ownership & Action (20 points)
    - Does the candidate use "I" more than "we"?
    - Do they make their individual contribution obvious?
    - Is there evidence of leadership, problem-solving, and impact?
    
    Score guide:
    0–5: Generic "we" language, unclear ownership
    6–10: Role identified, but minimal leadership or action
    11–15: Strong personal action but lacks stakes or scale
    16–20: Clear leadership and ownership; decisions drove change
    
    4. Impact & Results (20 points)
    - Was there a measurable or observable result?
    - Did they quantify their impact?
    - Is the result tied to the action?
    
    Score guide:
    0–5: No outcome or vague improvement
    6–10: Outcome stated, but not specific or measurable
    11–15: Clear result, some quantification or stakeholder benefit
    16–20: Strong, quantified, impressive result tied to user's actions
    
    5. Delivery, Authenticity & Reflection (20 points)
    - Did they speak with natural tone and energy?
    - Did they include emotions, personal growth, or reflection?
    - Did they sound authentic vs. over-rehearsed?
    
    Score guide:
    0–5: Robotic, overly polished or flat
    6–10: Some reflection but feels formulaic
    11–15: Shows personality or growth, minor delivery issues
    16–20: Warm, confident, authentic delivery with a takeaway
    
    For each category, you'll assign a score from 0-20, identify specific strengths, and suggest targeted improvements.`;

        // Format the transcript for the API
        const formattedTranscript = transcript
            .map(
                (message: { from: string; text: string }) =>
                    `${
                        message.from === "user" ? "Candidate" : "Interviewer"
                    }: ${message.text}`
            )
            .join("\n\n");

        // Run 5 parallel API calls, one for each scoring function
        const scoringPromises = scoreFunctions.map(async (functionInfo) => {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o", // Using GPT-4o as specified
                    messages: [
                        { role: "system", content: systemPrompt },
                        {
                            role: "user",
                            content: `Here's the interview transcript:\n\n${formattedTranscript}\n\nPlease analyze this for the "${functionInfo.name.replace(
                                "score",
                                ""
                            )}" category.`,
                        },
                    ],
                    functions: [functionInfo],
                    function_call: { name: functionInfo.name },
                    temperature: 0.3, // Lower temperature for more consistent scoring
                });

                const functionCall =
                    response.choices[0]?.message?.function_call;
                if (functionCall && functionCall.name === functionInfo.name) {
                    try {
                        return {
                            ...JSON.parse(functionCall.arguments),
                            category: functionInfo.name.replace("score", ""),
                        };
                    } catch (e) {
                        console.error(
                            `Error parsing function arguments for ${functionInfo.name}:`,
                            e
                        );
                        throw e;
                    }
                } else {
                    throw new Error(
                        `Function call ${functionInfo.name} not returned properly`
                    );
                }
            } catch (error) {
                console.error(`Error in ${functionInfo.name}:`, error);
                throw error;
            }
        });

        // Wait for all scoring promises to resolve
        const results = await Promise.all(scoringPromises);

        // Calculate total score
        const totalScore = results.reduce(
            (sum, result) => sum + result.score,
            0
        );

        // Determine score band
        let scoreBand = "";
        if (totalScore <= 40) {
            scoreBand = "Needs major improvement";
        } else if (totalScore <= 60) {
            scoreBand = "Some strengths, but lacking in multiple areas";
        } else if (totalScore <= 80) {
            scoreBand = "Strong, but refine structure/impact/delivery";
        } else {
            scoreBand = "Excellent response, polished and ready";
        }

        // Generate overall summary using another API call
        const summaryResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert interview coach providing concise, actionable feedback.",
                },
                {
                    role: "user",
                    content: `Based on the following detailed category scores for an interview about "${topic}", provide a concise summary (2-3 paragraphs) highlighting the main strengths and 2-3 key areas for improvement. Be specific and actionable.\n\n${JSON.stringify(
                        results
                    )}\n\nTotal Score: ${totalScore}/100 (${scoreBand})`,
                },
            ],
            temperature: 0.4,
        });

        const summary =
            summaryResponse.choices[0]?.message?.content ||
            "Unable to generate summary.";

        // Return the complete feedback object
        return NextResponse.json({
            categoryScores: results,
            totalScore,
            scoreBand,
            summary,
        });
    } catch (error: Error | unknown) {
        console.error("Interview analysis error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to analyze interview" },
            { status: 500 }
        );
    }
}
