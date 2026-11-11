import { Plus } from "lucide-react";

// The Flashcards / Quiz buttons at the bottom of a project; each opens the generate popup
const ActionBar = ({ disabled, onOpen }) => {
  const mainButton =
    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:py-2.5";

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 md:px-8">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          className={`${mainButton} bg-zinc-100 text-zinc-900 hover:bg-white`}
          onClick={() => onOpen("flashcards")}
        >
          <Plus size={16} />
          Flashcards
        </button>
        <button
          type="button"
          disabled={disabled}
          className={`${mainButton} border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800`}
          onClick={() => onOpen("quiz")}
        >
          <Plus size={16} />
          Quiz
        </button>
      </div>
    </div>
  );
};

export default ActionBar;
