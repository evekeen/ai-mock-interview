import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("fileType") as string | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    if (!fileType || !["resume", "jd"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }
    
    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get file extension
    const filename = file.name;
    const extension = filename.split(".").pop()?.toLowerCase();
    
    // In a real app:
    // 1. Upload the file to Supabase Storage
    // 2. Parse the file based on its type (PDF, DOCX, TXT)
    // 3. Extract structured data using LLM
    // 4. Store parsed data in database
    
    // For now, simulate processing delay and return a success response
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      success: true,
      message: `${fileType === "resume" ? "Resume" : "Job Description"} uploaded and processed successfully`,
      fileInfo: {
        name: filename,
        type: file.type,
        size: file.size,
      },
      // In production, you would return the parsed data here
      parsedData: {
        sections: fileType === "resume" 
          ? ["experience", "education", "skills"] 
          : ["requirements", "responsibilities", "qualifications"],
        // Add more structured data here
      }
    });
    
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
} 