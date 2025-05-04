import { NextResponse } from "next/server";

export async function GET() {
    // Ensure the API key is available
    if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY environment variable is not set.");
        return NextResponse.json(
            { error: "Server configuration error: Missing OpenAI API key." },
            { status: 500 }
        );
    }

    try {
        const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                // Using gpt-4o as requested. Update if OpenAI specifies a different model.
                model: "gpt-4o-realtime-preview",
                voice: "ash", // Example voice, can be changed
            }),
        });

        if (!r.ok) {
            const errorData = await r.json().catch(() => ({})); // Attempt to parse error details
            console.error(
                `[GET /api/openai/token] OpenAI API error: ${r.status} ${r.statusText}`,
                errorData
            );
            return NextResponse.json(
                {
                    error: `Failed to create realtime session: ${
                        r.statusText
                    } - ${JSON.stringify(errorData)}`,
                },
                { status: r.status }
            );
        }

        const data = await r.json();

        // Check if the expected field exists
        if (!data.client_secret?.value) {
            console.error(
                "[GET /api/openai/token] Invalid response structure from OpenAI:",
                data
            );
            return NextResponse.json(
                { error: "Invalid response structure from OpenAI." },
                { status: 500 }
            );
        }

        // Return only the necessary part of the client_secret object
        return NextResponse.json({ token: data.client_secret.value });
    } catch (error: Error | unknown) {
        console.error("[GET /api/openai/token] error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
