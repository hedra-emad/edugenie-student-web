"use client";

import { createContext, useContext } from "react";

interface SessionContextValue {
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  isAuthenticated: false,
});

export function SessionProvider({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
}) {
  return (
    <SessionContext.Provider value={{ isAuthenticated }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
