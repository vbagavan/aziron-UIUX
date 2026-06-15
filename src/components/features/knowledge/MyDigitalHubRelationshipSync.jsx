import { useEffect } from "react";
import { useAgents } from "@/context/AgentsContext";
import { useFlowCatalog } from "@/context/FlowCatalogContext";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import {
  MYDIGITALHUB_AGENT_IDS,
  MYDIGITALHUB_FLOW_IDS,
  findMyDigitalHub,
  myDigitalHubAgentsLinked,
  withHubId,
} from "@/lib/myDigitalHubLinks";
import { agentUsesHub } from "@/lib/agentKnowledge";
import { flowUsesHub } from "@/lib/workflowKnowledge";

/** Links MyDigitalHub agents/workflows to the workspace hub (by name). */
export function MyDigitalHubRelationshipSync() {
  const { hubs } = useKnowledgeHubs();
  const { agents, patchAgent } = useAgents();
  const { flows, patchFlow } = useFlowCatalog();

  useEffect(() => {
    const hub = findMyDigitalHub(hubs);
    if (!hub) return;

    const hubId = hub.id;
    const seedAgentsPresent = MYDIGITALHUB_AGENT_IDS.some((id) =>
      agents.some((a) => a.id === id),
    );
    if (!seedAgentsPresent) return;

    if (myDigitalHubAgentsLinked(hubId, agents)) {
      for (const flowId of MYDIGITALHUB_FLOW_IDS) {
        const flow = flows.find((f) => f.id === flowId);
        if (!flow || flowUsesHub(flow, hubId)) continue;
        patchFlow(flowId, { knowledgeHubs: withHubId(flow.knowledgeHubs, hubId) });
      }
      return;
    }

    for (const agentId of MYDIGITALHUB_AGENT_IDS) {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent || agentUsesHub(agent, hubId)) continue;
      patchAgent(agentId, {
        knowledgeHubs: withHubId(agent.knowledgeHubs, hubId),
        ragMode: agent.ragMode ?? true,
      });
    }

    for (const flowId of MYDIGITALHUB_FLOW_IDS) {
      const flow = flows.find((f) => f.id === flowId);
      if (!flow || flowUsesHub(flow, hubId)) continue;
      patchFlow(flowId, { knowledgeHubs: withHubId(flow.knowledgeHubs, hubId) });
    }
  }, [hubs, agents, flows, patchAgent, patchFlow]);

  return null;
}
