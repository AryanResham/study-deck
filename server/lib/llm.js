import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { errors } from "./errors.js";

// This is the only file that talks to the AI provider
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let client = null;

// Creates the Gemini client the first time it is needed
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw errors.noApiKey();
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

// Sends a prompt to Gemini in JSON mode and returns the raw text of the answer
export const callModel = async (prompt, jsonSchema, signal) => {
  const ai = getClient();

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
        // Less thinking means faster answers; the task is simple enough
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: signal,
      },
    });
    return response.text;
  } catch (error) {
    // Cancel and timeout are handled by the route
    if (signal.aborted) {
      throw error;
    }

    console.error(`Gemini error (status ${error.status}):`, error.message);

    if (error.status === 429) {
      throw errors.rateLimited();
    }
    // Bad key, unknown model, or a request the API will never accept
    if (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404) {
      throw errors.providerRejected();
    }
    throw errors.provider();
  }
};
