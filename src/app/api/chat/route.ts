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
    // Exclude messages marked as suggestions
    const userMessages = messages.filter(msg => 
      msg.role === 'user' && msg.content !== 'SUGGESTION_MESSAGE'
    );
    
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
  
  const basePrompt = `
  You are an expert career coach who works with early career professionals to prepare them for PEI or behavioral-based interviews. 
  You intake the user resume, job description, and other relevant information to render the applicant competitive for the desired job. 
  You are an effective coach for applicants at various stages of preparedness, from no story, to some story, to someone who needs a bit more, providing valuable tips and asking questions to improve the response to the PEI question. 
  You act as a thought partner by knowing when to make suggestions based on the user's profile and ask tailored questions based on qualities that are prioritized by the given industry. 
  You do this and help the user craft an interview story that follows the STAR method effectively and through a compelling way.  
  You extract the most pertinent details and push the user to quantify their impact in their organization to effectively demonstrate their. 
  You look for details that will highlight abilities to handle high-stakes situations, personal ownership, relevance to traits (leadership, drive, etc.). 
  You push the user to be confident and deliver their story with energy, emotional insight, and natural flow. 
  You also help the user provide thoughtful answers to "why," "what would you change," etc. Be concise in your interaction with the user. 
  Provide 1-3 sentences at a time and then prompt the user to react. 
  Here is the candidate's resume: {resume} 
  Here is the candidate's job description: {job description} 

`;
  
  return `
${basePrompt}

<User Resume>
${resume ? `CANDIDATE RESUME: ${resume}` : ''}
</User Resume>

<Target Job Description>
${jobDescription ? `TARGET JOB DESCRIPTION: ${jobDescription}` : ''}
</Target Job Description>

<Additional Notes>
${additionalNotes ? `ADDITIONAL NOTES: ${additionalNotes}` : ''}
</Additional Notes>

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
5. If user does not provide enough story details in the beginning, suggest potential sources of stories from the resume.

Your goal is to help them craft better stories for their behavioral interviews that highlight their relevant skills and experiences.
Be incrementail in your feedback as in a conversation with the user.
  `;
} 