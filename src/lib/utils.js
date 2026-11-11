// Returns a shuffled copy of a list (Fisher-Yates), leaving the original alone
export const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// "1 card", "2 cards"
export const plural = (count, word) => {
  return count === 1 ? `${count} ${word}` : `${count} ${word}s`;
};

// True when a key press should be left alone (typing in a field, or using Ctrl/Cmd)
export const shouldIgnoreKey = (event) => {
  const tag = event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return event.ctrlKey || event.metaKey || event.altKey;
};
