import { getProjectItemTexts, isQuoteInNotes, removeDuplicates } from "./checks.js";
import { createId, plural } from "./utils.js";
import { LIMITS } from "../../shared/limits.js";

// What one item is called in messages
export const itemWord = (type) => {
  return type === "quiz" ? "question" : "card";
};

// The difficulty one step up, used by the "Harder" button
export const getHarderDifficulty = (difficulty) => {
  if (difficulty === "easy") {
    return "medium";
  }
  return "hard";
};

// Empty progress for a new artifact
const emptyProgress = (type) => {
  if (type === "quiz") {
    return { attempts: [] };
  }
  return { cards: {} };
};

// Short notes shown on the card, such as "2 duplicates removed"
const buildMessages = (type, requested, keptCount, dropped, duplicates) => {
  const word = itemWord(type);
  const messages = [];
  if (dropped > 0) {
    messages.push(`${plural(dropped, word)} ${dropped === 1 ? "was" : "were"} invalid and removed.`);
  }
  if (duplicates > 0) {
    messages.push(`${plural(duplicates, "duplicate")} removed.`);
  }
  if (keptCount < requested) {
    messages.push(`Only ${plural(keptCount, "new " + word)} could be made.`);
  }
  return messages;
};

// Turns a successful response into a new artifact for the project
// Returns null when every item was a duplicate
export const buildArtifact = (project, options, response) => {
  const { kept, removed } = removeDuplicates(options.type, response.items, getProjectItemTexts(project));
  if (kept.length === 0) {
    return null;
  }

  // Our code assigns ids, and checks quotes only when there are notes
  const items = kept.map((item) => {
    let sourceFound = null;
    if (project.source.kind === "notes") {
      sourceFound = isQuoteInNotes(item.source, project.source.text);
    }
    return { ...item, id: createId(), sourceFound };
  });

  return {
    id: createId(),
    type: options.type,
    title: response.title,
    createdAt: Date.now(),
    count: options.count,
    difficulty: options.difficulty,
    instruction: options.instruction,
    items,
    messages: buildMessages(options.type, options.count, items.length, response.dropped, removed),
    progress: emptyProgress(options.type),
    weakFocus: options.weak.length > 0,
    // Problems the model spotted in the notes, shown on the set card
    concerns: response.concerns,
  };
};

// The text of items the student is weak on, across every set of this type in the project
// Flashcards: cards marked "still learning". Quizzes: questions missed in the latest full attempt.
export const getWeakItems = (project, type) => {
  const texts = [];
  for (const artifact of project.artifacts) {
    if (artifact.type !== type) {
      continue;
    }

    if (type === "flashcards") {
      for (const card of artifact.items) {
        if (artifact.progress.cards[card.id] === "learning") {
          texts.push(card.front);
        }
      }
      continue;
    }

    const attempts = artifact.progress.attempts;
    const latest = attempts[attempts.length - 1];
    // Attempts saved before this feature have no wrongIds
    if (!latest || !latest.wrongIds) {
      continue;
    }
    for (const question of artifact.items) {
      if (latest.wrongIds.includes(question.id)) {
        texts.push(question.question);
      }
    }
  }
  // Long items are cut, so one huge card cannot fail the whole request
  return texts.slice(-LIMITS.weakMax).map((text) => text.slice(0, LIMITS.weakTextMax));
};

// Counts flashcards by status: known, learning, and new
export const countCardStatuses = (artifact) => {
  const counts = { known: 0, learning: 0, new: 0 };
  for (const card of artifact.items) {
    const status = artifact.progress.cards[card.id] || "new";
    counts[status] += 1;
  }
  return counts;
};
