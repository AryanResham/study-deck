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

// Shape of one card as the model returns it
const cardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  source: z.string().optional(),
});

// JSON Schema sent to Gemini so it answers in this exact format
const jsonSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["ok", "rejected", "exhausted"] },
    reason: { type: "string" },
    title: { type: "string" },
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string" },
          back: { type: "string" },
          source: { type: "string" },
        },
        required: ["front", "back"],
      },
    },
  },
  required: ["status"],
};

// Writes the prompt for a set of flashcards
const buildPrompt = (request) => {
  return joinPrompt([
    "You write flashcards for a student. Reply with JSON only.",
    describeSource(request.source),
    `Write ${request.count} flashcards.`,
    describeDifficulty(request.difficulty),
    describeInstruction(request.instruction),
    [
      "Rules for each card:",
      '- "front" is a question or a term. Keep it short.',
      '- "back" is the answer in at most two sentences.',
      "- Each card tests one idea.",
    ].join("\n"),
    describeSourceQuote(request.source),
    describeExisting(request.existing),
    describeRefusals(request.source),
    'Otherwise reply with {"status": "ok", "title": "<short title, at most 6 words>", "cards": [...]}.',
  ]);
};

// Checks one card's shape and logic
// Returns { ok: true, item } with trimmed text, or { ok: false, problem }
const checkItem = (raw) => {
  const parsed = cardSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, problem: "missing or wrong fields" };
  }

  const card = parsed.data;
  if (!hasText(card.front) || !hasText(card.back)) {
    return { ok: false, problem: "a side of the card is blank" };
  }

  return {
    ok: true,
    item: {
      front: card.front.trim(),
      back: card.back.trim(),
      source: card.source ? card.source.trim() : "",
    },
  };
};

export const flashcardsGenerator = {
  itemsKey: "cards",
  responseSchema: buildResponseSchema("cards"),
  jsonSchema,
  buildPrompt,
  checkItem,
};
