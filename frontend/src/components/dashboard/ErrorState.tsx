import { AlertTriangle, X } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorState({ message, onDismiss }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition" aria-label="Dismiss error">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
export default ErrorState;
