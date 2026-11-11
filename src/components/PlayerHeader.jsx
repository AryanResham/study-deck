// Top bar of the flashcard and quiz players: back button, title, extra buttons
const PlayerHeader = ({ title, subtitle, onBack, children }) => {
  return (
    <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3 md:px-8">
      <button
        type="button"
        className="rounded-lg px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
        onClick={onBack}
      >
        ← Back
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-medium">{title}</h1>
        {subtitle && <p className="truncate text-xs text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
};

export default PlayerHeader;
