"use client";

import { useState, useEffect } from "react";

export function SuccessBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDismiss, 250);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] max-w-sm rounded-[var(--radius)] border border-[var(--ok-bg)] bg-[var(--ok-bg)] px-5 py-3 font-medium text-[var(--ok)] shadow-lg ${
        leaving ? "animate-fade-out" : "animate-fade-rise"
      }`}
    >
      {message}
    </div>
  );
}
