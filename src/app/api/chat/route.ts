import { auth } from '@clerk/nextjs';
import dotenv from 'dotenv';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';

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

export async function POST(req: Request) {
  try {
    // Verify that the user is authenticated
    const { userId } = auth();
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
    });

    // Extract the response text
    const responseText = response.choices[0].message.content?.trim() || "";

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

// Function to generate a system prompt based on user profile and topic
function generateSystemPrompt(profile: any, topic: string): string {
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
  
  return `
You are an expert behavioral interview coach helping a job candidate prepare for interviews. 
${topicGuidance}

${resume ? `CANDIDATE RESUME: ${resume}` : ''}

${jobDescription ? `TARGET JOB DESCRIPTION: ${jobDescription}` : ''}

${additionalNotes ? `ADDITIONAL NOTES: ${additionalNotes}` : ''}

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

Your goal is to help them craft better stories for their behavioral interviews that highlight their relevant skills and experiences.
  `;
} 