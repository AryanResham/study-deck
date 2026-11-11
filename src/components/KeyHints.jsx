// Keyboard shortcuts shown under a player, hidden on phones
// Each shortcut stays on one line, and the row wraps between shortcuts
const KeyHints = ({ hints }) => {
  return (
    <div className="mt-6 hidden flex-wrap justify-center gap-x-5 gap-y-2 pb-4 text-xs text-zinc-500 md:flex">
      {hints.map((hint) => (
        <span key={hint.label} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <kbd className="inline-flex items-center gap-0.5 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-sans text-[11px] text-zinc-300">
            {hint.keys}
          </kbd>
          {hint.label}
        </span>
      ))}
    </div>
  );
};

export default KeyHints;
