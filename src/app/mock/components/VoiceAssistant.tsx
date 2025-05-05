"use client";
import { getToken } from "@/services/openai/token";
import { useSearchParams } from "next/navigation"; // To get the topic
import { useEffect, useRef, useState } from "react";
import Image from "next/image"; // Import Next Image

// Define message type
interface Message {
    from: "user" | "assistant";
    text: string;
}

interface VoiceAssistantProps {
    cameraEnabled: boolean;
}

export default function VoiceAssistant({ cameraEnabled }: VoiceAssistantProps) {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
    const [userStream, setUserStream] = useState<MediaStream | null>(null);

    const peerRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const searchParams = useSearchParams();
    const topic = searchParams.get("topic") || "a challenging situation"; // Default topic

    // Set up user's camera if enabled
    useEffect(() => {
        let mounted = true;
        let stream: MediaStream | null = null;

        const setupCamera = async () => {
            if (cameraEnabled && connected) {
                try {
                    // Only request camera if we don't already have a stream
                    if (!userStream) {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: true,
                        });

                        // Only set the state if component is still mounted
                        if (mounted) {
                            setUserStream(stream);
                            if (videoRef.current) {
                                videoRef.current.srcObject = stream;
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error accessing camera:", err);
                }
            }
        };

        setupCamera();

        // Cleanup function
        return () => {
            mounted = false;
            // Don't stop the stream here, we'll handle that in the cameraEnabled effect
        };
    }, [connected, cameraEnabled, userStream]);

    // Handle camera toggle separately
    useEffect(() => {
        if (!cameraEnabled && userStream) {
            // Stop all video tracks when camera is disabled
            userStream.getTracks().forEach((track) => {
                if (track.kind === "video") {
                    track.stop();
                }
            });
            setUserStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }

        return () => {
            // Cleanup on unmount
            if (userStream) {
                userStream.getTracks().forEach((track) => {
                    if (track.kind === "video") {
                        track.stop();
                    }
                });
            }
        };
    }, [cameraEnabled, userStream]);

    // Function to initialize WebRTC connection
    async function init() {
        setLoading(true);
        setError(null);
        setMessages([]); // Clear previous messages

        try {
            console.log("Fetching ephemeral token...");
            const ephemeralToken = await getToken();
            console.log("Token fetched successfully.");

            console.log("Creating RTCPeerConnection...");
            const peer = new RTCPeerConnection();
            peerRef.current = peer;

            // Create and setup audio element for AI response
            if (!audioPlayerRef.current) {
                const audioIa = document.createElement("audio");
                audioIa.autoplay = true;
                document.body.appendChild(audioIa); // Append to body to ensure it's part of DOM
                audioPlayerRef.current = audioIa;
            }

            peer.ontrack = (e) => {
                console.log("Received remote audio track:", e.track);
                if (audioPlayerRef.current && e.streams[0]) {
                    audioPlayerRef.current.srcObject = e.streams[0];
                    audioPlayerRef.current
                        .play()
                        .catch((e) => console.error("Audio play failed:", e));
                }
            };

            // Handle ICE candidates for NAT traversal
            peer.onicecandidate = async (event) => {
                if (event.candidate) {
                    // In a real application, this candidate would be sent to the remote peer via a signaling server.
                    // For OpenAI's Realtime API, this signaling is handled implicitly after exchanging SDP.
                    console.log("Generated ICE candidate:", event.candidate);
                } else {
                    console.log("All ICE candidates have been generated.");
                }
            };

            peer.oniceconnectionstatechange = () => {
                console.log(`ICE Connection State: ${peer.iceConnectionState}`);
                if (
                    ["failed", "disconnected", "closed"].includes(
                        peer.iceConnectionState
                    )
                ) {
                    setError("Connection lost. Please try reconnecting.");
                    setConnected(false);
                    cleanupConnection();
                }
            };

            console.log("Requesting microphone access...");
            const localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            localStream.getTracks().forEach((track) => {
                console.log("Adding local audio track:", track);
                peer.addTrack(track, localStream);
            });

            console.log("Creating data channel...");
            const dataChannel = peer.createDataChannel("oai-events");
            dataChannelRef.current = dataChannel;
            dataChannel.onmessage = handleServerEvent;
            dataChannel.onerror = (e) => console.error("DataChannel error:", e);
            dataChannel.onclose = () => {
                console.log("DataChannel closed.");
                setConnected(false);
                cleanupConnection();
            };

            console.log("Creating SDP offer...");
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            console.log("Local description set.");

            console.log("Sending offer to OpenAI...");
            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = "gpt-4o-realtime-preview"; // Match the model in the token endpoint
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${ephemeralToken}`,
                    "Content-Type": "application/sdp",
                },
            });

            if (!sdpResponse.ok) {
                const errorText = await sdpResponse.text();
                throw new Error(
                    `Failed to get SDP answer: ${sdpResponse.status} ${sdpResponse.statusText} - ${errorText}`
                );
            }

            const answerSdp = await sdpResponse.text();
            console.log("Received SDP answer from OpenAI.");

            const answer = {
                type: "answer" as RTCSdpType, // Explicitly cast the type
                sdp: answerSdp,
            };

            console.log("Setting remote description...");
            await peer.setRemoteDescription(new RTCSessionDescription(answer)); // Use constructor
            console.log("Remote description set.");

            dataChannel.addEventListener("open", () => {
                console.log("🔔 DataChannel is open!");
                setConnected(true);
                setLoading(false);

                // Send session update to explicitly enable transcription
                const updatePayload = {
                    type: "session.update",
                    session: {
                        modalities: ["text", "audio"], // Ensure both are specified
                        input_audio_format: "pcm16",
                        output_audio_format: "pcm16",
                        input_audio_transcription: {
                            model: "whisper-1", // Explicitly set whisper
                        },
                        // Include desired turn detection settings
                        turn_detection: {
                            type: "server_vad", // Using server VAD
                            threshold: 0.5,
                            prefix_padding_ms: 300,
                            silence_duration_ms: 1000, // Increased silence duration
                            create_response: true,
                        },
                    },
                };
                console.log(
                    "Sending session.update to enable transcription:",
                    JSON.stringify(updatePayload)
                );
                dataChannel.send(JSON.stringify(updatePayload));

                // Send initial instruction with the selected topic (with a small delay)
                setTimeout(() => {
                    const initialInstruction = `You are a mock interviewer. Start by asking me the question: 'Tell me about a time you handled ${topic}.' Then, ask relevant follow-up questions based on my response using the STAR method context if applicable. Keep your responses concise and conversational.`;
                    const instructionPayload = {
                        type: "session.update",
                        session: {
                            instructions: initialInstruction,
                        },
                    };
                    console.log(
                        "Sending session.update for instructions:",
                        JSON.stringify(instructionPayload)
                    );
                    dataChannel.send(JSON.stringify(instructionPayload));

                    // Add initial message to local state (this doesn't affect server)
                    setMessages([
                        {
                            from: "assistant",
                            text: `Tell me about a time you handled ${topic}.`,
                        },
                    ]);
                    // Set interviewer to speaking initially
                    setIsInterviewerSpeaking(true);
                    // Assume initial prompt takes some time to be spoken
                    setTimeout(() => setIsInterviewerSpeaking(false), 5000);
                }, 100); // 100ms delay
            });

            console.log(
                "🔔 WebRTC connection setup initiated. Waiting for DataChannel to open..."
            );
        } catch (err: Error | unknown) {
            console.error("Initialization failed:", err);
            setError(
                `Connection failed: ${
                    err instanceof Error ? err.message : "Connection error"
                }`
            );
            setLoading(false);
            cleanupConnection();
        }
    }

    // Function to handle messages from the server via DataChannel
    function handleServerEvent(e: MessageEvent) {
        try {
            console.log("[DEBUG] Raw server event:", e.data);
            const event = JSON.parse(e.data);
            console.log("[DEBUG] Parsed server event:", event);

            switch (event.type) {
                case "conversation.item.input_audio_transcription.delta":
                    console.log(
                        "[DEBUG] User Transcription Delta Received:",
                        event.delta
                    );
                    setMessages((prev: Message[]) => {
                        console.log(
                            "[DEBUG] User Transcription Delta - Prev State:",
                            JSON.parse(JSON.stringify(prev))
                        );
                        const lastMsg = prev[prev.length - 1];
                        let newState: Message[];
                        if (lastMsg?.from === "user") {
                            const updatedText = lastMsg.text + event.delta;
                            newState = [
                                ...prev.slice(0, -1),
                                { from: "user", text: updatedText },
                            ];
                        } else {
                            newState = [
                                ...prev,
                                { from: "user", text: event.delta },
                            ];
                        }
                        return newState;
                    });
                    // User is speaking, interviewer is not
                    setIsInterviewerSpeaking(false);
                    break;

                case "conversation.item.input_audio_transcription.completed":
                    console.log(
                        "[DEBUG] User Transcription Completed Event:",
                        event
                    );
                    const userFinalTranscript = event.transcript;
                    if (userFinalTranscript) {
                        console.log(
                            "[DEBUG] User Transcription Completed - Final Transcript Found:",
                            userFinalTranscript
                        );
                        setMessages((prev: Message[]) => {
                            console.log(
                                "[DEBUG] User Transcription Completed - Prev State:",
                                JSON.parse(JSON.stringify(prev))
                            );
                            const lastMsg = prev[prev.length - 1];
                            let newState: Message[];
                            if (lastMsg?.from === "user") {
                                // Update the last user message with the final complete transcript
                                newState = [
                                    ...prev.slice(0, -1),
                                    { from: "user", text: userFinalTranscript },
                                ];
                            } else {
                                // If no user delta was received before, add the full transcript
                                newState = [
                                    ...prev,
                                    { from: "user", text: userFinalTranscript },
                                ];
                            }
                            return newState;
                        });
                    }
                    break;

                case "response.audio.delta": // Assistant's audio speech delta (binary)
                    setIsInterviewerSpeaking(true);
                    break;

                case "response.text.delta.assistant": // Assistant's text response delta
                    console.log(
                        "[DEBUG] Assistant Delta Received:",
                        event.delta
                    );
                    setMessages((prev: Message[]) => {
                        console.log(
                            "[DEBUG] Assistant Delta - Prev State:",
                            JSON.parse(JSON.stringify(prev))
                        );
                        const lastMsg = prev[prev.length - 1];
                        let newState: Message[];
                        if (lastMsg?.from === "assistant") {
                            const updatedText = lastMsg.text + event.delta;
                            newState = [
                                ...prev.slice(0, -1),
                                { from: "assistant", text: updatedText },
                            ];
                        } else {
                            newState = event.delta.trim()
                                ? [
                                      ...prev,
                                      { from: "assistant", text: event.delta },
                                  ]
                                : prev;
                        }
                        return newState;
                    });
                    setIsInterviewerSpeaking(true);
                    break;

                case "response.done": // Assistant's full response complete
                    console.log("[DEBUG] Assistant Done Event:", event);
                    const fullTranscript =
                        event.response?.output?.[0]?.content?.[0]?.transcript;
                    if (fullTranscript) {
                        console.log(
                            "[DEBUG] Assistant Done - Full Transcript Found:",
                            fullTranscript
                        );
                        setMessages((prev: Message[]) => {
                            console.log(
                                "[DEBUG] Assistant Done - Prev State:",
                                JSON.parse(JSON.stringify(prev))
                            );
                            const lastMsg = prev[prev.length - 1];
                            let newState: Message[];
                            if (lastMsg?.from === "assistant") {
                                newState = [
                                    ...prev.slice(0, -1),
                                    { from: "assistant", text: fullTranscript },
                                ];
                            } else if (
                                fullTranscript.trim() &&
                                (!lastMsg || lastMsg.text !== fullTranscript)
                            ) {
                                newState = [
                                    ...prev,
                                    { from: "assistant", text: fullTranscript },
                                ];
                            } else {
                                newState = prev; // No change needed if already handled by deltas
                            }
                            return newState;
                        });
                    }
                    setIsInterviewerSpeaking(false);
                    console.log("Assistant response done.");
                    break;

                case "session.error":
                    console.error("Session error from server:", event.error);
                    setError(
                        `Session error: ${
                            event.error?.message || "Unknown error"
                        }`
                    );
                    cleanupConnection();
                    break;

                default:
                    console.log(
                        `[DEBUG] Unhandled server event type: ${event.type}`,
                        event
                    );
                    break;
            }
        } catch (err) {
            console.error(
                "JSON parsing error or event handling error:",
                err,
                "Raw data:",
                e.data
            );
        }
    }

    // Cleanup function
    function cleanupConnection() {
        console.log("Cleaning up connection...");

        // Save transcript to localStorage if there are messages
        if (messages.length > 0) {
            // Log the final messages state before saving
            console.log(
                "[DEBUG] Final messages state before saving:",
                JSON.parse(JSON.stringify(messages))
            );
            const conversationData = {
                topic: topic,
                transcript: messages,
                timestamp: new Date().toISOString(),
            };
            localStorage.setItem(
                "interviewTranscript",
                JSON.stringify(conversationData)
            );

            // Optionally redirect to the feedback page
            window.location.href = "/feedback";
        }

        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }

        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }

        // Stop local media tracks
        if (peerRef.current) {
            try {
                // Get all tracks from all senders and stop them
                const senders = (
                    peerRef.current as RTCPeerConnection
                ).getSenders();
                senders.forEach((sender) => {
                    if (sender.track) {
                        sender.track.stop();
                    }
                });
            } catch (error) {
                console.error("Error stopping tracks:", error);
            }
        }

        // Stop user video stream if active
        if (userStream) {
            userStream.getTracks().forEach((track) => track.stop());
            setUserStream(null);
        }

        // Remove audio player if dynamically added
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.srcObject = null;
            // Optionally remove from DOM if you added it dynamically
            // audioPlayerRef.current.remove();
            // audioPlayerRef.current = null;
        }

        setConnected(false);
        setLoading(false);
    }

    // Effect for cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupConnection();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only on mount and unmount

    return (
        <div className="w-full h-full flex flex-col relative">
            {error && (
                <div className="absolute top-4 left-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center shadow-lg">
                    <svg
                        className="w-6 h-6 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Main Video Area (User Camera or Placeholder) */}
            <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
                {cameraEnabled && connected ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                    ></video>
                ) : (
                    <div className="text-center text-gray-400">
                        {connected ? (
                            cameraEnabled ? (
                                <p>Camera loading...</p>
                            ) : (
                                <p>Camera is off</p>
                            )
                        ) : (
                            <p>Start the interview to enable your camera</p>
                        )}
                    </div>
                )}

                {/* User label */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white py-1 px-3 rounded-full text-sm z-20">
                    You
                </div>

                {/* Interviewer Picture-in-Picture */}
                <div className="absolute bottom-6 right-6 z-20 w-32 h-40 md:w-40 md:h-52 lg:w-48 lg:h-60 border-4 border-gray-700 rounded-lg overflow-hidden shadow-lg">
                    <div
                        className={`w-full h-full relative bg-gray-100 ${
                            isInterviewerSpeaking ? "animate-pulse" : ""
                        }`}
                    >
                        {/* Glow effect when speaking */}
                        {isInterviewerSpeaking && (
                            <div className="absolute -inset-1 bg-blue-500 rounded-lg opacity-50 blur-md"></div>
                        )}
                        {/* Interviewer avatar */}
                        <div
                            className={`w-full h-full ${
                                isInterviewerSpeaking
                                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-700"
                                    : ""
                            } relative z-10`}
                        >
                            <Image
                                src="/interviewer.jpg"
                                alt="Interviewer Avatar"
                                fill
                                style={{ objectFit: "cover" }}
                                priority
                                className="rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="bg-gray-800 p-4 flex justify-center items-center gap-4">
                {!connected ? (
                    <button
                        className={`px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium flex items-center gap-2`}
                        onClick={init}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Connecting...
                            </>
                        ) : cameraEnabled ? (
                            "Start Interview with Camera"
                        ) : (
                            "Start Interview"
                        )}
                    </button>
                ) : (
                    <button
                        className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-lg font-medium flex items-center gap-2"
                        onClick={cleanupConnection}
                        disabled={loading}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        End Interview
                    </button>
                )}
            </div>
        </div>
    );
}
