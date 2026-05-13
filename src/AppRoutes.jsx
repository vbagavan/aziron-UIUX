import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useFlowCatalog } from "@/context/FlowCatalogContext";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PAGE_PATH } from "@/navigation/pagePaths";
import { TENANTS } from "@/data/adminData";
import NewChatPage from "@/components/pages/NewChatPage";
import AgentsListPage from "@/components/pages/AgentsListPage";
import AgentDetailPage from "@/components/pages/AgentDetailPage";
import CreateAgentPage from "@/components/pages/CreateAgentPage";
import { INITIAL_AGENTS } from "@/data/agentsCatalog";
import AgentPage from "@/components/pages/AgentPage";
import KudosPage from "@/components/pages/KudosPage";
import SettingsAppearancePage from "@/components/pages/SettingsAppearancePage";
import FlowsPage from "@/components/pages/FlowsPage";
import NotFoundPage from "@/components/pages/NotFoundPage";
import UsersListPage from "@/components/pages/UsersListPage";
import UserDetailPage from "@/components/pages/UserDetailPage";
import UserGroupsPage from "@/components/pages/UserGroupsPage";
import UsagePage from "@/components/pages/UsagePage";
import VaultPage from "@/components/pages/VaultPage";
import KnowledgeHubPage from "@/components/pages/KnowledgeHubPage";
import MarketplacePage from "@/components/pages/MarketplacePage";
import TenantListPage from "@/components/pages/TenantListPage";
import TenantDetailPage from "@/components/pages/TenantDetailPage";
import TenantCreatePage from "@/components/pages/TenantCreatePage";
import PricingPlansPage from "@/components/pages/PricingPlansPage";
import TenantUsersPage from "@/components/pages/TenantUsersPage";
import PulsePage from "@/components/pages/PulsePage";

const FlowViewPage = lazy(() => import("@/components/pages/FlowViewPage"));

function FlowViewLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-1 items-center justify-center bg-background px-6">
      <p className="text-sm text-muted-foreground">Loading flow editor…</p>
    </div>
  );
}

function useLegacyNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (page, options) => {
      const path = PAGE_PATH[page];
      if (path) navigate(path, options);
      else navigate("/", options);
    },
    [navigate],
  );
}

function FlowViewRoute() {
  const { flowId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { flows, patchFlow, forkFlow } = useFlowCatalog();
  const onNavigate = useLegacyNavigate();
  const flow = flows.find((f) => String(f.id) === String(flowId));
  const intent = location.state?.flowOpenIntent ?? "execute";
  const autoRun = location.state?.autoRun === true;

  const handleForkFlow = useCallback(
    (opts) => {
      const forked = forkFlow(flowId, opts);
      if (forked) navigate(`/flows/${forked.id}`, { state: { flowOpenIntent: "edit" } });
    },
    [forkFlow, flowId, navigate],
  );

  if (!flow) {
    return <Navigate to="/flows" replace />;
  }

  return (
    <Suspense fallback={<FlowViewLoading />}>
      <FlowViewPage
        flow={flow}
        onNavigate={onNavigate}
        flowOpenIntent={intent}
        autoRunFromRoute={autoRun}
        onFlowPatch={patchFlow}
        onForkFlow={handleForkFlow}
      />
    </Suspense>
  );
}

/** Creates a draft via catalog and lands on `/flows/:id` (edit intent). */
function TenantCreateRoute({ onNavigate, onTenantCreated }) {
  const { can } = usePermissions();
  if (!can("tenants.create")) {
    const fallback = can("tenants.view") ? "/tenants/detail" : "/new-chat";
    return <Navigate to={fallback} replace />;
  }
  return <TenantCreatePage onNavigate={onNavigate} onTenantCreated={onTenantCreated} />;
}

function CreateFlowRedirect() {
  const navigate = useNavigate();
  const { createDraftFlow } = useFlowCatalog();
  const initiated = useRef(false);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    const f = createDraftFlow("template");
    navigate(`/flows/${f.id}`, { replace: true, state: { flowOpenIntent: "edit" } });
  }, [createDraftFlow, navigate]);

  return (
    <div className="flex min-h-[40vh] w-full flex-1 items-center justify-center bg-background px-6">
      <p className="text-sm text-muted-foreground">Starting new flow…</p>
    </div>
  );
}

export default function AppRoutes() {
  const navigate = useNavigate();
  const onNavigate = useLegacyNavigate();
  const { auth } = useAuth();

  const isTenantAdmin = auth.role === "tenantadmin";
  // Tenant admins always operate on their own org (Meridian Financial = TENANTS[0])
  const ownTenant = TENANTS[0];

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [viewedAgent, setViewedAgent] = useState(null);
  const [initialMessage, setInitialMessage] = useState("");
  const [viewedUser, setViewedUser] = useState(null);
  const [viewedTenant, setViewedTenant] = useState(isTenantAdmin ? ownTenant : null);

  const openAgent = useCallback((agent) => {
    setSelectedAgent(agent);
    navigate(agent?.name === "Customer Appreciation" ? "/kudos" : "/chat");
  }, [navigate]);

  const viewAgent = useCallback(
    (agent) => {
      setViewedAgent(agent);
      navigate("/agents/detail");
    },
    [navigate],
  );

  const patchAgent = useCallback((id, partial) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...partial } : a)));
    setViewedAgent((prev) => (prev?.id === id ? { ...prev, ...partial } : prev));
  }, []);

  const navigateToEditAgent = useCallback(
    (agent) => {
      navigate(`/agents/${agent.id}/edit`);
    },
    [navigate],
  );

  const startChat = useCallback(
    (message) => {
      setInitialMessage(message);
      setSelectedAgent(null);
      navigate("/chat");
    },
    [navigate],
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/new-chat" replace />} />

      <Route
        path="/new-chat"
        element={<NewChatPage onNavigate={onNavigate} onStartChat={startChat} />}
      />
      <Route
        path="/agents"
        element={
          <AgentsListPage
            onNavigate={onNavigate}
            onOpenAgent={openAgent}
            onViewAgent={viewAgent}
            onEditAgent={navigateToEditAgent}
            agents={agents}
            onAgentsChange={setAgents}
          />
        }
      />
      <Route path="/agents/create" element={<CreateAgentPage onNavigate={onNavigate} agents={agents} onPatchAgent={patchAgent} />} />
      <Route path="/agents/:agentId/edit" element={<CreateAgentPage onNavigate={onNavigate} agents={agents} onPatchAgent={patchAgent} />} />
      <Route
        path="/agents/detail"
        element={
          <AgentDetailPage
            agent={viewedAgent}
            onNavigate={onNavigate}
            onEditAgent={
              viewedAgent ? () => navigate(`/agents/${viewedAgent.id}/edit`) : undefined
            }
          />
        }
      />
      <Route
        path="/chat"
        element={
          <AgentPage agent={selectedAgent} initialMessage={initialMessage} onNavigate={onNavigate} />
        }
      />
      <Route path="/kudos" element={<KudosPage agent={selectedAgent} onNavigate={onNavigate} />} />
      <Route path="/settings" element={<SettingsAppearancePage onNavigate={onNavigate} />} />
      <Route
        path="/notifications"
        element={<SettingsAppearancePage onNavigate={onNavigate} initialSection="notifications" />}
      />

      <Route path="/flows" element={<FlowsPage />} />
      <Route path="/flows/:flowId" element={<FlowViewRoute />} />
      <Route path="/create-flow" element={<CreateFlowRedirect />} />

      <Route
        path="/users"
        element={
          <UsersListPage
            onNavigate={onNavigate}
            onViewUser={(u) => {
              setViewedUser(u);
              navigate("/users/detail");
            }}
          />
        }
      />
      <Route
        path="/users/detail"
        element={<UserDetailPage user={viewedUser} onNavigate={onNavigate} />}
      />
      <Route path="/user-groups" element={<UserGroupsPage onNavigate={onNavigate} />} />
      <Route path="/usage" element={<UsagePage onNavigate={onNavigate} />} />
      <Route path="/vault" element={<VaultPage onNavigate={onNavigate} />} />
      <Route path="/knowledge" element={<KnowledgeHubPage onNavigate={onNavigate} />} />
      <Route
        path="/marketplace"
        element={
          <MarketplacePage
            onNavigate={onNavigate}
            organisationAgents={agents}
            onUnpublishAgent={(agentId) => {
              patchAgent(agentId, { visibility: "private" });
              navigate("/agents");
            }}
          />
        }
      />
      <Route path="/pulse" element={<PulsePage onNavigate={onNavigate} />} />

      <Route
        path="/tenants"
        element={
          isTenantAdmin
            ? <Navigate to="/tenants/detail" replace />
            : <TenantListPage
                onNavigate={onNavigate}
                onViewTenant={(t) => {
                  setViewedTenant(t);
                  navigate("/tenants/detail");
                }}
                onEditTenant={(t) => {
                  setViewedTenant(t);
                  navigate("/tenants/detail?section=settings");
                }}
                onCreateTenant={() => navigate("/tenants/new")}
              />
        }
      />
      <Route
        path="/tenants/detail"
        element={
          <TenantDetailPage
            tenant={isTenantAdmin ? ownTenant : viewedTenant}
            onNavigate={onNavigate}
          />
        }
      />
      <Route
        path="/tenants/new"
        element={
          <TenantCreateRoute
            onNavigate={onNavigate}
            onTenantCreated={(t) => {
              setViewedTenant(t);
              navigate("/tenants/detail");
            }}
          />
        }
      />
      <Route path="/pricing-plans" element={<PricingPlansPage onNavigate={onNavigate} />} />
      <Route path="/tenant-users" element={<TenantUsersPage onNavigate={onNavigate} />} />

      <Route path="*" element={<NotFoundPage onNavigate={onNavigate} />} />
    </Routes>
  );
}
