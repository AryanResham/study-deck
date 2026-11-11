import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { COUNTS, DIFFICULTIES, LIMITS } from "../../shared/limits.js";
import { plural } from "../lib/utils.js";

// A row of buttons where one is chosen, used for count and difficulty
const ChoiceGroup = ({ label, choices, value, onChange }) => {
  return (
    <div>
      <p className="text-sm text-zinc-400">{label}</p>
      <div className="mt-2 flex rounded-lg bg-zinc-800 p-1">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className={`flex-1 rounded-md py-2 text-sm capitalize ${
              choice === value ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
            onClick={() => onChange(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
};

// One of the two "what to focus on" choices
const FocusOption = ({ title, description, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      className={`flex-1 rounded-lg border p-3 text-left ${
        isSelected ? "border-zinc-300 bg-zinc-800" : "border-zinc-800 hover:border-zinc-600"
      }`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="block text-sm font-medium text-zinc-100">{title}</span>
      <span className="mt-0.5 block text-xs text-zinc-400">{description}</span>
    </button>
  );
};

// Popup for choosing options before generating flashcards or a quiz
// preset holds the starting values; base is the set it was opened from, if any
const GenerateDialog = ({ type, preset, base, baseMode, weakItems, onGenerate, onClose }) => {
  const [count, setCount] = useState(preset.count);
  const [difficulty, setDifficulty] = useState(preset.difficulty);
  const [instruction, setInstruction] = useState(preset.instruction);
  const [useWeak, setUseWeak] = useState(false);

  const isQuiz = type === "quiz";

  // Closes the popup with the Escape key
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // Sends the chosen options; weak items are only included when that focus is picked
  const handleSubmit = (event) => {
    event.preventDefault();
    onGenerate({
      type,
      count,
      difficulty,
      instruction: instruction.trim(),
      weak: useWeak ? weakItems : [],
    });
  };

  // A short line under the title saying what this popup will make
  let subtitle = "Choose how many items and how hard.";
  if (base && baseMode === "more") {
    subtitle = `More like “${base.title}”.`;
  }
  if (base && baseMode === "harder") {
    subtitle = `A harder take on “${base.title}”.`;
  }

  const weakDescription = isQuiz
    ? `${plural(weakItems.length, "question")} you got wrong`
    : `${plural(weakItems.length, "card")} you're still learning`;

  return (
    // Clicking the dark backdrop closes the popup; on phones it slides up from the bottom
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-title"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-900 p-5 sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="generate-title" className="text-lg font-semibold">
              {isQuiz ? "New quiz" : "New flashcards"}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>
          </div>
          <button
            type="button"
            className="-mt-1 -mr-1 rounded-md p-2.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Only shown when the student has marked cards or missed questions of this type */}
        {weakItems.length > 0 && (
          <div className="mt-5">
            <p className="text-sm text-zinc-400">Focus on</p>
            <div className="mt-2 flex gap-2">
              <FocusOption
                title="New material"
                description="Anything not covered yet"
                isSelected={!useWeak}
                onSelect={() => setUseWeak(false)}
              />
              <FocusOption
                title="My weak spots"
                description={weakDescription}
                isSelected={useWeak}
                onSelect={() => setUseWeak(true)}
              />
            </div>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <ChoiceGroup label={isQuiz ? "Questions" : "Cards"} choices={COUNTS} value={count} onChange={setCount} />
          <ChoiceGroup label="Level" choices={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />

          <div>
            <label htmlFor="instruction" className="text-sm text-zinc-400">
              Directions <span className="text-zinc-600">(optional)</span>
            </label>
            {/* 16px text on phones, so iOS does not zoom in when the field is tapped */}
            <textarea
              id="instruction"
              rows={2}
              maxLength={LIMITS.instructionMax}
              className="mt-2 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-base placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none sm:text-sm"
              placeholder="e.g. only the light reactions, or use real-world examples"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
            <p className="text-right text-xs text-zinc-600">
              {instruction.length}/{LIMITS.instructionMax}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            autoFocus
            className="flex-1 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Generate
          </button>
        </div>
      </form>
    </div>
  );
};

export default GenerateDialog;
