# StudyDeck

Turn a topic or your own notes into **flashcards** and **quizzes**. You flip cards, take quizzes, and re-test the questions you got wrong.

**Live demo:** https://study-deck-0flq.onrender.com (free hosting, so the first load after a quiet period can take up to a minute)

**Video walkthrough of the app:** https://drive.google.com/file/d/1VgPNBAl262pVTr-OtCrKm8UUYecPf-Bp/view?usp=sharing

StudyDeck is a workspace, not a chatbot. You click **Flashcards** or **Quiz**, and the app decides the type and the exact JSON format. The model only fills in the content. The app checks every response before showing it as an interactive card or quiz, never as raw text.

## Setup

Needs Node 22.12 or newer (built and tested on Node 24). The Gemini SDK and Vite both need 22 or newer.

```bash
npm install
cp .env.example .env      # then paste your key into .env
npm start
```

Open http://localhost:5173 (or the address Vite prints, if that port is taken).

- Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) and set `GEMINI_API_KEY` in `.env`.
- The default model is `gemini-3.8-flash`. Set `GEMINI_MODEL` in `.env` to use a different one.
- `npm start` runs the Express API on port 3001 and the Vite dev server together. Vite forwards `/api` to the API, so the key stays on the server and never reaches the browser.
- No key yet? The app still runs. Open it with `?debug=1` and use the fake scenarios (see below).
- To try it on a phone on the same Wi-Fi, run `npm run client -- --host` (with `npm run server` in a second terminal) and open the Network address Vite prints.

## Usage

1. **Create a project.** Type a topic (2–100 characters, so "AI" works), or switch to **Paste notes** (80–20,000 characters). Topic mode also has example topics, and notes mode has a "Use sample notes" button.
2. **Generate.** Click **+ Flashcards** or **+ Quiz**. A popup asks for the number of items (5, 10, or 15), the level, and optional directions such as "only the light reactions". Once you have cards marked "still learning" or missed quiz questions, it also offers **My weak spots**, which makes new items that practise those ideas. A placeholder card shows while it runs, and you can **Cancel** it.
3. **Study.**
   - Flashcards: tap or press Space to flip, use ← → (or swipe on a phone) to move, and mark each card **Got it** (2) or **Still learning** (1). At the end you can review only the cards you are still learning.
   - Quiz: questions and their options are shuffled every round, so a retake never repeats the same order. Press 1–5 or click an answer to see right or wrong at once, with a short explanation. Press Enter for the next question. At the end, **Re-test wrong answers** starts a round with only the missed questions. This needs no AI call.
4. **Follow up.** On any set, **More like this** opens the popup with that set's settings, and **Harder** opens it one level up. You can change anything before generating. Each follow-up is a new set, so progress on old sets is never touched.

Projects are saved in your browser and are still there after a refresh.

### Failure test panel

Open http://localhost:5173/?debug=1. A panel lets you pick a fake backend result for the next generation:

| Scenario                        | What happens                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| OK sample                       | Valid sample set (works with no API key)                                                          |
| Malformed JSON                  | Broken JSON, still broken after the retry → error with Retry                                      |
| Broken, then retry works        | First attempt broken, automatic retry succeeds                                                    |
| Wrong shape                     | Valid JSON with the wrong fields → error with Retry                                               |
| Empty                           | Zero items → error with Retry                                                                     |
| 3 invalid items                 | 3 bad items dropped, the rest kept, with a note on the card                                       |
| Notes have problems             | Valid items plus two note concerns, shown as "Check your notes" on the card (notes projects only) |
| Rejected                        | The model refuses the input → friendly message                                                    |
| Notes too thin or fully covered | "Nothing new to make", with the model's own reason                                                |
| Slow (10s)                      | For testing Cancel and switching projects mid-request                                             |
| Timeout (25s)                   | Backend timeout → error with Retry                                                                |
| Server error                    | 500 → error with Retry                                                                            |

The fake outputs go through the **same** parsing and checks as real model output, so they test the real code. The backend ignores the scenario header when `NODE_ENV=production`.

## How bad AI output is handled

1. **Input limits** are checked in the browser and again on the server, so empty, tiny, or huge input never reaches the model.
2. **JSON mode with a schema.** Gemini is asked for `application/json` with a JSON Schema for the chosen type.
3. **Our own parsing.** The server strips code fences, extracts the `{...}`, and parses it.
4. **Shape check (Zod).** The top level must be `ok`, `rejected`, or `exhausted` with the right fields.
5. **Logic check per item.** The answer must be one of the options, options must be different, and no field may be blank. Bad items are dropped and counted. The good ones are kept.
6. **One automatic retry.** If parsing, the shape check, or "no usable items" fails, the server asks again once and tells the model what went wrong. If that fails too, the user gets `BAD_MODEL_OUTPUT` with a Retry button.
7. **Refusals are valid answers.** The model can reply `rejected` (not study material) or `exhausted` (notes too thin, or every idea already covered) in the same call, with a one-line reason that the app shows. No second "sanity check" call.
8. **In the browser:** a light shape check (in case something else answered, such as an HTML error page), duplicate removal against every item of the same kind in the project (flashcards against flashcards, quiz questions against quiz questions), and a **source check**. In notes mode, each item carries a quote from the notes. If the quote is not in the notes, the item is flagged "⚠ May not be from your notes".
9. **Notes check.** In notes mode, the same call also asks for up to 3 `concerns`: places where the notes contradict themselves or state something clearly false. The model leaves out items about those claims, and the card shows them under "Check your notes". It is a consistency check by the AI, not a guaranteed fact-check.
10. **Timeouts and cancel.** The server gives up after 25 seconds. The browser gives up after 30. Cancel aborts the browser request, and the server notices the closed connection and aborts the model call.
11. **Stale responses.** Each request remembers its project id and is applied to that project only. Switching projects mid-request is safe, a deleted project's response is thrown away, and a cancelled or replaced request is ignored.

## Project structure

```
server/
  index.js              Express app, 200 KB body limit, routes
  routes/generate.js    POST /api/generate: validate → model → parse → check → retry
  generators/           one file per type: prompt, JSON Schema, item check
  lib/llm.js            the only file that talks to Gemini
  lib/parse.js          strip fences, extract and parse JSON
  lib/errors.js         typed errors with HTTP status and retryable flag
  debug.js              fake scenarios for the failure test panel
shared/limits.js        input limits used by both browser and server
src/
  App.jsx               holds all projects and generation state
  components/           sidebar, forms, project view, players
  lib/api.js            fetch, abort, timeout, error mapping
  lib/storage.js        localStorage load/save with Zod checks
  lib/checks.js         duplicate removal and source check
  lib/artifacts.js      builds a saved set from a response
```

## AI usage and time spent

I used Claude Code as my coding agent. I spent around 7 hours on this project, spread over 2 days. The assignment said not to spend more than 8 hours, so I did not implement some features. They are listed under Known limitations and Next steps below.

**Planning (about 2 hours).** The first couple of hours went on deciding the features, finding the problems with them, and working out what to keep and what to cut. I brainstormed with Claude, refining my scattered ideas using the "grill-me" skill to make me justify each choice, so every decision has sound reasoning behind it. After that I decided the architecture, the implementation flow, and the error scenarios to simulate. I had an implementation plan generated, refined it, and checked that it all made sense.

**Implementation (about 30 minutes).** Claude wrote the code from that plan. I gave clear instructions on how the code should be structured and written, to avoid over-engineered code and keep the style consistent across the app. This is the core of how I worked.

**Review and understanding (about 3 hours).** Once the app was built I ran it, looked for potential problems, and listed the edge cases. I then ran a fresh-context review agent to find edge cases I had missed. I also read through the code and ran the app to understand how it works.

**Testing and fixes (about 1 hour).** I tested bad inputs, such as gibberish, a request instead of a topic, and very short topics like "AI" and "ML", and checked that the generation was correct. Some of these caught real issues, which I then fixed.

**Deployment (about 30 minutes).** Putting the app online and checking that it works there.

## Known limitations

**Storage and accounts**

- Data lives in the browser only. Each browser on each device acts as its own separate user, and clearing browser data deletes everything. `localStorage` holds about 5 MB.
- Two open tabs each save their own copy, so the last tab to save wins.
- There are no accounts and no database, so nothing is kept on a server. Data can't sync between devices, and the app has no way to tell which data belongs to which person.
- Saved data that fails the checks on load is set aside: a broken set is dropped from its project, and the original text is copied to the `studydeck-backup-v1` key first.
- A project's notes and title can't be edited after it is created.

**Input**

- Notes are limited to 20,000 characters, and only typed or pasted text works. There is no PDF, PPTX or image import yet. I left this out because of the time limit.
- The source check splits words on spaces, so notes can be flagged "may not be from your notes" even when the quote is there.

**Correctness**

- Topic mode cannot be source-checked, because there are no notes to compare with. The model can get facts wrong. Those projects show "Generated from general knowledge. Verify important facts."
- In notes mode, the source check only shows that the supporting quote exists in the notes. It cannot prove that a question or answer is correct. If the notes say "Ram was the greatest warrior", that becomes the answer, because there is nothing to check it against.
- The notes are trusted as the source. The notes check usually catches clear contradictions and obviously false facts (for example "Berlin is in France"), but subtle mistakes can still end up on a card. The source check will still pass in that case, because the quote really is in the notes.
- Duplicate detection is exact-match after normalising (lowercase, no punctuation). Reworded duplicates can get through.

**Other**

- No streaming. The whole response is checked before anything is shown, so the user waits for the full result.
- No limit on how much one person can generate, so heavy use can use up the API key's quota.
- No automated tests. I tested by hand, with the failure test panel, and with real model output.

## Next steps

- **Editable study notes for topic mode.** First generate study notes from the topic and show them to the user, who can edit them. Then make the flashcards and quizzes from those notes. This gives topic projects a reference base to check against, so they can be source-checked like notes projects. The notes could also be kept as a knowledge base for the project.
- **PDF upload.** Two ways to do it: read the text in the browser (for example with pdf.js) and put it into the notes box, or send the file to the model, have it scan the pages, and write page-by-page notes that come back to the user. Very large or very text-heavy files are the hard part, because of size, time and token limits. They would need splitting into chunks.
- **Accounts and a database,** so data can sync between devices and belongs to a real user.
- **Study features.** Study streaks, spaced repetition, better tracking of weak areas, and export options
- **UI and accessibility.** Light mode and further accessibility improvements.
- **Rate limiting and clear generation limits per user,** so nobody can spam requests and use up the tokens. For example a per-IP limit with `express-rate-limit` before any public deploy.
- **Smaller fixes.** Editable project notes and title, fuzzy duplicate detection, RAG for sources bigger than 20,000 characters, and a study guide as a third kind of set.
