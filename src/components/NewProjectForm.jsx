import { useState } from "react";
import { LIMITS, checkSourceText } from "../../shared/limits.js";
import { EXAMPLE_TOPICS, SAMPLE_NOTES } from "../lib/examples.js";

// Form for a new project: a topic, or pasted notes
const NewProjectForm = ({ hasProjects, onCreate, onOpenSidebar }) => {
  const [mode, setMode] = useState("topic");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  // Errors for "too short" only show after the first submit attempt
  const [attempted, setAttempted] = useState(false);

  const text = mode === "topic" ? topic : notes;
  const problem = checkSourceText(mode, text);
  const isTooLong = mode === "topic" ? topic.trim().length > LIMITS.topicMax : notes.trim().length > LIMITS.notesMax;
  const showProblem = problem && (attempted || isTooLong);

  // Switches between Topic and Paste notes
  const changeMode = (newMode) => {
    setMode(newMode);
    setAttempted(false);
  };

  // Moves a long "topic" into the notes box
  const moveTopicToNotes = () => {
    setNotes(topic);
    setTopic("");
    changeMode("notes");
  };

  // Creates the project if the input passes the limits; no AI call happens here
  const handleSubmit = (event) => {
    event.preventDefault();
    setAttempted(true);
    if (problem) {
      return;
    }
    onCreate({ kind: mode, text: text.trim() });
  };

  const tabClass = (tabMode) =>
    `flex-1 rounded-md px-3 py-2.5 text-sm font-medium sm:py-1.5 ${
      mode === tabMode ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
    }`;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center gap-2 px-4 pt-4 md:hidden">
        <button
          type="button"
          className="rounded-md px-3 py-2 text-zinc-300 hover:bg-zinc-800"
          onClick={onOpenSidebar}
          aria-label="Open projects"
        >
          ☰
        </button>
        <span className="font-semibold">
          Study<span className="text-zinc-500">Deck</span>
        </span>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {hasProjects ? "New project" : "What do you want to study?"}
        </h1>
        <p className="mt-2 text-zinc-400">
          Give a topic or paste your notes. Then make flashcards and quizzes from it.
        </p>

        <form className="mt-8" onSubmit={handleSubmit}>
          <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
            <button type="button" className={tabClass("topic")} onClick={() => changeMode("topic")}>
              Topic
            </button>
            <button type="button" className={tabClass("notes")} onClick={() => changeMode("notes")}>
              Paste notes
            </button>
          </div>

          {mode === "topic" ? (
            <div className="mt-4">
              <label htmlFor="topic" className="sr-only">
                Topic
              </label>
              <input
                id="topic"
                type="text"
                autoFocus
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                placeholder="e.g. The French Revolution"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
            </div>
          ) : (
            <div className="mt-4">
              <label htmlFor="notes" className="sr-only">
                Notes
              </label>
              <textarea
                id="notes"
                autoFocus
                rows={12}
                className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base leading-relaxed placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                placeholder="Paste your lecture notes, a textbook section, or an article..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="py-3 text-zinc-400 underline underline-offset-2 hover:text-zinc-200 sm:py-1 sm:no-underline sm:hover:underline"
                  onClick={() => setNotes(SAMPLE_NOTES)}
                >
                  Use sample notes
                </button>
                <span className={notes.trim().length > LIMITS.notesMax ? "text-zinc-100" : "text-zinc-500"}>
                  {notes.trim().length.toLocaleString()} / {LIMITS.notesMax.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {showProblem && (
            <p className="mt-3 text-sm text-zinc-300" role="alert">
              {problem}{" "}
              {mode === "topic" && isTooLong && (
                <button type="button" className="font-medium text-white underline" onClick={moveTopicToNotes}>
                  Switch
                </button>
              )}
            </p>
          )}

          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-zinc-100 px-4 py-3 font-medium text-zinc-900 hover:bg-white sm:w-auto"
          >
            Create project
          </button>
        </form>

        {mode === "topic" && (
          <div className="mt-10">
            <p className="text-sm text-zinc-500">Or try an example:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLE_TOPICS.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="rounded-full border border-zinc-700 px-3.5 py-2.5 text-sm sm:px-3 sm:py-1.5 text-zinc-300 hover:border-zinc-400 hover:text-white"
                  onClick={() => onCreate({ kind: "topic", text: example })}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProjectForm;
