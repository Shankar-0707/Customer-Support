import { env } from "../config/env.js";

/**
 * Service to interact with the LLM provider (Groq) using Fetch API.
 * Calls Groq's Chat Completions endpoint.
 */
export async function generateAgentResponse(
  chatHistory: { role: "user" | "agent"; content: string }[],
  customerMemories?: string,
  sharedResolutions?: string
): Promise<string> {
  const apiKey = env.GROQ_API_KEY;

  // Detect missing or placeholder API key
  if (!apiKey || apiKey === "your_groq_api_key_here" || apiKey.trim() === "") {
    return getSimulatedResponse(chatHistory);
  }

  try {
    // Format messages for the API (convert 'agent' role to 'assistant')
    const apiMessages = chatHistory.map((msg) => ({
      role: msg.role === "agent" ? "assistant" : "user",
      content: msg.content,
    }));

    let systemInstruction = 
      "You are an AI Customer Support Agent for a cloud software platform. You are helpful, professional, and concise. Always answer questions based on product knowledge. Do not make up answers.";

    if (customerMemories && customerMemories.trim() !== "" && customerMemories !== "FACTS: []") {
      systemInstruction += `\n\n[CUSTOMER PERSISTENT MEMORY (Current Customer Only)]:
Use the following recalled past tickets, interactions, environment info, and preferences for this specific customer. You can refer to this as their own past history (e.g., 'I recall you mentioned...' or 'in your previous ticket...'):\n${customerMemories}`;
    }

    if (sharedResolutions && sharedResolutions.trim() !== "" && sharedResolutions !== "FACTS: []") {
      systemInstruction += `\n\n[GLOBAL RESOLUTION MEMORY (Other Customers)]:
Use the following similar resolved cases from other customers to guide your technical troubleshooting if they match the user's issue. 
CRITICAL RULES:
1. These resolutions belong to OTHER customers. They are NOT from the current customer's history.
2. Never refer to these global memories as 'your previous conversation', 'our past discussion', 'as we discussed', or 'your setup'. 
3. If you use this information to answer, phrase it strictly as: 'Based on similar issues resolved for other customers...' or 'In similar cases, the resolution was...' or refer to it as general product/troubleshooting knowledge.
4. Do NOT assume the current customer has the same name, account settings, ID, or quantities (like number of backlogs or backs) mentioned in these global facts. 
5. Never mix up other customers' specific details with the current customer's profile.\n${sharedResolutions}`;
    }

    // Inject system prompt instructing the agent on its persona
    apiMessages.unshift({
      role: "system",
      content: systemInstruction,
    });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API Error (${response.status}):`, errorText);
      throw new Error(`Groq API responded with status ${response.status}`);
    }

    const data = (await response.json()) as any;
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error("No completion choice returned from Groq API");
    }

    return reply;
  } catch (error) {
    console.error("Failed to generate LLM response, falling back to simulation:", error);
    return `[⚠️ System Note: Connection to Groq LLM failed. Running in simulated mode.]\n\nBased on your request, I suggest checking if your authentication credentials are valid. If you are experiencing a rate limit, please wait a few minutes before trying again or request a tier upgrade.`;
  }
}

/**
 * Returns a simulated customer support response when Groq API key is not configured.
 */
function getSimulatedResponse(
  chatHistory: { role: "user" | "agent"; content: string }[]
): string {
  const lastUserMessage = [...chatHistory]
    .reverse()
    .find((m) => m.role === "user")?.content.toLowerCase() || "";

  let simulatedReply = "";

  if (lastUserMessage.includes("rate limit") || lastUserMessage.includes("api")) {
    simulatedReply = `I understand you're facing API rate limiting issues. This typically happens when your request rate exceeds your current tier limits. 
    
To resolve this:
1. Implement an exponential backoff retry mechanism in your client code.
2. Check your API usage logs in the Developer Dashboard.
3. If you require higher throughput, please submit a request to upgrade your workspace seats.`;
  } else if (lastUserMessage.includes("sso") || lastUserMessage.includes("login") || lastUserMessage.includes("auth")) {
    simulatedReply = `It looks like you are encountering an SSO authentication loop. This is usually caused by a mismatch in redirect URIs or configuration parameters in your identity provider (IdP).

Please confirm:
- The redirect URI configured in your IdP matches the one in our Workspace settings.
- Cookie policies in your browser are not blocking the authentication token.
- Clear your browser storage and try logging in via incognito mode.`;
  } else {
    simulatedReply = `Hello! I am the AI Customer Support Agent. I've received your request: "${chatHistory[chatHistory.length - 1]?.content}". 

I'm currently running in **Simulation Mode** because your \`GROQ_API_KEY\` is set to the default placeholder. To enable live AI intelligence, please add a valid Groq API key to your \`.env\` file in the project root!`;
  }

  return `[🤖 Simulated AI Agent]\n\n${simulatedReply}`;
}

/**
 * Summarize a ticket and its chat resolution history into a single concise sentence.
 */
export async function generateTicketSummary(
  subject: string,
  description: string,
  chatHistoryText: string
): Promise<string> {
  const apiKey = env.GROQ_API_KEY;

  if (!apiKey || apiKey === "your_groq_api_key_here" || apiKey.trim() === "") {
    return `Issue: ${subject} (${description}). Resolution: Ticket resolved by support agent.`;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: 
              "You are a support supervisor. Your task is to summarize the ticket and its chat history into a general, anonymized troubleshooting entry. " +
              "Format the output exactly as: 'Issue: <general problem description>. Resolution: <action taken to fix it>.'\n" +
              "RULES:\n" +
              "1. Anonymize all details. Never include personal customer names (like Udit, Bob, Alice), emails, IP addresses, or customer-specific credentials.\n" +
              "2. Do NOT write specific personal facts (e.g. 'Udit has 2 backs') into the summary.\n" +
              "3. If the ticket is about general personal questions, chitchat, account information, or does not contain any useful general technical troubleshooting value, reply with exactly 'NONE'.\n" +
              "Keep the summary under 60 words.",
          },
          {
            role: "user",
            content: `Ticket Subject: ${subject}\nTicket Description: ${description}\n\nChat History:\n${chatHistoryText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API responded with status ${response.status}`);
    }

    const data = (await response.json()) as any;
    const summary = data.choices?.[0]?.message?.content;
    if (!summary) {
      throw new Error("No completion returned from Groq summary request");
    }

    return summary.trim();
  } catch (error) {
    console.error("Failed to generate ticket summary, falling back to simulated text:", error);
    return `Issue: ${subject} (${description}). Resolution: Ticket successfully resolved.`;
  }
}

