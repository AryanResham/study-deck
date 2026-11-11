import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { generateRoute } from "./routes/generate.js";
import { errors, sendError } from "./lib/errors.js";

const app = express();
// API_PORT, not PORT, because some tools set PORT for the frontend dev server
const PORT = process.env.API_PORT || 3001;

// Rejects bodies over 200 KB before they reach the route
app.use(express.json({ limit: "200kb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/generate", generateRoute);

// After `npm run build`, the same server can also serve the frontend
const distFolder = path.resolve("dist");
if (existsSync(distFolder)) {
  app.use(express.static(distFolder));
}

// Turns body errors (too large, broken JSON) into our standard error shape
app.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    sendError(res, errors.inputInvalid("The request is too large (limit 200 KB)."));
    return;
  }
  if (error.type === "entity.parse.failed") {
    sendError(res, errors.inputInvalid("The request body is not valid JSON."));
    return;
  }
  sendError(res, error);
});

app.listen(PORT, () => {
  console.log(`StudyDeck API listening on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY set. Real generation will fail; use ?debug=1 fake scenarios.");
  }
});
