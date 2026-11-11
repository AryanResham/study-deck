import { z } from "zod";

// The browser gives up a little after the backend's own 25 second timeout
const CLIENT_TIMEOUT_MS = 30000;

// Shapes of one card and one question, so a bad item can never reach the players
const cardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  source: z.string(),
});

const questionSchema = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    answer: z.string(),
    explanation: z.string(),
    source: z.string(),
  })
  .refine((question) => question.options.includes(question.answer), "answer is not one of the options");

// Check of a successful response, in case something other than our backend answered
const buildResponseSchema = (type) => {
  const itemSchema = type === "quiz" ? questionSchema : cardSchema;
  return z.discriminatedUnion("status", [
    z.object({
      status: z.literal("ok"),
      title: z.string(),
      items: z.array(itemSchema).min(1),
      dropped: z.number(),
    }),
    z.object({ status: z.literal("rejected"), reason: z.string() }),
    z.object({ status: z.literal("exhausted"), reason: z.string() }),
  ]);
};

// Shape of an error from our backend
const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
  }),
});

// Builds an error the UI knows how to show
const apiError = (code, message, retryable) => {
  const error = new Error(message);
  error.code = code;
  error.retryable = retryable;
  return error;
};

// Reads the JSON body, or returns null if it is not JSON (for example an HTML error page)
const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

// Asks the backend to generate flashcards or a quiz
// Resolves with { status: "ok" | "rejected" | "exhausted", ... } or throws an error with a code
export const generateArtifact = async (request, signal, debugScenario) => {
  const headers = { "Content-Type": "application/json" };
  if (debugScenario) {
    headers["x-debug-scenario"] = debugScenario;
  }

  // Stops on Cancel (signal) or when the safety timeout runs out
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS);
  const combinedSignal = AbortSignal.any([signal, timeout]);

  let response;
  let body;
  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal: combinedSignal,
    });
    body = await readJson(response);
  } catch {
    if (signal.aborted) {
      throw apiError("CANCELLED", "Cancelled.", false);
    }
    if (timeout.aborted) {
      throw apiError("TIMEOUT", "The server took too long to answer.", true);
    }
    throw apiError("NETWORK_ERROR", "Couldn't reach the server. Check that it is running.", true);
  }

  if (!response.ok) {
    const parsedError = errorSchema.safeParse(body);
    if (parsedError.success) {
      const { code, message, retryable } = parsedError.data.error;
      throw apiError(code, message, retryable);
    }
    // In development, Vite answers an empty 502 when the API server is not running
    if (body === null && response.status >= 502 && response.status <= 504) {
      throw apiError("NETWORK_ERROR", "Couldn't reach the API server. Check that it is running.", true);
    }
    throw apiError("BAD_RESPONSE", `The server answered with an unexpected error (${response.status}).`, true);
  }

  const parsed = buildResponseSchema(request.type).safeParse(body);
  if (!parsed.success) {
    throw apiError("BAD_RESPONSE", "The server sent back something unexpected.", true);
  }
  return parsed.data;
};
