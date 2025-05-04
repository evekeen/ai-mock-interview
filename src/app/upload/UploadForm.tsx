"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

type UploadFormProps = {
  fileType: 'resume' | 'jd';
};

export default function UploadForm({ fileType }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;
    
    // Check file type
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedTypes.includes(`.${fileExtension}`)) {
      setError("Please upload a PDF, DOCX, or TXT file");
      return;
    }
    
    // Check file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setError("File size exceeds 10MB limit");
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      
      // Simulated progress since fetch doesn't have built-in progress tracking
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 15);
          if (progress > 90) {
            clearInterval(interval);
            progress = 90;
          }
          setUploadProgress(progress);
        }, 500);
        
        return interval;
      };
      
      const progressInterval = simulateProgress();
      
      // Actual API call
      const response = await fetch('/api/parse-upload', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      setUploadProgress(100);
      setSuccess(true);
      
      const data = await response.json();
      console.log('Upload response:', data);
      
      // Redirect after successful upload (after 2 seconds)
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during upload";
      setError(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check file type
      const allowedTypes = ['.pdf', '.docx', '.txt'];
      const fileExtension = droppedFile.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedTypes.includes(`.${fileExtension}`)) {
        setError("Please upload a PDF, DOCX, or TXT file");
        return;
      }
      
      // Check file size (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (droppedFile.size > maxSize) {
        setError("File size exceeds 10MB limit");
        return;
      }
      
      setFile(droppedFile);
      setError(null);
      setSuccess(false);
    }
  };
  
  return (
    <form onSubmit={handleUpload}>
      <div 
        className={`border-2 border-dashed ${file ? 'border-blue-300 bg-blue-50' : 'border-gray-300'} 
                   rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition`}
        onClick={handleBrowseClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          {file ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        
        {file ? (
          <div>
            <p className="text-sm font-medium text-blue-600">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Drag and drop your {fileType} file here, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-2">PDF, DOCX, or TXT up to 10MB</p>
          </>
        )}
        
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept=".pdf,.docx,.txt" 
          onChange={handleFileChange}
        />
        
        {!file && (
          <button 
            type="button" 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            onClick={handleBrowseClick}
          >
            Select File
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
          File uploaded and processed successfully! Redirecting to dashboard...
        </div>
      )}
      
      {isUploading && (
        <div className="mt-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
        </div>
      )}
      
      <div className="mt-6">
        <button 
          type="submit" 
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!file || isUploading}
        >
          {isUploading ? 'Processing...' : 'Upload and Process'}
        </button>
      </div>
    </form>
  );
} 