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
    return getSimulatedResponse(chatHistory, customerMemories, sharedResolutions);
  }

  try {
    // Format messages for the API (convert 'agent' role to 'assistant')
    const apiMessages = chatHistory.map((msg) => ({
      role: msg.role === "agent" ? "assistant" : "user",
      content: msg.content,
    }));

    let systemInstruction = 
      "You are an AI Customer Support Agent for a cloud software platform. You are helpful, professional, and concise. Always answer questions based on product knowledge. Do not make up answers.\n\n" +
      "Before answering, internally compare the current customer issue with any supplied customer memory and global resolution memory. If a past memory describes the same or a very similar issue, use the remembered resolution immediately instead of treating the complaint as brand new.";

    if (customerMemories && customerMemories.trim() !== "" && customerMemories !== "FACTS: []") {
      systemInstruction += `\n\n[CUSTOMER PERSISTENT MEMORY (Current Customer Only)]:
Use the following recalled past tickets, interactions, environment info, and preferences for this specific customer as private background context.
MEMORY USAGE RULES:
1. Do not mention, announce, or summarize prior customer memory at the start of every answer.
2. Do not say phrases like "I recall", "you previously asked", "in your previous ticket", or "based on your past chats" unless the user explicitly asks what they said before, asks you to remember something, or the prior fact is directly necessary to answer the current issue.
3. If the current complaint matches an issue this same customer had before on a different ticket not in the same ticket, treat it as a repeated issue on the first response. Briefly acknowledge continuity, e.g. "This looks like the same issue we handled earlier," then apply the previous resolution or ask only for the missing detail needed to confirm it.
4. If customer memory includes how the issue was solved before, prioritize that fix and do not restart generic troubleshooting from step one.
5. If the current complaint is about a different topic, answer the current complaint normally and silently ignore unrelated customer memories.
6. While answering the follow ups of the same chat, use previous memory to answer but do not use phrases like "This looks like the same issue we handled earlier,".
7. Use relevant customer memory quietly to personalize troubleshooting, avoid repeated questions, or maintain continuity when it materially helps.\n${customerMemories}`;
    }

    if (sharedResolutions && sharedResolutions.trim() !== "" && sharedResolutions !== "FACTS: []") {
      systemInstruction += `\n\n[GLOBAL RESOLUTION MEMORY (Other Customers)]:
Use the following similar resolved cases from other customers as private background troubleshooting context only if they match the user's issue.
CRITICAL RULES:
1. These resolutions belong to OTHER customers. They are NOT from the current customer's history.
2. Never refer to these global memories as 'your previous conversation', 'our past discussion', 'as we discussed', or 'your setup'. 
3. If a global memory clearly matches the current issue, mention it naturally once, using wording like: "This issue has been encountered by other customers too, and it was resolved by..." Then give the applicable resolution.
4. Do NOT assume the current customer has the same name, account settings, ID, or quantities (like number of backlogs or backs) mentioned in these global facts. 
5. Never mix up other customers' specific details with the current customer's profile.
6. If the global memory is unrelated or only weakly related to the current complaint, ignore it completely and do not mention other customers.
7. If both customer memory and global memory match, prioritize the current customer's previous resolution first, then mention the global pattern only if it adds useful confidence or a clearer fix.\n${sharedResolutions}`;
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
    return `[System Note: Connection to Groq LLM failed. Running in simulated mode.]\n\n${getSimulatedResponse(chatHistory, customerMemories, sharedResolutions)}`;
  }
}

/**
 * Returns a simulated customer support response when Groq API key is not configured.
 */
function getSimulatedResponse(
  chatHistory: { role: "user" | "agent"; content: string }[],
  customerMemories?: string,
  sharedResolutions?: string
): string {
  const lastUserMessage = [...chatHistory]
    .reverse()
    .find((m) => m.role === "user")?.content.toLowerCase() || "";

  let simulatedReply = "";
  const hasCustomerMemories = hasUsefulFacts(customerMemories);
  const hasSharedResolutions = hasUsefulFacts(sharedResolutions);
  const asksAboutPastContext =
    lastUserMessage.includes("remember") ||
    lastUserMessage.includes("earlier") ||
    lastUserMessage.includes("before") ||
    lastUserMessage.includes("previous") ||
    lastUserMessage.includes("past");
  const looksLikeSupportIssue =
    lastUserMessage.includes("issue") ||
    lastUserMessage.includes("error") ||
    lastUserMessage.includes("bug") ||
    lastUserMessage.includes("not working") ||
    lastUserMessage.includes("failed") ||
    lastUserMessage.includes("problem");

  if (hasCustomerMemories && asksAboutPastContext) {
    simulatedReply = `I checked your customer memory bank. Here is what I found:\n\n${customerMemories}`;
  } else if (hasCustomerMemories && looksLikeSupportIssue) {
    simulatedReply = `This looks similar to an issue we handled earlier. Based on the previous resolution, try the same fix first:\n\n${customerMemories}`;
  } else if (lastUserMessage.includes("rate limit") || lastUserMessage.includes("api")) {
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

  if (hasSharedResolutions && looksLikeSupportIssue) {
    simulatedReply += `\n\nThis issue has been encountered by other customers too, and similar cases were resolved this way:\n\n${sharedResolutions}`;
  }

  return `[🤖 Simulated AI Agent]\n\n${simulatedReply}`;
}

function hasUsefulFacts(memoryText?: string): boolean {
  return Boolean(memoryText && memoryText.trim() !== "" && memoryText.trim() !== "FACTS: []");
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

/**
 * Extract personal user context facts from a chat conversation.
 * These are stored privately in the individual user's memory bank.
 * Unlike generateTicketSummary, this is intentionally NOT anonymized.
 */
export async function generateUserContextFacts(
  subject: string,
  chatHistoryText: string
): Promise<string> {
  const apiKey = env.GROQ_API_KEY;

  if (!apiKey || apiKey === "your_groq_api_key_here" || apiKey.trim() === "") {
    return "NONE";
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
              "You are a customer support CRM assistant. Your ONLY job is to extract personal facts the customer explicitly stated about themselves.\n" +
              "OUTPUT FORMAT: Reply with a bullet list of facts using '- ' prefix. Example:\n" +
              "- Customer uses ChatGPT\n" +
              "- Customer's team has 5 members\n" +
              "STRICT RULES:\n" +
              "1. ONLY include facts the customer directly stated. Never guess or infer.\n" +
              "2. NEVER write what is absent or not mentioned (e.g. do NOT write '- Customer did not mention their name').\n" +
              "3. NEVER write negative statements about missing information.\n" +
              "4. If you found ZERO personal facts stated by the customer, your ENTIRE response must be exactly the word: NONE\n" +
              "5. Do not add any explanation, preamble, or commentary. Only bullet points or the single word NONE.",
          },
          {
            role: "user",
            content: `Ticket Subject: ${subject}\n\nChat History:\n${chatHistoryText}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API responded with status ${response.status}`);
    }

    const data = (await response.json()) as any;
    const facts = data.choices?.[0]?.message?.content;
    if (!facts) {
      throw new Error("No completion returned from Groq user context request");
    }

    return facts.trim();
  } catch (error) {
    console.error("Failed to generate user context facts:", error);
    return "NONE";
  }
}
