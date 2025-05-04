import { auth } from "@clerk/nextjs/server";
import dotenv from 'dotenv';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import path from 'path';
import { z } from 'zod';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Initialize OpenAI client
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY environment variable is not set");
}

const openaiClient = new OpenAI({
  apiKey
});

const brainstormFormat = zodResponseFormat(z.object({
  updatedStory: z.string(),
  feedback: z.string()
}), 'json_object');

export async function POST(req: Request) {
  try {
    // Verify that the user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    const { messages, profile, topic } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Generate context for the AI based on user profile and topic
    const systemPrompt = generateSystemPrompt(profile, topic);

    // Format messages for OpenAI API
    const formattedMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages
    ];

    // Call OpenAI API
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini", // You can change this to your preferred model
      messages: formattedMessages,
      max_tokens: 800,
      temperature: 0.7,
      response_format: brainstormFormat
    });

    // Extract the response text
    const responseContent = response.choices[0].message.content?.trim() || "";
    
    // If evaluating STAR and response is JSON, parse it and return structured data
    try {
      const parsedResponse = JSON.parse(responseContent);
      return NextResponse.json({
        response: parsedResponse.feedback,
        updatedStory: parsedResponse.updatedStory
      });
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      // Fallback to returning the raw response
      return NextResponse.json({ response: responseContent });
    }
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

// Function to generate a system prompt based on user profile and topic
function generateSystemPrompt(profile: Record<string, unknown>, topic: string): string {
  const { resume, jobDescription, additionalNotes } = profile || {};
  
  const topicPrompts: Record<string, string> = {
    conflict: "You are evaluating the user's conflict resolution skills.",
    leadership: "You are evaluating the user's leadership abilities.",
    challenge: "You are evaluating how the user handles challenges and obstacles.",
    failure: "You are evaluating how the user handles failure and learns from mistakes.",
    teamwork: "You are evaluating the user's teamwork and collaboration skills.",
    success: "You are evaluating how the user achieves success and their accomplishments.",
    pressure: "You are evaluating how the user handles pressure and tight deadlines.",
    adaptability: "You are evaluating the user's adaptability and flexibility.",
    problem: "You are evaluating the user's problem-solving approach."
  };

  const topicGuidance = topicPrompts[topic] || "You are evaluating the user's interview response.";
  
  const starEvaluationInstructions = `
  You must return your response in JSON format with the following structure:
{
  "updatedStory": string
  "feedback": string
}

Where:
- updatedStory is the updated final version of the user's story, based on the entire conversation history and all previous improvements. 
  Each time the user sends a message, you should generate an improved version of their story that incorporates all feedback and changes so far. 
  Only use the user input to get the update story. Do not use your messages. 
  Do not add anything to the story besides what user input.

- feedback is your detailed evaluation and suggestions for improvement

In your feedback text, clearly indicate which parts of the STAR framework are present or missing, and provide specific suggestions for improvement.
`;
  
  return `
You are an expert behavioral interview coach helping a job candidate prepare for interviews. 
${topicGuidance}

${resume ? `CANDIDATE RESUME: ${resume}` : ''}

${jobDescription ? `TARGET JOB DESCRIPTION: ${jobDescription}` : ''}

${additionalNotes ? `ADDITIONAL NOTES: ${additionalNotes}` : ''}

${starEvaluationInstructions}

INSTRUCTIONS:
1. First, listen to the candidate's response to the behavioral question.
2. Evaluate their response based on the STAR method (Situation, Task, Action, Result).
3. Provide constructive feedback on:
   - Structure and completeness of their response
   - Relevance to the question asked
   - Clarity and conciseness
   - Quantifiable results or impact where applicable
   - Professional language and delivery
4. Ask follow-up questions to help them improve areas that are weak or missing.
5. Be encouraging but honest - point out strengths while suggesting improvements.
6. Keep your responses concise and focused on helping them improve.
7. Always maintain continuity by considering the entire conversation history when generating the updated story.
8. Each time the user sends a message, generate an improved version of their story that incorporates all previous feedback and changes.

Your goal is to help them craft better stories for their behavioral interviews that highlight their relevant skills and experiences.
  `;
} 