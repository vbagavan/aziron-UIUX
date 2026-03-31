import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import NewChatPage from "./components/NewChatPage";
import AgentsListPage from "./components/AgentsListPage";
import AgentPage from "./components/AgentPage";
import AgentDetailPage from "./components/AgentDetailPage";
import KudosPage from "./components/KudosPage";
import SettingsAppearancePage from "./components/SettingsAppearancePage";
import FlowsPage from "./components/FlowsPage";
import FlowViewPage from "./components/FlowViewPage";
import NotFoundPage from "./components/NotFoundPage";
import UsersListPage from "./components/UsersListPage";
import UserDetailPage from "./components/UserDetailPage";
import UserGroupsPage from "./components/UserGroupsPage";

export default function App() {
  const [currentPage, setCurrentPage]   = useState("new-chat");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewedAgent, setViewedAgent]   = useState(null);
  const [initialMessage, setInitialMessage] = useState("");
  const [viewedFlow, setViewedFlow]     = useState(null);
  const [viewedUser, setViewedUser]     = useState(null);

  const navigate = (page) => setCurrentPage(page);

  const openAgent = (agent) => {
    setSelectedAgent(agent);
    setCurrentPage(agent?.name === "Customer Appreciation" ? "kudos" : "chat");
  };

  const viewAgent = (agent) => { setViewedAgent(agent); setCurrentPage("agent-detail"); };

  const viewFlow = (flow) => { setViewedFlow(flow); setCurrentPage("flow-view"); };

  const createFlow = () => {
    setViewedFlow({
      id: Date.now(), name: "Untitled Flow", status: "draft", steps: [], runs: 0,
      success: null, lastRun: "—",
      createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
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
      default: return <NotFoundPage onNavigate={navigate} />;
    }
  })();

  return (
    <SidebarProvider defaultOpen={false}>
      {page}
    </SidebarProvider>
  );
}
