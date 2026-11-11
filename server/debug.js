import { errors } from "./lib/errors.js";
import { SAMPLE_CARDS, SAMPLE_QUESTIONS } from "./debug-samples.js";

// Fake model results, chosen with the x-debug-scenario header
export const SCENARIOS = [
  "ok",
  "malformed_json",
  "retry_recovers",
  "wrong_shape",
  "empty",
  "partial_invalid",
  "rejected",
  "exhausted",
  "slow",
  "timeout",
  "server_error",
];

// Reads the scenario header; it is ignored in production
export const readScenario = (req) => {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const scenario = req.get("x-debug-scenario");
  if (!scenario) {
    return null;
  }
  if (!SCENARIOS.includes(scenario)) {
    throw errors.inputInvalid(`Unknown debug scenario "${scenario}".`);
  }
  return scenario;
};

// Waits for some time, but stops early if the request is aborted
const wait = (ms, signal) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
};

// Picks a random handful of sample items, so follow-ups produce some duplicates
const pickRandom = (items, count) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
};

// A valid model answer built from the sample items
const buildValidText = (request) => {
  if (request.type === "quiz") {
    const questions = pickRandom(SAMPLE_QUESTIONS, request.count);
    return JSON.stringify({ status: "ok", title: "Photosynthesis basics", questions });
  }
  const cards = pickRandom(SAMPLE_CARDS, request.count);
  return JSON.stringify({ status: "ok", title: "Photosynthesis basics", cards });
};

// A model answer where 3 items break the logic checks
const buildPartlyInvalidText = (request) => {
  if (request.type === "quiz") {
    const badQuestions = [
      { question: "Answer missing from options?", options: ["A", "B", "C", "D"], answer: "E", explanation: "x" },
      { question: "Duplicate options?", options: ["Same", "Same", "Other", "More"], answer: "Same", explanation: "x" },
      { question: "   ", options: ["A", "B", "C", "D"], answer: "A", explanation: "Blank question text." },
    ];
    const questions = [...pickRandom(SAMPLE_QUESTIONS, 4), ...badQuestions];
    return JSON.stringify({ status: "ok", title: "Photosynthesis (partly broken)", questions });
  }

  const badCards = [
    { front: "Blank back?", back: "   " },
    { front: "", back: "Empty front" },
    { back: "Front is missing entirely" },
  ];
  const cards = [...pickRandom(SAMPLE_CARDS, 4), ...badCards];
  return JSON.stringify({ status: "ok", title: "Photosynthesis (partly broken)", cards });
};

// Returns fake model text for a scenario
// The text then goes through the same parsing and checks as a real answer
export const getFakeModelText = async (scenario, request, attempt, signal) => {
  const itemsKey = request.type === "quiz" ? "questions" : "cards";

  switch (scenario) {
    case "ok":
      await wait(800, signal);
      return buildValidText(request);

    case "malformed_json":
      await wait(500, signal);
      return '```json\n{"status": "ok", "title": "Photosynthesis", "' + itemsKey + '": [{"question": "Where do';

    case "retry_recovers":
      // First attempt is broken, the retry works
      await wait(500, signal);
      if (attempt === 1) {
        return '{"status": "ok", "title": "Broken", ' + itemsKey + ": [}";
      }
      return buildValidText(request);

    case "wrong_shape":
      await wait(500, signal);
      return JSON.stringify({ result: "success", data: [{ q: "What is ATP?", a: "Energy carrier" }] });

    case "empty":
      await wait(500, signal);
      return JSON.stringify({ status: "ok", title: "Nothing here", [itemsKey]: [] });

    case "partial_invalid":
      await wait(800, signal);
      return buildPartlyInvalidText(request);

    case "rejected":
      await wait(500, signal);
      return JSON.stringify({ status: "rejected", reason: "The input doesn't contain enough study material." });

    case "exhausted":
      await wait(500, signal);
      return JSON.stringify({ status: "exhausted", reason: "These notes are fully covered." });

    case "slow":
      await wait(10000, signal);
      return buildValidText(request);

    case "timeout":
      // Never answers; the route's 25 second timeout fires first
      await wait(10 * 60 * 1000, signal);
      return "";

    case "server_error":
      throw errors.server();

    default:
      throw errors.inputInvalid(`Unknown debug scenario "${scenario}".`);
  }
};
