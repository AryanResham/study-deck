// Input limits shared by the browser and the server
export const LIMITS = {
  // 2, so short topics like "AI" or "ML" work
  topicMin: 2,
  topicMax: 100,
  notesMin: 80,
  notesMax: 20000,
  instructionMax: 200,
  existingMax: 100,
  weakMax: 50,
  // Longest text of one weak-spot item sent to the server
  weakTextMax: 500,
  // Longest set title we keep from the model
  titleMax: 80,
};

export const COUNTS = [5, 10, 15];
export const DIFFICULTIES = ["easy", "medium", "hard"];
export const ARTIFACT_TYPES = ["flashcards", "quiz"];

// Returns a message if the topic or notes break the limits, or null if they are fine
export const checkSourceText = (kind, text) => {
  const length = text.trim().length;

  if (kind === "topic") {
    if (length < LIMITS.topicMin) {
      return `Type a topic of at least ${LIMITS.topicMin} characters.`;
    }
    if (length > LIMITS.topicMax) {
      return "That looks like notes. Switch to Paste notes?";
    }
    return null;
  }

  if (length < LIMITS.notesMin) {
    return `Add more content. Notes need at least ${LIMITS.notesMin} characters.`;
  }
  if (length > LIMITS.notesMax) {
    return "Trim to 20,000 characters.";
  }
  return null;
};
