// Pulls the JSON object out of the model's text and parses it
// Returns { ok: true, data } or { ok: false, problem }
export const parseModelText = (text) => {
  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, problem: "The response was empty." };
  }

  // Remove ```json fences in case the model added them
  const withoutFences = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  // Keep only the part from the first { to the last }
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end <= start) {
    return { ok: false, problem: "The response did not contain a JSON object." };
  }

  try {
    const data = JSON.parse(withoutFences.slice(start, end + 1));
    return { ok: true, data };
  } catch (error) {
    return { ok: false, problem: `The response was not valid JSON (${error.message}).` };
  }
};
