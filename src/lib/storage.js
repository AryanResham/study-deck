import { z } from "zod";

// All projects live under this one key; the version lets us change the format later
const STORAGE_KEY = "studydeck-projects-v1";

// Shapes of saved data, checked when loading

const cardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
  source: z.string().optional(),
  sourceFound: z.boolean().nullable(),
});

const questionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.string(),
  explanation: z.string(),
  source: z.string().optional(),
  sourceFound: z.boolean().nullable(),
});

const artifactFields = {
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
  count: z.number(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  instruction: z.string(),
  messages: z.array(z.string()),
  // Optional, so sets saved before the weak-spots feature still load
  weakFocus: z.boolean().optional(),
};

const flashcardsArtifactSchema = z.object({
  ...artifactFields,
  type: z.literal("flashcards"),
  // At least one item, because the players need something to show
  items: z.array(cardSchema).min(1),
  progress: z.object({
    cards: z.record(z.string(), z.enum(["new", "known", "learning"])),
  }),
});

const quizArtifactSchema = z.object({
  ...artifactFields,
  type: z.literal("quiz"),
  items: z.array(questionSchema).min(1),
  progress: z.object({
    attempts: z.array(
      z.object({
        score: z.number(),
        total: z.number(),
        date: z.number(),
        wrongIds: z.array(z.string()).optional(),
      }),
    ),
  }),
});

const artifactSchema = z.discriminatedUnion("type", [flashcardsArtifactSchema, quizArtifactSchema]);

// Sets are checked one by one, so one broken set does not take its whole project down
const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
  source: z.object({
    kind: z.enum(["topic", "notes"]),
    text: z.string(),
  }),
  artifacts: z.array(z.unknown()),
});

// Where the original saved text is copied when part of it could not be read
const BACKUP_KEY = "studydeck-backup-v1";

const LOAD_WARNING = `It failed the checks, so it was set aside. A copy of the original was kept in this browser under "${BACKUP_KEY}".`;

// Copies the original saved text before the app saves over it
const backUp = (raw) => {
  try {
    localStorage.setItem(BACKUP_KEY, raw);
  } catch (error) {
    console.error("The backup could not be saved.", error);
  }
};

// Loads saved projects and returns { projects, warning }
// A broken set is dropped from its project and a broken project is dropped whole,
// but the original text is backed up first, so nothing is lost for good
export const loadProjects = () => {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    // Some browsers block storage entirely, for example with cookies turned off
    console.warn("Browser storage is not available.", error);
  }
  if (!raw) {
    return { projects: [], warning: null };
  }

  let saved;
  try {
    saved = JSON.parse(raw);
  } catch (error) {
    console.warn("Saved projects could not be read.", error);
    backUp(raw);
    return { projects: [], warning: LOAD_WARNING };
  }

  if (!Array.isArray(saved)) {
    backUp(raw);
    return { projects: [], warning: LOAD_WARNING };
  }

  const projects = [];
  let droppedCount = 0;
  for (const entry of saved) {
    const project = projectSchema.safeParse(entry);
    if (!project.success) {
      console.warn("Skipped a saved project that failed the checks.", project.error.issues);
      droppedCount += 1;
      continue;
    }

    const artifacts = [];
    for (const artifactEntry of project.data.artifacts) {
      const artifact = artifactSchema.safeParse(artifactEntry);
      if (artifact.success) {
        artifacts.push(artifact.data);
      } else {
        console.warn("Skipped a saved set that failed the checks.", artifact.error.issues);
        droppedCount += 1;
      }
    }
    projects.push({ ...project.data, artifacts });
  }

  if (droppedCount > 0) {
    backUp(raw);
    return { projects, warning: LOAD_WARNING };
  }
  return { projects, warning: null };
};

// Saves all projects; returns an error message if the browser storage is full
export const saveProjects = (projects) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return null;
  } catch (error) {
    console.error("Saving projects failed.", error);
    return "Browser storage is full, so recent changes were not saved. Delete old projects to free space.";
  }
};
