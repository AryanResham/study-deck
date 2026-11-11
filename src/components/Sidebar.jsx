import { plural } from "../lib/utils.js";

// Lists projects; on small screens it slides in as a drawer
const Sidebar = ({ projects, selectedId, generations, isOpen, onClose, onSelect, onNew, onDelete }) => {
  // Asks before deleting, because it cannot be undone
  const handleDelete = (project) => {
    if (window.confirm(`Delete "${project.title}" and everything in it?`)) {
      onDelete(project.id);
    }
  };

  return (
    <>
      {/* Dark backdrop behind the drawer on small screens */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform md:static md:w-64 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <span className="text-lg font-semibold tracking-tight">
            Study<span className="text-zinc-500">Deck</span>
          </span>
          <button
            type="button"
            className="rounded-md px-3 py-2 text-zinc-400 hover:bg-zinc-800 md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="px-3">
          <button
            type="button"
            className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
            onClick={onNew}
          >
            + New project
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-2 pb-4">
          {projects.length === 0 && <p className="px-2 text-sm text-zinc-500">No projects yet.</p>}

          {projects.map((project) => {
            const isSelected = project.id === selectedId;
            const isGenerating = generations[project.id]?.status === "loading";
            return (
              <div
                key={project.id}
                className={`group flex items-center rounded-lg ${isSelected ? "bg-zinc-800" : "hover:bg-zinc-800/60"}`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 px-3 py-2 text-left"
                  onClick={() => onSelect(project.id)}
                >
                  <span className="flex items-center gap-2">
                    <span className={`truncate text-sm ${isSelected ? "text-white" : "text-zinc-300"}`}>
                      {project.title}
                    </span>
                    {isGenerating && (
                      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-zinc-300" title="Generating" />
                    )}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {project.source.kind === "notes" ? "Notes" : "Topic"} · {plural(project.artifacts.length, "set")}
                  </span>
                </button>
                <button
                  type="button"
                  className="mr-1 rounded-md px-2.5 py-2.5 text-xs md:px-2 md:py-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                  onClick={() => handleDelete(project)}
                  aria-label={`Delete ${project.title}`}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </nav>

        <p className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">Saved in this browser only.</p>
      </aside>
    </>
  );
};

export default Sidebar;
