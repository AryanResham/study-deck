// Input limits shared by the browser and the server
export const LIMITS = {
  topicMin: 3,
  topicMax: 100,
  notesMin: 200,
  notesMax: 20000,
  instructionMax: 200,
  existingMax: 100,
};

export const COUNTS = [5, 10, 15];
export const DIFFICULTIES = ["easy", "medium", "hard"];
export const ARTIFACT_TYPES = ["flashcards", "quiz"];

// Returns a message if the topic or notes break the limits, or null if they are fine
export const checkSourceText = (kind, text) => {
  const length = text.trim().length;

  if (kind === "topic") {
    if (length < LIMITS.topicMin) {
      return "Type a topic of at least 3 characters.";
    }
    if (length > LIMITS.topicMax) {
      return "That looks like notes. Switch to Paste notes?";
    }
    return null;
  }

  if (length < LIMITS.notesMin) {
    return "Add more content. Notes need at least 200 characters.";
  }
  if (length > LIMITS.notesMax) {
    return "Trim to 20,000 characters.";
  }
  return null;
};
