import VoiceAssistant from "./components/VoiceAssistant";

export default function MockInterviewPage() {
    return (
        <div className="p-6 flex flex-col gap-4 items-center">
            <h1 className="text-2xl font-bold">Mock Interview</h1>
            <p>Practice your response to the selected question.</p>
            {/* Placeholder for Interviewer Image */}
            <div className="w-32 h-32 bg-gray-300 rounded-full mb-4 flex items-center justify-center text-gray-500">
                Interviewer
            </div>
            <VoiceAssistant />
        </div>
    );
}
