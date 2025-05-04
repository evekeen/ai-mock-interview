"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // To get the topic
import { getToken } from "@/services/openai/token";

// Define message type
interface Message {
    from: "user" | "assistant";
    text: string;
}

export default function VoiceAssistant() {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const searchParams = useSearchParams();
    const topic = searchParams.get("topic") || "a challenging situation"; // Default topic

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
                // Send initial instruction with the selected topic
                const initialInstruction = `You are a mock interviewer. Start by asking me the question: 'Tell me about a time you handled ${topic}.' Then, ask relevant follow-up questions based on my response using the STAR method context if applicable. Keep your responses concise and conversational.`;
                dataChannel.send(
                    JSON.stringify({
                        type: "session.update",
                        session: {
                            instructions: initialInstruction,
                        },
                    })
                );
                // Add initial message to display the question
                setMessages([
                    {
                        from: "assistant",
                        text: `Tell me about a time you handled ${topic}.`,
                    },
                ]);
            });

            console.log(
                "🔔 WebRTC connection setup initiated. Waiting for DataChannel to open..."
            );
        } catch (err: any) {
            console.error("Initialization failed:", err);
            setError(`Connection failed: ${err.message}`);
            setLoading(false);
            cleanupConnection();
        }
    }

    // Function to handle messages from the server via DataChannel
    function handleServerEvent(e: MessageEvent) {
        try {
            // console.log('Raw server event:', e.data);
            const event = JSON.parse(e.data);
            // console.log('Parsed server event:', event);

            switch (event.type) {
                case "response.text.delta": // User's transcribed speech delta
                    setMessages((prev) => {
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg?.from === "user") {
                            const updatedText = lastMsg.text + event.delta;
                            return [
                                ...prev.slice(0, -1),
                                { from: "user", text: updatedText },
                            ];
                        } else {
                            return [
                                ...prev,
                                { from: "user", text: event.delta },
                            ];
                        }
                    });
                    break;

                case "response.text.done": // User's speech transcription complete
                    // Often the delta covers the full text, but we can finalize here if needed
                    // The API might not always send a separate 'done' with full text matching the deltas exactly
                    // console.log("User speech finalized (event data might be minimal):", event);
                    break;

                case "response.audio.delta": // Assistant's audio speech delta (binary)
                    // This indicates audio is being generated/streamed, handled by ontrack
                    // console.log('Assistant audio delta received (binary data not shown)');
                    break;

                case "response.text.delta.assistant": // Assistant's text response delta
                    setMessages((prev) => {
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg?.from === "assistant") {
                            const updatedText = lastMsg.text + event.delta;
                            return [
                                ...prev.slice(0, -1),
                                { from: "assistant", text: updatedText },
                            ];
                        } else {
                            // Start a new assistant message only if the delta is not empty
                            return event.delta.trim()
                                ? [
                                      ...prev,
                                      { from: "assistant", text: event.delta },
                                  ]
                                : prev;
                        }
                    });
                    break;

                case "response.done": // Assistant's full response complete
                    // Finalize the last assistant message if needed, using transcript if available
                    const fullTranscript =
                        event.response?.output?.[0]?.content?.[0]?.transcript;
                    if (fullTranscript) {
                        setMessages((prev) => {
                            const lastMsg = prev[prev.length - 1];
                            if (lastMsg?.from === "assistant") {
                                return [
                                    ...prev.slice(0, -1),
                                    { from: "assistant", text: fullTranscript },
                                ];
                            }
                            // Only add if it wasn't already added via deltas and is not empty
                            else if (
                                fullTranscript.trim() &&
                                (!lastMsg || lastMsg.text !== fullTranscript)
                            ) {
                                return [
                                    ...prev,
                                    { from: "assistant", text: fullTranscript },
                                ];
                            }
                            return prev; // No change needed
                        });
                    }
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
                    console.log("Unhandled server event type:", event.type);
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
            // Note: Using window.location instead of router to ensure full page reload
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
        <div className="p-4 border border-gray-300 rounded-md w-full max-w-2xl">
            {error && <p className="text-red-500 mb-4">Error: {error}</p>}

            {!connected ? (
                <button
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={init}
                    disabled={loading}
                >
                    {loading ? "Connecting..." : "Start Interview"}
                </button>
            ) : (
                <div>
                    <p className="text-green-600 font-bold flex items-center mb-4">
                        ✔ Connection established. Speak into your mic…
                    </p>
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                        onClick={cleanupConnection} // Add a button to disconnect manually
                        disabled={loading}
                    >
                        End Interview
                    </button>
                </div>
            )}

            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 h-96 overflow-y-auto">
                <h2 className="font-bold mb-2 text-lg">Conversation:</h2>
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`mb-2 p-2 rounded-md ${
                            m.from === "user"
                                ? "bg-blue-100 text-right"
                                : "bg-gray-100 text-left"
                        }`}
                    >
                        <strong className="font-semibold">
                            {m.from === "user" ? "You" : "Interviewer"}:{" "}
                        </strong>
                        <span>{m.text}</span>
                    </div>
                ))}
                {loading && <p className="text-gray-500">Loading...</p>}
            </div>
        </div>
    );
}
