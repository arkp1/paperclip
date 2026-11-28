import { useEffect, useState } from "react";

import { AppDialog } from "@/shared/ui/AppDialog";
import { Button } from "@/shared/ui/Button";

export type AppAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type AppAlertRequest = {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
};

type Listener = (request: AppAlertRequest) => void;

let listener: Listener | null = null;

/** App-themed replacement for React Native's Alert.alert. */
export const appAlert = {
  alert(
    title: string,
    message?: string,
    buttons?: AppAlertButton[]
  ): void {
    listener?.({ title, message, buttons });
  },
};

export function AppAlertHost() {
  const [request, setRequest] = useState<AppAlertRequest | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    listener = (next) => {
      setRequest(next);
      setVisible(true);
    };
    return () => {
      listener = null;
    };
  }, []);

  const buttons =
    request?.buttons && request.buttons.length > 0
      ? request.buttons
      : request
        ? [{ text: "OK", style: "default" as const }]
        : [];

  const close = (button: AppAlertButton) => {
    setVisible(false);
    button.onPress?.();
  };

  return (
    <AppDialog
      visible={visible}
      onRequestClose={() => {
        const cancel = buttons.find((button) => button.style === "cancel");
        if (cancel) {
          close(cancel);
        } else {
          setVisible(false);
        }
      }}
      title={request?.title}
      description={request?.message}
      actions={
        <>
          {buttons.map((button, index) => (
            <Button
              key={`${button.text}-${index}`}
              label={button.text}
              variant={
                button.style === "destructive"
                  ? "destructive"
                  : button.style === "cancel"
                    ? "text"
                    : "filled"
              }
              disabled={!visible}
              onPress={() => close(button)}
            />
          ))}
        </>
      }
    />
  );
}
