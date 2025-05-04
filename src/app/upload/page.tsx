import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import UploadForm from "./UploadForm";

export default async function UploadPage({ 
  searchParams 
}: { 
  searchParams: { type?: string } 
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const isJobDescription = searchParams.type === 'jd';
  const title = isJobDescription ? 'Job Description' : 'Resume';
  
  return (
    <div className="container mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold mb-8">Upload {title}</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="mb-6">
          {isJobDescription
            ? "Upload the job description to help tailor your interview preparation."
            : "Upload your resume to extract your experience and skills."}
        </p>
        
        <UploadForm fileType={isJobDescription ? 'jd' : 'resume'} />
      </div>
    </div>
  );
} 