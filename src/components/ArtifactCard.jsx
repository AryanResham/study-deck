import { countCardStatuses, itemWord } from "../lib/artifacts.js";
import { plural } from "../lib/utils.js";

// One line about progress: known cards, or the last quiz score
const describeProgress = (artifact) => {
  if (artifact.type === "flashcards") {
    const counts = countCardStatuses(artifact);
    return `${counts.known} of ${artifact.items.length} known`;
  }
  const attempts = artifact.progress.attempts;
  if (attempts.length === 0) {
    return "Not taken yet";
  }
  const last = attempts[attempts.length - 1];
  return `Last score ${last.score}/${last.total}`;
};

// A saved flashcard set or quiz, shown in the project grid
const ArtifactCard = ({ artifact, isBusy, onOpen, onMoreLikeThis, onHarder, onDelete }) => {
  const flaggedCount = artifact.items.filter((item) => item.sourceFound === false).length;
  const isQuiz = artifact.type === "quiz";

  // Asks before deleting, because progress is lost too
  const handleDelete = () => {
    if (window.confirm(`Delete "${artifact.title}"?`)) {
      onDelete();
    }
  };

  const smallButton =
    "rounded-md px-2.5 py-2.5 text-xs text-zinc-400 sm:px-2 sm:py-1 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
      <button type="button" className="flex-1 p-4 text-left" onClick={onOpen}>
        <span
          className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
            "bg-zinc-800 text-zinc-300"
          }`}
        >
          {isQuiz ? "Quiz" : "Flashcards"}
        </span>
        <span className="mt-2 block font-medium text-zinc-100">{artifact.title}</span>
        <span className="mt-1 block text-sm text-zinc-400">
          {plural(artifact.items.length, itemWord(artifact.type))} · <span className="capitalize">{artifact.difficulty}</span>
        </span>
        {artifact.instruction && (
          <span className="mt-1 block truncate text-xs text-zinc-500">Focus: {artifact.instruction}</span>
        )}
        <span className="mt-3 block text-sm text-zinc-300">{describeProgress(artifact)}</span>

        {artifact.messages.map((message) => (
          <span key={message} className="mt-1 block text-xs text-zinc-500">
            {message}
          </span>
        ))}
        {flaggedCount > 0 && (
          <span className="mt-1 block text-xs text-zinc-400">
            ⚠ {plural(flaggedCount, itemWord(artifact.type))} may not be from your notes
          </span>
        )}
      </button>

      <div className="flex items-center gap-1 border-t border-zinc-800 px-2 py-1.5">
        <button type="button" className={smallButton} disabled={isBusy} onClick={onMoreLikeThis}>
          More like this
        </button>
        <button
          type="button"
          className={smallButton}
          disabled={isBusy || artifact.difficulty === "hard"}
          title={artifact.difficulty === "hard" ? "Already at the hardest level" : undefined}
          onClick={onHarder}
        >
          Harder
        </button>
        <button type="button" className={`${smallButton} ml-auto hover:text-zinc-100`} onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default ArtifactCard;
