import { z } from "zod";
import { flashcardsGenerator } from "../generators/flashcards.js";
import { quizGenerator } from "../generators/quiz.js";
import { callModel } from "../lib/llm.js";
import { parseModelText } from "../lib/parse.js";
import { describeZodError, errors, sendError } from "../lib/errors.js";
import { getFakeModelText, readScenario } from "../debug.js";
import { ARTIFACT_TYPES, COUNTS, DIFFICULTIES, LIMITS, checkSourceText } from "../../shared/limits.js";

// Each type only differs in its prompt, schema, and item check
const generators = {
  flashcards: flashcardsGenerator,
  quiz: quizGenerator,
};

// The whole generation (both attempts) must finish within this time
const TIMEOUT_MS = 25000;

// Shape of the request body the browser sends
const requestSchema = z.object({
  type: z.enum(ARTIFACT_TYPES),
  source: z.object({
    kind: z.enum(["topic", "notes"]),
    text: z.string(),
  }),
  count: z.number().refine((value) => COUNTS.includes(value), "count must be 5, 10, or 15"),
  difficulty: z.enum(DIFFICULTIES),
  instruction: z.string().max(LIMITS.instructionMax).default(""),
  existing: z.array(z.string()).max(LIMITS.existingMax).default([]),
  // Items the student is weak on, for "practise my weak spots"
  weak: z.array(z.string().max(LIMITS.weakTextMax)).max(LIMITS.weakMax).default([]),
});

// Checks the request body and returns a clean copy, or throws INPUT_INVALID
const readRequest = (body) => {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    throw errors.inputInvalid(`Invalid request. ${describeZodError(parsed.error)}`);
  }

  const request = parsed.data;
  // Same limits as the browser, so nobody can skip them by calling the API directly
  const sourceProblem = checkSourceText(request.source.kind, request.source.text);
  if (sourceProblem) {
    throw errors.inputInvalid(sourceProblem);
  }

  request.source.text = request.source.text.trim();
  request.instruction = request.instruction.trim();
  return request;
};

// Gets the raw text from the model, or from a fake scenario when debugging
const getModelText = (prompt, request, generator, signal, scenario, attempt) => {
  if (scenario) {
    return getFakeModelText(scenario, request, attempt, signal);
  }
  return callModel(prompt, generator.jsonSchema, signal);
};

// Runs the parse, shape, and logic checks on the model's text
// Returns { ok: true, response } or { ok: false, problem }
const checkModelText = (text, request, generator) => {
  const parsed = parseModelText(text);
  if (!parsed.ok) {
    return parsed;
  }

  const shape = generator.responseSchema.safeParse(parsed.data);
  if (!shape.success) {
    return { ok: false, problem: `The JSON did not match the required format (${describeZodError(shape.error)}).` };
  }

  const data = shape.data;

  // A refusal is a valid answer, not an error
  if (data.status === "rejected") {
    return { ok: true, response: { status: "rejected", reason: data.reason || "This doesn't look like study material." } };
  }
  if (data.status === "exhausted") {
    return { ok: true, response: { status: "exhausted", reason: data.reason || "There's nothing new left to make from these notes." } };
  }

  // Keep the good items and count the bad ones
  const goodItems = [];
  const problems = [];
  data[generator.itemsKey].forEach((rawItem, index) => {
    const check = generator.checkItem(rawItem);
    if (check.ok) {
      goodItems.push(check.item);
    } else {
      problems.push(`item ${index + 1}: ${check.problem}`);
    }
  });

  if (problems.length > 0) {
    console.warn(`Dropped ${problems.length} invalid item(s): ${problems.join("; ")}`);
  }

  if (goodItems.length === 0) {
    const details = problems.length > 0 ? ` (${problems.join("; ")})` : "";
    return { ok: false, problem: `There were no usable items${details}.` };
  }

  // A fallback title when the model left it out, and a cap on very long ones
  const title = (data.title || "").trim().slice(0, LIMITS.titleMax) || (request.type === "quiz" ? "Quiz" : "Flashcards");

  return {
    ok: true,
    response: {
      status: "ok",
      title,
      // Never return more items than were asked for
      items: goodItems.slice(0, request.count),
      dropped: problems.length,
    },
  };
};

// Asks the model up to two times; the second prompt says what went wrong
const runGeneration = async (request, signal, scenario) => {
  const generator = generators[request.type];
  const basePrompt = generator.buildPrompt(request);
  let prompt = basePrompt;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await getModelText(prompt, request, generator, signal, scenario, attempt);
    const result = checkModelText(text, request, generator);
    if (result.ok) {
      return result.response;
    }

    console.warn(`Attempt ${attempt} failed: ${result.problem}`);
    prompt = `${basePrompt}\n\nYour previous reply could not be used: ${result.problem}\nReply again with valid JSON that follows the format and rules above exactly.`;
  }

  throw errors.badModelOutput();
};

// POST /api/generate
export const generateRoute = async (req, res) => {
  // Aborts the model call if the browser closes the connection (for example, Cancel)
  const clientGone = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) {
      clientGone.abort();
    }
  });

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = AbortSignal.any([clientGone.signal, timeout]);

  try {
    const request = readRequest(req.body);
    const scenario = readScenario(req);
    const response = await runGeneration(request, signal, scenario);
    res.json(response);
  } catch (error) {
    // Nobody is listening any more, so there is nothing to send
    if (clientGone.signal.aborted) {
      console.log("Request cancelled by the browser.");
      return;
    }
    if (timeout.aborted) {
      sendError(res, errors.timeout());
      return;
    }
    sendError(res, error);
  }
};
