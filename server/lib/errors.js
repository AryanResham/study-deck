// Builds an error that carries an HTTP status and a code the frontend understands
const appError = (code, message, status, retryable) => {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.retryable = retryable;
  // Marks errors we made on purpose, so their message is safe to show
  error.isAppError = true;
  return error;
};

// One helper per error the API can return
export const errors = {
  inputInvalid: (message) => appError("INPUT_INVALID", message, 400, false),
  badModelOutput: () =>
    appError("BAD_MODEL_OUTPUT", "The AI sent back something we couldn't use, even after a retry.", 502, true),
  provider: (message) =>
    appError("PROVIDER_ERROR", message || "The AI service failed. Try again in a moment.", 502, true),
  providerRejected: () =>
    appError("PROVIDER_ERROR", "The AI service refused the request. Check the API key and model name on the server.", 502, false),
  rateLimited: () =>
    appError("RATE_LIMITED", "Too many requests to the AI service. Wait a minute and try again.", 429, true),
  timeout: () => appError("TIMEOUT", "The AI took too long to answer.", 504, true),
  noApiKey: () =>
    appError("NO_API_KEY", "The server has no Gemini API key. Add GEMINI_API_KEY to .env and restart.", 500, false),
  server: () => appError("SERVER_ERROR", "Something went wrong on the server.", 500, true),
};

// Turns a Zod error into one readable line, for example "count: Invalid input"
export const describeZodError = (zodError) => {
  return zodError.issues
    .map((issue) => {
      const where = issue.path.length > 0 ? issue.path.join(".") : "response";
      return `${where}: ${issue.message}`;
    })
    .join("; ");
};

// Sends an error to the browser in the standard { error: {...} } shape
export const sendError = (res, error) => {
  // Unknown errors are logged and hidden behind a generic message
  if (!error.isAppError) {
    console.error(error);
    error = errors.server();
  }

  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    },
  });
};
