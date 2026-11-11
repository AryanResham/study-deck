import { getProjectItemTexts, isQuoteInNotes, removeDuplicates } from "./checks.js";
import { plural } from "./utils.js";

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
    return { ...item, id: crypto.randomUUID(), sourceFound };
  });

  return {
    id: crypto.randomUUID(),
    type: options.type,
    title: response.title,
    createdAt: Date.now(),
    count: options.count,
    difficulty: options.difficulty,
    instruction: options.instruction,
    items,
    messages: buildMessages(options.type, options.count, items.length, response.dropped, removed),
    progress: emptyProgress(options.type),
  };
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
