import { z } from "zod";
import {
  buildResponseSchema,
  describeDifficulty,
  describeExisting,
  describeInstruction,
  describeRefusals,
  describeSource,
  describeSourceQuote,
  hasText,
  joinPrompt,
} from "./shared.js";

// Shape of one question as the model returns it
const questionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(5),
  answer: z.string().min(1),
  explanation: z.string().min(1),
  source: z.string().optional(),
});

// JSON Schema sent to Gemini so it answers in this exact format
const jsonSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["ok", "rejected", "exhausted"] },
    reason: { type: "string" },
    title: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answer: { type: "string" },
          explanation: { type: "string" },
          source: { type: "string" },
        },
        required: ["question", "options", "answer", "explanation"],
      },
    },
  },
  required: ["status"],
};

// Writes the prompt for a multiple-choice quiz
const buildPrompt = (request) => {
  return joinPrompt([
    "You write multiple-choice quiz questions for a student. Reply with JSON only.",
    describeSource(request.source),
    `Write ${request.count} questions.`,
    describeDifficulty(request.difficulty),
    describeInstruction(request.instruction),
    [
      "Rules for each question:",
      "- Exactly 4 options, all different, with exactly one correct.",
      '- "answer" must be copied exactly, character for character, from "options".',
      "- Wrong options must be believable, not silly.",
      '- "explanation" is one or two sentences on why the answer is right.',
    ].join("\n"),
    describeSourceQuote(request.source),
    describeExisting(request.existing),
    describeRefusals(request.source),
    'Otherwise reply with {"status": "ok", "title": "<short title, at most 6 words>", "questions": [...]}.',
  ]);
};

// Checks one question's shape and logic
// Returns { ok: true, item } with trimmed text, or { ok: false, problem }
const checkItem = (raw) => {
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, problem: "missing or wrong fields" };
  }

  const question = parsed.data;
  const options = question.options.map((option) => option.trim());
  const answer = question.answer.trim();

  if (!hasText(question.question) || !hasText(question.explanation) || !hasText(answer)) {
    return { ok: false, problem: "a text field is blank" };
  }
  if (options.some((option) => option === "")) {
    return { ok: false, problem: "an option is blank" };
  }

  // Options must be different from each other, ignoring case
  const lowerCaseOptions = options.map((option) => option.toLowerCase());
  if (new Set(lowerCaseOptions).size !== options.length) {
    return { ok: false, problem: "two options are the same" };
  }

  if (!options.includes(answer)) {
    return { ok: false, problem: "the answer is not one of the options" };
  }

  return {
    ok: true,
    item: {
      question: question.question.trim(),
      options,
      answer,
      explanation: question.explanation.trim(),
      source: question.source ? question.source.trim() : "",
    },
  };
};

export const quizGenerator = {
  itemsKey: "questions",
  responseSchema: buildResponseSchema("questions"),
  jsonSchema,
  buildPrompt,
  checkItem,
};
