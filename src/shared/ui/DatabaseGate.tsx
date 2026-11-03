import { useEffect, useState, type ReactNode } from "react";

import { getDatabase } from "@/core/database/database";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Screen } from "@/shared/ui/Screen";

type GateStatus = "loading" | "ready" | "error";

/**
 * Opens and migrates the database before any screen queries it. A failure is
 * shown as recoverable instead of rendering a fake empty library.
 */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    void getDatabase()
      .then(() => {
        if (!cancelled) {
          setStatus("ready");
        }
      })
      .catch((error: unknown) => {
        console.warn("Could not initialise the local library.", error);
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (status === "error") {
    return (
      <Screen>
        <ErrorState
          message="Paperclip could not open its local library. Your saved data was not changed."
          onRetry={() => setAttempt((value) => value + 1)}
        />
      </Screen>
    );
  }

  if (status === "loading") {
    return (
      <Screen>
        <LoadingState message="Opening your library…" />
      </Screen>
    );
  }

  return children;
}
