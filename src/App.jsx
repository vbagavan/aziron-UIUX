import { useState } from "react";
import NewChatPage from "./components/NewChatPage";
import AgentsListPage from "./components/AgentsListPage";
import AgentPage from "./components/AgentPage";
import AgentDetailPage from "./components/AgentDetailPage";
import KudosPage from "./components/KudosPage";
import SettingsAppearancePage from "./components/SettingsAppearancePage";
import NotificationsPage from "./components/NotificationsPage";
import FlowsPage from "./components/FlowsPage";
import FlowViewPage from "./components/FlowViewPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("new-chat"); // first screen after login
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewedAgent, setViewedAgent] = useState(null);
  const [initialMessage, setInitialMessage] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // shared across all pages
  const [viewedFlow, setViewedFlow] = useState(null);

  const navigate = (page) => {
    setCurrentPage(page);
  };

  const openAgent = (agent) => {
    setSelectedAgent(agent);
    // Customer Appreciation uses the dedicated Kudos flow
    if (agent?.name === "Customer Appreciation") {
      setCurrentPage("kudos");
    } else {
      setCurrentPage("chat");
    }
  };

  const viewAgent = (agent) => {
    setViewedAgent(agent);
    setCurrentPage("agent-detail");
  };

  const viewFlow = (flow) => {
    setViewedFlow(flow);
    setCurrentPage("flow-view");
  };

  const createFlow = () => {
    setViewedFlow({
      id: Date.now(),
      name: "Untitled Flow",
      status: "draft",
      steps: [],
      runs: 0,
      success: null,
      lastRun: "—",
      createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    });
    setCurrentPage("flow-view");
  };

  const startChat = (message) => {
    setInitialMessage(message);
    setSelectedAgent(null);
    setCurrentPage("chat");
  };

  const sharedSidebarProps = {
    sidebarCollapsed,
    onToggleSidebar: () => setSidebarCollapsed((v) => !v),
  };

  if (currentPage === "new-chat") {
    return <NewChatPage onNavigate={navigate} onStartChat={startChat} {...sharedSidebarProps} />;
  }

  if (currentPage === "agents") {
    return <AgentsListPage onNavigate={navigate} onOpenAgent={openAgent} onViewAgent={viewAgent} {...sharedSidebarProps} />;
  }

  if (currentPage === "agent-detail") {
    return (
      <AgentDetailPage
        agent={viewedAgent}
        onNavigate={navigate}
        {...sharedSidebarProps}
      />
    );
  }

  if (currentPage === "chat") {
    return (
      <AgentPage
        agent={selectedAgent}
        initialMessage={initialMessage}
        onNavigate={navigate}
        {...sharedSidebarProps}
      />
    );
  }

  if (currentPage === "kudos") {
    return (
      <KudosPage
        agent={selectedAgent}
        onNavigate={navigate}
        {...sharedSidebarProps}
      />
    );
  }

  if (currentPage === "settings") {
    return <SettingsAppearancePage onNavigate={navigate} {...sharedSidebarProps} />;
  }

  if (currentPage === "notifications") {
    return <NotificationsPage onNavigate={navigate} {...sharedSidebarProps} />;
  }

  if (currentPage === "flows") {
    return <FlowsPage onNavigate={navigate} onViewFlow={viewFlow} onCreateFlow={createFlow} {...sharedSidebarProps} />;
  }

  if (currentPage === "flow-view") {
    return <FlowViewPage flow={viewedFlow} onNavigate={navigate} {...sharedSidebarProps} />;
  }

  // 404 — unhandled page
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc] flex-col gap-4">
      <p className="text-5xl font-bold text-[#e2e8f0]">404</p>
      <p className="text-base text-[#64748b]">Page not found</p>
      <button
        onClick={() => navigate("new-chat")}
        className="mt-2 px-4 h-9 rounded-[8px] bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
      >
        Go home
      </button>
    </div>
  );
}
