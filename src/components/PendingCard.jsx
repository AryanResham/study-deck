import ErrorNotice from "./ErrorNotice.jsx";

// Extra help for errors the user can fix themselves
const ERROR_HINTS = {
  NO_API_KEY: "Tip: open the app with ?debug=1 to try it with fake answers.",
  NETWORK_ERROR: "Run npm start so the API server is up.",
};

// Shows a running generation, or the message it ended with
const PendingCard = ({ generation, onCancel, onRetry, onDismiss }) => {
  const typeLabel = generation.options.type === "quiz" ? "quiz" : "flashcards";

  if (generation.status === "loading") {
    return (
      <div className="flex flex-col rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-4" role="status">
        <span className="text-sm text-zinc-300">Making {typeLabel}...</span>
        <div className="mt-3 space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800" />
        </div>
        <p className="mt-3 text-xs text-zinc-500">This usually takes 5–20 seconds.</p>
        <button
          type="button"
          className="mt-3 self-start rounded-lg border border-zinc-700 px-4 py-2.5 text-sm sm:px-3 sm:py-1.5 text-zinc-300 hover:bg-zinc-800"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (generation.status === "error") {
    return (
      <ErrorNotice
        title={`Couldn't make ${typeLabel}`}
        message={generation.message}
        onRetry={generation.retryable ? onRetry : undefined}
        onDismiss={onDismiss}
      >
        {ERROR_HINTS[generation.code] && <p className="mt-2 text-xs opacity-75">{ERROR_HINTS[generation.code]}</p>}
      </ErrorNotice>
    );
  }

  // Refusals and "nothing new" are normal answers, so they use the calm style
  if (generation.status === "rejected") {
    return (
      <ErrorNotice
        tone="info"
        title="This doesn't look like study material"
        message={`${generation.message} Try a clearer topic or different notes.`}
        onDismiss={onDismiss}
      />
    );
  }

  if (generation.status === "exhausted") {
    return (
      <ErrorNotice
        tone="info"
        title="Your notes are fully covered"
        message="Add more notes to keep going."
        onDismiss={onDismiss}
      />
    );
  }

  return <ErrorNotice tone="info" title="Nothing new this time" message={generation.message} onDismiss={onDismiss} />;
};

export default PendingCard;
