import React, { createContext, useContext, useCallback, useState, ReactNode } from "react";

interface LoggedFeedbackContextType {
  showLogged: (actionName: string, icon?: string) => void;
}

const LoggedFeedbackContext = createContext<LoggedFeedbackContextType | undefined>(undefined);

export function LoggedFeedbackProvider({ children }: { children: ReactNode }) {
  const [loggedActionName, setLoggedActionName] = useState<string | null>(null);
  const [showLoggedFeedback, setShowLoggedFeedback] = useState(false);
  const [loggedIcon, setLoggedIcon] = useState<string>("check-circle");

  const showLogged = useCallback((actionName: string, icon: string = "check-circle") => {
    setLoggedActionName(actionName);
    setLoggedIcon(icon);
    setShowLoggedFeedback(true);
  }, []);

  return (
    <LoggedFeedbackContext.Provider value={{ showLogged }}>
      {children}
      <LoggedFeedbackProxy
        visible={showLoggedFeedback}
        actionName={loggedActionName || "Logged"}
        icon={loggedIcon}
        onHide={() => setShowLoggedFeedback(false)}
      />
    </LoggedFeedbackContext.Provider>
  );
}

export function useLoggedFeedback() {
  const context = useContext(LoggedFeedbackContext);
  if (!context) {
    throw new Error("useLoggedFeedback must be used within a LoggedFeedbackProvider");
  }
  return context;
}

// Minimal proxy component to avoid circular imports
function LoggedFeedbackProxy({
  visible,
  actionName,
  icon,
  onHide,
}: {
  visible: boolean;
  actionName: string;
  icon: string;
  onHide: () => void;
}) {
  const { LoggedFeedback } = require("@/components/LoggedFeedback");
  return (
    <LoggedFeedback
      visible={visible}
      actionName={actionName}
      icon={icon}
      duration={2500}
      onHide={onHide}
    />
  );
}
