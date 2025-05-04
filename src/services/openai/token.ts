export const getToken = async (): Promise<string> => {
    try {
        const response = await fetch("/api/openai/token");
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try to get error details
            console.error(
                `Error fetching token: ${response.status} ${response.statusText}`,
                errorData
            );
            throw new Error(
                `Failed to fetch token: ${
                    response.statusText
                } - ${JSON.stringify(errorData)}`
            );
        }
        const data = await response.json();

        // Validate the response structure
        if (!data.token) {
            console.error("Invalid token response structure:", data);
            throw new Error("Invalid token response structure from server.");
        }

        return data.token;
    } catch (error) {
        console.error("Error in getToken service:", error);
        // Re-throw the error to be handled by the caller
        throw error;
    }
};
