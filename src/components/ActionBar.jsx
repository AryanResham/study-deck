import { useState } from "react";
import { COUNTS, DIFFICULTIES, LIMITS } from "../../shared/limits.js";

// A row of toggle buttons, used for count and difficulty
// Buttons are taller on phones so they are easy to tap
const ChoiceGroup = ({ label, choices, value, onChange, disabled }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-xs text-zinc-500 lg:w-auto">{label}</span>
      <div className="flex rounded-lg bg-zinc-800 p-0.5">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            disabled={disabled}
            className={`rounded-md px-3 py-2 text-sm capitalize disabled:opacity-50 sm:px-2.5 sm:py-1 sm:text-xs ${
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

// The Flashcards / Quiz buttons with their options
// On small screens the options fold away behind a toggle, to leave room for the content
const ActionBar = ({ disabled, onGenerate }) => {
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [instruction, setInstruction] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  // Starts a generation of the chosen type with the current options
  const generate = (type) => {
    setShowOptions(false);
    onGenerate({ type, count, difficulty, instruction: instruction.trim() });
  };

  const mainButton =
    "flex-1 rounded-lg px-3 py-3 text-sm font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-4 sm:py-2.5";

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 md:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            className={`${mainButton} bg-zinc-100 text-zinc-900 hover:bg-white`}
            onClick={() => generate("flashcards")}
          >
            + Flashcards
          </button>
          <button
            type="button"
            disabled={disabled}
            className={`${mainButton} border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800`}
            onClick={() => generate("quiz")}
          >
            + Quiz
          </button>
          {/* Only on small screens: opens the options */}
          <button
            type="button"
            className="shrink-0 rounded-lg px-3 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 lg:hidden"
            onClick={() => setShowOptions(!showOptions)}
            aria-expanded={showOptions}
          >
            Options {showOptions ? "▴" : "▾"}
          </button>
        </div>

        <div className={`${showOptions ? "flex" : "hidden"} flex-col gap-3 lg:flex lg:flex-1 lg:flex-row lg:items-center`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ChoiceGroup label="Items" choices={COUNTS} value={count} onChange={setCount} disabled={disabled} />
            <ChoiceGroup
              label="Level"
              choices={DIFFICULTIES}
              value={difficulty}
              onChange={setDifficulty}
              disabled={disabled}
            />
          </div>

          <div className="relative flex-1">
            <label htmlFor="instruction" className="sr-only">
              Optional focus
            </label>
            {/* 16px text on phones, so iOS does not zoom in when the field is tapped */}
            <input
              id="instruction"
              type="text"
              maxLength={LIMITS.instructionMax}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pr-16 pl-3 text-base placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none disabled:opacity-50 sm:py-2 sm:text-sm"
              placeholder="Optional focus, e.g. only the light reactions"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-zinc-500">
              {instruction.length}/{LIMITS.instructionMax}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
