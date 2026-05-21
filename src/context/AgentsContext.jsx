import { createContext, useContext, useMemo } from "react";

const AgentsContext = createContext(null);

export function AgentsProvider({ children, agents, setAgents, patchAgent, addAgent }) {
  const value = useMemo(
    () => ({ agents, setAgents, patchAgent, addAgent }),
    [agents, setAgents, patchAgent, addAgent],
  );
  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>;
}

export function useAgents() {
  const ctx = useContext(AgentsContext);
  if (!ctx) {
    throw new Error("useAgents must be used within AgentsProvider");
  }
  return ctx;
}

export function useAgentsOptional() {
  return useContext(AgentsContext);
}
