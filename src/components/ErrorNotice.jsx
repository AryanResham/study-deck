// A message box with optional Retry and Dismiss buttons
// tone "error" is red, "info" is neutral
const ErrorNotice = ({ title, message, tone = "error", onRetry, onDismiss, children }) => {
  const colors =
    tone === "error"
      ? "border-zinc-600 bg-zinc-900 text-zinc-100"
      : "border-zinc-800 bg-zinc-900 text-zinc-200";

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
              className="rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium sm:px-3 sm:py-1.5 text-zinc-900 hover:bg-white"
              onClick={onRetry}
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="rounded-lg px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 sm:px-3 sm:py-1.5"
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
