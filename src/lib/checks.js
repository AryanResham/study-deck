// Lowercases, removes punctuation, and collapses spaces so texts can be compared
export const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// The text that identifies an item: the question, or the front of a card
export const getItemText = (type, item) => {
  return type === "quiz" ? item.question : item.front;
};

// Lists the text of every item in the project, oldest first
export const getProjectItemTexts = (project) => {
  const texts = [];
  for (const artifact of project.artifacts) {
    for (const item of artifact.items) {
      texts.push(getItemText(artifact.type, item));
    }
  }
  return texts;
};

// Removes new items that already exist in the project, or repeat within the batch
export const removeDuplicates = (type, newItems, existingTexts) => {
  const seen = new Set(existingTexts.map(normalizeText));
  const kept = [];

  for (const item of newItems) {
    const key = normalizeText(getItemText(type, item));
    if (!seen.has(key)) {
      seen.add(key);
      kept.push(item);
    }
  }

  return { kept, removed: newItems.length - kept.length };
};

// Checks whether the model's supporting quote really appears in the notes
export const isQuoteInNotes = (quote, notesText) => {
  const normalizedQuote = normalizeText(quote || "");
  // Very short quotes like "the cell" would match almost anything
  if (normalizedQuote.split(" ").length < 3) {
    return false;
  }
  return normalizeText(notesText).includes(normalizedQuote);
};
