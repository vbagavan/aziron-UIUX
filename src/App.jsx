import { useState, Component } from "react";

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding:40, fontFamily:"monospace", background:"#fee2e2", color:"#dc2626", whiteSpace:"pre-wrap" }}>
        <strong>LoginPage Error:</strong>{"\n"}{this.state.error?.message}{"\n\n"}{this.state.error?.stack}
      </div>
    );
    return this.props.children;
  }
}
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/pages/LoginPage";
import NewChatPage from "@/components/pages/NewChatPage";
import AgentsListPage from "@/components/pages/AgentsListPage";
import AgentPage from "@/components/pages/AgentPage";
import AgentDetailPage from "@/components/pages/AgentDetailPage";
import KudosPage from "@/components/pages/KudosPage";
import SettingsAppearancePage from "@/components/pages/SettingsAppearancePage";
import FlowsPage from "@/components/pages/FlowsPage";
import FlowViewPage from "@/components/pages/FlowViewPage";
import NotFoundPage from "@/components/pages/NotFoundPage";
import UsersListPage from "@/components/pages/UsersListPage";
import UserDetailPage from "@/components/pages/UserDetailPage";
import UserGroupsPage from "@/components/pages/UserGroupsPage";
import UsagePage from "@/components/pages/UsagePage";
import VaultPage from "@/components/pages/VaultPage";
import KnowledgeHubPage from "@/components/pages/KnowledgeHubPage";
import TenantListPage from "@/components/pages/TenantListPage";
import TenantDetailPage from "@/components/pages/TenantDetailPage";
import TenantCreatePage from "@/components/pages/TenantCreatePage";
import PricingPlansPage from "@/components/pages/PricingPlansPage";
import TenantUsersPage from "@/components/pages/TenantUsersPage";
import PulsePage from "@/components/pages/PulsePage";

function AppInner() {
  const { auth } = useAuth();
  const [currentPage, setCurrentPage]   = useState("new-chat");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewedAgent, setViewedAgent]   = useState(null);
  const [initialMessage, setInitialMessage] = useState("");
  const [viewedFlow, setViewedFlow]     = useState(null);
  const [viewedUser, setViewedUser]     = useState(null);
  const [viewedTenant, setViewedTenant] = useState(null);

  const navigate = (page) => setCurrentPage(page);

  const openAgent = (agent) => {
    setSelectedAgent(agent);
    setCurrentPage(agent?.name === "Customer Appreciation" ? "kudos" : "chat");
  };

  const viewAgent = (agent) => { setViewedAgent(agent); setCurrentPage("agent-detail"); };

  const viewFlow = (flow) => { setViewedFlow(flow); setCurrentPage("flow-view"); };

  /** @param {"scratch" | "template"} entry How the user chose to start the new flow (from Flows list). */
  const createFlow = (entry = "template") => {
    setViewedFlow({
      id: Date.now(), name: "Untitled Flow", status: "draft", steps: [], runs: 0,
      success: null, lastRun: "—",
      createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      creationEntry: entry === "scratch" ? "scratch" : "template",
    });
    setCurrentPage("flow-view");
  };

  const startChat = (message) => { setInitialMessage(message); setSelectedAgent(null); setCurrentPage("chat"); };

  const page = (() => {
    switch (currentPage) {
      case "new-chat":    return <NewChatPage onNavigate={navigate} onStartChat={startChat} />;
      case "agents":      return <AgentsListPage onNavigate={navigate} onOpenAgent={openAgent} onViewAgent={viewAgent} />;
      case "agent-detail":return <AgentDetailPage agent={viewedAgent} onNavigate={navigate} />;
      case "chat":        return <AgentPage agent={selectedAgent} initialMessage={initialMessage} onNavigate={navigate} />;
      case "kudos":       return <KudosPage agent={selectedAgent} onNavigate={navigate} />;
      case "settings":     return <SettingsAppearancePage onNavigate={navigate} />;
      case "notifications":return <SettingsAppearancePage onNavigate={navigate} initialSection="notifications" />;
      case "flows":       return <FlowsPage onNavigate={navigate} onViewFlow={viewFlow} onCreateFlow={createFlow} />;
      case "flow-view":   return <FlowViewPage flow={viewedFlow} onNavigate={navigate} />;
      case "users-list":  return <UsersListPage onNavigate={navigate} onViewUser={u=>{ setViewedUser(u); setCurrentPage("user-detail"); }} />;
      case "user-groups": return <UserGroupsPage onNavigate={navigate} />;
      case "user-detail": return <UserDetailPage user={viewedUser} onNavigate={navigate} />;
      case "usage":       return <UsagePage onNavigate={navigate} />;
      case "vault":       return <VaultPage onNavigate={navigate} />;
      case "knowledge":   return <KnowledgeHubPage onNavigate={navigate} />;
      case "pulse":       return <PulsePage onNavigate={navigate} />;
      case "tenants":       return <TenantListPage onNavigate={navigate} onViewTenant={t=>{ setViewedTenant(t); setCurrentPage("tenant-detail"); }} onCreateTenant={()=>setCurrentPage("tenant-create")} />;
      case "tenant-detail": return <TenantDetailPage tenant={viewedTenant} onNavigate={navigate} />;
      case "tenant-create": return <TenantCreatePage onNavigate={navigate} onTenantCreated={t=>{ setViewedTenant(t); setCurrentPage("tenant-detail"); }} />;
      case "pricing-plans": return <PricingPlansPage onNavigate={navigate} />;
      case "tenant-users":  return <TenantUsersPage  onNavigate={navigate} />;
      default: return <NotFoundPage onNavigate={navigate} />;
    }
  })();

  if (!auth.isAuthenticated) return <ErrorBoundary><LoginPage /></ErrorBoundary>;

  return (
    <SidebarProvider defaultOpen={false}>
      {page}
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
