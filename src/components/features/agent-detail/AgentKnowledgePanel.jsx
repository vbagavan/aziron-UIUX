import { Link } from "react-router-dom";
import { Database } from "lucide-react";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { agentHubFileIds } from "@/lib/agentKnowledge";

export default function AgentKnowledgePanel({ agent }) {
  const { hubs } = useKnowledgeHubs();
  const hubIds = agent?.knowledgeHubs ?? [];

  if (hubIds.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 dark:border-border dark:bg-card">
        <h3 className="text-base font-bold text-foreground dark:text-foreground">Knowledge Hubs</h3>
        <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
          No knowledge bases are attached. Edit this agent to attach hubs for retrieval.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 dark:border-border dark:bg-card">
      <h3 className="text-base font-bold text-foreground dark:text-foreground">Knowledge Hubs</h3>
      <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
        Bases this agent uses for retrieval
        {agent.ragMode ? " (RAG enabled)" : ""}.
      </p>
      <ul className="mt-4 space-y-3">
        {hubIds.map((id) => {
          const hub = hubs.find((h) => h.id === id || h.id === Number(id));
          const scope = agentHubFileIds(agent, id);
          return (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 dark:border-border"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Database size={16} className="shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground dark:text-foreground">
                    {hub?.name ?? `Hub #${id}`}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {scope.length > 0
                      ? `${scope.length} file${scope.length === 1 ? "" : "s"} scoped`
                      : "Full hub access"}
                  </p>
                </div>
              </div>
              {hub && (
                <Link
                  to={`/knowledge/${hub.id}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open hub
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
