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

const feedbackFormat = zodResponseFormat(z.object({
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

    // Filter user messages only for story creation
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    // First call: Get the story from user messages only
    const storySystemPrompt = `
Take the content from all user messages and compile them into a single coherent story.
DO NOT add any new information, embellishments, or changes to the facts presented.
Only use what was explicitly stated by the user.
Format the story following a logical flow.
Use the same exact wording as the user used.
`;

    const storyResponse = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: 'system',
          content: storySystemPrompt
        },
        ...userMessages
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const updatedStory = storyResponse.choices[0].message.content?.trim() || "";

    // Generate context for the feedback AI based on user profile and topic
    const feedbackSystemPrompt = generateSystemPrompt(profile, topic);

    // Second call: Get feedback on the story
    const feedbackResponse = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: 'system',
          content: feedbackSystemPrompt
        },
        ...messages,
        {
          role: 'system',
          content: `Here is the compiled story based solely on the user's input:\n\n${updatedStory}\n\nProvide feedback on this story.`
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
      response_format: feedbackFormat
    });

    // Extract feedback
    const feedbackContent = feedbackResponse.choices[0].message.content?.trim() || "";
    
    try {
      const parsedFeedback = JSON.parse(feedbackContent);
      return NextResponse.json({
        response: parsedFeedback.feedback,
        updatedStory: updatedStory
      });
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return NextResponse.json({ 
        response: 'Failed to parse feedback',
        updatedStory: updatedStory 
      });
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
  "feedback": string
}

Where feedback is your detailed evaluation and suggestions for improvement.

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
1. Evaluate the candidate's response based on the STAR method (Situation, Task, Action, Result).
2. Provide constructive feedback on:
   - Structure and completeness of their response
   - Relevance to the question asked
   - Clarity and conciseness
   - Quantifiable results or impact where applicable
   - Professional language and delivery
3. Be encouraging but honest - point out strengths while suggesting improvements.
4. Keep your responses concise and focused on helping them improve.

Your goal is to help them craft better stories for their behavioral interviews that highlight their relevant skills and experiences.
  `;
} 