import { useState } from "react";
import { ChevronDown, ChevronUp, Menu } from "lucide-react";
import ActionBar from "./ActionBar.jsx";
import ArtifactCard from "./ArtifactCard.jsx";
import PendingCard from "./PendingCard.jsx";
import FlashcardPlayer from "./FlashcardPlayer.jsx";
import QuizPlayer from "./QuizPlayer.jsx";
import GenerateDialog from "./GenerateDialog.jsx";
import { getHarderDifficulty, getWeakItems } from "../lib/artifacts.js";
import { plural } from "../lib/utils.js";

// One project: its source, its flashcard sets and quizzes, and the action bar
const ProjectView = ({
  project,
  generation,
  onOpenSidebar,
  onGenerate,
  onCancel,
  onDismiss,
  onUpdateArtifact,
  onDeleteArtifact,
}) => {
  const [openArtifactId, setOpenArtifactId] = useState(null);
  const [showSource, setShowSource] = useState(false);
  // The generate popup: null when closed, otherwise what it should start with
  const [dialog, setDialog] = useState(null);
  // The last count and level used, so the next popup starts with them
  const [lastSettings, setLastSettings] = useState({ count: 10, difficulty: "medium" });

  const isLoading = generation?.status === "loading";
  const openArtifact = project.artifacts.find((artifact) => artifact.id === openArtifactId);

  // Opens the popup for a brand new set
  const openNewDialog = (type) => {
    setDialog({ type, preset: { ...lastSettings, instruction: "" }, base: null, baseMode: null });
  };

  // Opens the popup filled in from an existing set: same settings, or one level harder
  const openFollowUpDialog = (artifact, baseMode) => {
    const difficulty = baseMode === "harder" ? getHarderDifficulty(artifact.difficulty) : artifact.difficulty;
    setDialog({
      type: artifact.type,
      preset: { count: artifact.count, difficulty, instruction: artifact.instruction },
      base: artifact,
      baseMode,
    });
  };

  // Closes the popup and starts the generation
  const generateFromDialog = (options) => {
    setDialog(null);
    setLastSettings({ count: options.count, difficulty: options.difficulty });
    onGenerate(options);
  };

  // A player takes over the whole area while it is open
  if (openArtifact) {
    const saveProgress = (progress) => onUpdateArtifact(openArtifact.id, { progress });
    const close = () => setOpenArtifactId(null);
    if (openArtifact.type === "quiz") {
      return <QuizPlayer artifact={openArtifact} onProgress={saveProgress} onBack={close} />;
    }
    return <FlashcardPlayer artifact={openArtifact} onProgress={saveProgress} onBack={close} />;
  }

  const isNotes = project.source.kind === "notes";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <header className="border-b border-zinc-800 px-4 py-4 md:px-8 md:py-6">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-zinc-300 hover:bg-zinc-800 md:hidden"
              onClick={onOpenSidebar}
              aria-label="Open projects"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">{project.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                <span>{isNotes ? `Notes · ${project.source.text.length.toLocaleString()} characters` : "Topic"}</span>
                <span>{plural(project.artifacts.length, "set")}</span>
                {isNotes && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 py-1 text-zinc-300 hover:text-white"
                    onClick={() => setShowSource(!showSource)}
                    aria-expanded={showSource}
                  >
                    {showSource ? "Hide notes" : "Show notes"}
                    {showSource ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {showSource && (
            <p className="mt-4 max-h-64 overflow-y-auto rounded-lg bg-zinc-900 p-4 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
              {project.source.text}
            </p>
          )}
          {!isNotes && (
            <p className="mt-3 text-xs text-zinc-500">
              Generated from general knowledge. Verify important facts.
            </p>
          )}
        </header>

        <section className="px-4 py-6 md:px-8">
          {project.artifacts.length === 0 && !generation && (
            <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-12 text-center">
              <p className="font-medium text-zinc-200">Nothing here yet</p>
              <p className="mt-1 text-sm text-zinc-400">
                Choose <span className="text-zinc-200">Flashcards</span> or <span className="text-zinc-200">Quiz</span>{" "}
                below to make your first set.
              </p>
            </div>
          )}

          {/* grid-cols-1 caps the phone column at the screen width, so long text cannot push cards off-screen */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {project.artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                isBusy={isLoading}
                onOpen={() => setOpenArtifactId(artifact.id)}
                onMoreLikeThis={() => openFollowUpDialog(artifact, "more")}
                onHarder={() => openFollowUpDialog(artifact, "harder")}
                onDelete={() => onDeleteArtifact(artifact.id)}
              />
            ))}
            {generation && (
              <PendingCard
                generation={generation}
                onCancel={onCancel}
                onRetry={() => onGenerate(generation.options)}
                onDismiss={onDismiss}
              />
            )}
          </div>
        </section>
      </div>

      <ActionBar disabled={isLoading} onOpen={openNewDialog} />

      {dialog && (
        <GenerateDialog
          type={dialog.type}
          preset={dialog.preset}
          base={dialog.base}
          baseMode={dialog.baseMode}
          weakItems={getWeakItems(project, dialog.type)}
          onGenerate={generateFromDialog}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
};

export default ProjectView;
