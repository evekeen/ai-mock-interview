import { auth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { __metadata_id__: string } }
) {
  try {
    // Verify that the user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward the request to the main chat route
    const baseUrl = new URL(req.url);
    const mainChatUrl = new URL(`${baseUrl.origin}/api/chat`);
    
    const response = await fetch(mainChatUrl, {
      method: 'POST',
      headers: req.headers,
      body: req.body
    });
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in chat API route (dynamic):', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 