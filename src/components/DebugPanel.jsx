// Fake backend results, matching server/debug.js
const SCENARIOS = [
  { id: "", label: "Real model" },
  { id: "ok", label: "OK sample" },
  { id: "malformed_json", label: "Malformed JSON" },
  { id: "retry_recovers", label: "Broken, then retry works" },
  { id: "wrong_shape", label: "Wrong shape" },
  { id: "empty", label: "Empty" },
  { id: "partial_invalid", label: "3 invalid items" },
  { id: "concerns", label: "Notes have problems" },
  { id: "rejected", label: "Rejected" },
  { id: "exhausted", label: "Notes covered" },
  { id: "slow", label: "Slow (10s)" },
  { id: "timeout", label: "Timeout (25s)" },
  { id: "server_error", label: "Server error" },
];

// Failure test panel, opened with ?debug=1; the next generations use the chosen fake result
const DebugPanel = ({ scenario, onChange }) => {
  return (
    <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 md:px-8">
      <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
        Failure test panel · next generation uses: {scenario || "real model"}
      </p>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
        {SCENARIOS.map((item) => (
          <button
            key={item.id || "real"}
            type="button"
            className={`shrink-0 rounded-md px-2.5 py-1 text-xs ${
              item.id === scenario ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DebugPanel;
