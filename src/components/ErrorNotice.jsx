// A message box with optional Retry and Dismiss buttons
// tone "error" is red, "info" is neutral
const ErrorNotice = ({ title, message, tone = "error", onRetry, onDismiss, children }) => {
  const colors =
    tone === "error"
      ? "border-red-500/40 bg-red-500/10 text-red-200"
      : "border-zinc-700 bg-zinc-800/60 text-zinc-200";

  return (
    <div className={`rounded-xl border p-4 ${colors}`} role={tone === "error" ? "alert" : "status"}>
      {title && <p className="font-medium">{title}</p>}
      <p className="mt-1 text-sm opacity-90">{message}</p>
      {children}
      {(onRetry || onDismiss) && (
        <div className="mt-3 flex gap-2">
          {onRetry && (
            <button
              type="button"
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
              onClick={onRetry}
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorNotice;
