import VoiceAssistant from "./components/VoiceAssistant";

export default function MockInterviewPage() {
    return (
        <div className="p-6 flex flex-col gap-4 items-center">
            <h1 className="text-2xl font-bold">Mock Interview</h1>
            <p>Practice your response to the selected question.</p>
            {/* Professional interviewer image */}
            <div className="w-36 h-36 mb-4 rounded-full overflow-hidden border-4 border-gray-300 flex items-center justify-center bg-gray-100">
                <svg
                    className="h-24 w-24 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 14.75c3.17 0 5.75-2.58 5.75-5.75S15.17 3.25 12 3.25 6.25 5.83 6.25 9s2.58 5.75 5.75 5.75zM12 5.25c2.07 0 3.75 1.68 3.75 3.75 0 2.07-1.68 3.75-3.75 3.75S8.25 11.07 8.25 9c0-2.07 1.68-3.75 3.75-3.75zM15.5 16.5h-7c-3.03 0-5.5 2.47-5.5 5.5v.25h2v-.25c0-1.93 1.57-3.5 3.5-3.5h7c1.93 0 3.5 1.57 3.5 3.5v.25h2v-.25c0-3.03-2.47-5.5-5.5-5.5z" />
                </svg>
            </div>
            <VoiceAssistant />
        </div>
    );
}
