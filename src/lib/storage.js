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
  items: z.array(cardSchema),
  progress: z.object({
    cards: z.record(z.string(), z.enum(["new", "known", "learning"])),
  }),
});

const quizArtifactSchema = z.object({
  ...artifactFields,
  type: z.literal("quiz"),
  items: z.array(questionSchema),
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

const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
  source: z.object({
    kind: z.enum(["topic", "notes"]),
    text: z.string(),
  }),
  artifacts: z.array(z.discriminatedUnion("type", [flashcardsArtifactSchema, quizArtifactSchema])),
});

// Loads saved projects; broken or old-format projects are skipped instead of crashing the app
export const loadProjects = () => {
  let saved;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    saved = JSON.parse(raw);
  } catch (error) {
    console.warn("Saved projects could not be read.", error);
    return [];
  }

  if (!Array.isArray(saved)) {
    return [];
  }

  const projects = [];
  for (const entry of saved) {
    const result = projectSchema.safeParse(entry);
    if (result.success) {
      projects.push(result.data);
    } else {
      console.warn("Skipped a saved project that failed the checks.", result.error.issues);
    }
  }
  return projects;
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
