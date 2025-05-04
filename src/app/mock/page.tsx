"use client";

import { useState } from "react";
import VoiceAssistant from "./components/VoiceAssistant";

export default function MockInterviewPage() {
    const [cameraEnabled, setCameraEnabled] = useState(false);

    return (
        <div className="h-screen flex flex-col">
            {/* Interview Header with controls */}
            <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
                <h1 className="text-xl font-semibold">Mock Interview</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setCameraEnabled(!cameraEnabled)}
                        className={`px-3 py-1 rounded-md flex items-center gap-2 ${
                            cameraEnabled
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-gray-600 hover:bg-gray-700"
                        }`}
                        aria-label={
                            cameraEnabled ? "Turn camera off" : "Turn camera on"
                        }
                        title={
                            cameraEnabled ? "Turn camera off" : "Turn camera on"
                        }
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            <path d="M14 6a1 1 0 011 1v4a1 1 0 001 1h1a1 1 0 001-1V7a1 1 0 00-1-1h-1a1 1 0 00-1 1z" />
                        </svg>
                        {cameraEnabled ? "Camera On" : "Camera Off"}
                    </button>
                </div>
            </div>

            {/* Main interview area */}
            <div className="flex-1 flex">
                <div className="flex-1 bg-gray-100 p-6 flex flex-col">
                    {/* Interview content */}
                    <div className="flex-1 flex items-center justify-center">
                        <VoiceAssistant cameraEnabled={cameraEnabled} />
                    </div>
                </div>
            </div>
        </div>
    );
}
