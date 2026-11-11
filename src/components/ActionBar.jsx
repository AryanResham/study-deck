import { useState } from "react";
import { COUNTS, DIFFICULTIES, LIMITS } from "../../shared/limits.js";

// A row of small toggle buttons, used for count and difficulty
const ChoiceGroup = ({ label, choices, value, onChange, disabled }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="flex rounded-lg bg-zinc-800 p-0.5">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            disabled={disabled}
            className={`rounded-md px-2.5 py-1 text-xs capitalize disabled:opacity-50 ${
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
const ActionBar = ({ disabled, onGenerate }) => {
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [instruction, setInstruction] = useState("");

  // Starts a generation of the chosen type with the current options
  const generate = (type) => {
    onGenerate({ type, count, difficulty, instruction: instruction.trim() });
  };

  const mainButton =
    "rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 flex-1 sm:flex-none";

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:px-8">
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
        </div>

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
          <input
            id="instruction"
            type="text"
            maxLength={LIMITS.instructionMax}
            disabled={disabled}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pr-16 pl-3 text-sm placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none disabled:opacity-50"
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
  );
};

export default ActionBar;
