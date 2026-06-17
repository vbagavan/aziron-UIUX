import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import {
  KNOWLEDGE_TABS,
  KNOWLEDGE_TAB_PANEL_PREFIX,
  KnowledgeTabBar,
} from "@/components/features/knowledge/KnowledgeTabBar";
import KnowledgeHubPage from "@/components/pages/KnowledgeHubPage";
import DocumentsPage from "@/components/pages/DocumentsPage";
import { panelIdForTab } from "@/components/common/PageUnderlineTabs";
import { cn } from "@/lib/utils";

export const KNOWLEDGE_MAIN_ID = "knowledge-main-content";

export function DocumentsRouteRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("tab", KNOWLEDGE_TABS.documents);
  return <Navigate to={`/knowledge?${params.toString()}`} replace />;
}

function tabFromSearchParams(searchParams) {
  return searchParams.get("tab") === KNOWLEDGE_TABS.documents
    ? KNOWLEDGE_TABS.documents
    : KNOWLEDGE_TABS.hubs;
}

export default function KnowledgePage({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hubsHeaderSlot, setHubsHeaderSlot] = useState(null);
  const [activeTab, setActiveTab] = useState(() => tabFromSearchParams(searchParams));

  useEffect(() => {
    setActiveTab(tabFromSearchParams(searchParams));
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tab, opts = {}) => {
      setActiveTab(tab);

      const next = new URLSearchParams(searchParams);
      const onHubDetailRoute = /^\/knowledge\/[^/]+/.test(location.pathname);

      if (tab === KNOWLEDGE_TABS.documents) {
        next.set("tab", KNOWLEDGE_TABS.documents);
        if (opts.linkHub) {
          next.set("linkHub", String(opts.linkHub));
        }
        const query = next.toString();
        setSearchParams(next, { replace: true });
        if (onHubDetailRoute) {
          navigate(query ? `/knowledge?${query}` : "/knowledge");
        }
        return;
      }

      next.delete("tab");
      next.delete("linkHub");
      const query = next.toString();

      if (opts.hubId) {
        navigate(`/knowledge/${opts.hubId}${query ? `?${query}` : ""}`);
        return;
      }

      if (onHubDetailRoute) {
        navigate(query ? `/knowledge?${query}` : "/knowledge");
        return;
      }

      setSearchParams(next, { replace: true });
    },
    [location.pathname, navigate, searchParams, setSearchParams],
  );

  const handleTabBarChange = useCallback(
    (tab) => {
      handleTabChange(tab);
    },
    [handleTabChange],
  );

  const headerSlot = activeTab === KNOWLEDGE_TABS.hubs ? hubsHeaderSlot : null;

  const hubsActive = activeTab === KNOWLEDGE_TABS.hubs;
  const documentsActive = activeTab === KNOWLEDGE_TABS.documents;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <a
        href={`#${KNOWLEDGE_MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        Skip to Knowledge content
      </a>
      <Sidebar activePage="knowledge" onNavigate={onNavigate} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader activePage="knowledge" onNavigate={onNavigate}>
          {headerSlot}
        </AppHeader>

        <KnowledgeTabBar
          activeTab={activeTab}
          onTabChange={handleTabBarChange}
          className="relative z-20"
        />

        <div id={KNOWLEDGE_MAIN_ID} className="relative z-0 min-h-0 flex-1 overflow-hidden">
          <div
            id={panelIdForTab(KNOWLEDGE_TAB_PANEL_PREFIX, KNOWLEDGE_TABS.hubs)}
            role="tabpanel"
            aria-labelledby={`${KNOWLEDGE_TAB_PANEL_PREFIX}-tab-${KNOWLEDGE_TABS.hubs}`}
            className={cn(
              "absolute inset-0 flex flex-col overflow-hidden",
              hubsActive ? "z-10" : "pointer-events-none invisible z-0",
            )}
            aria-hidden={!hubsActive}
            inert={!hubsActive}
            tabIndex={hubsActive ? 0 : -1}
          >
            <KnowledgeHubPage
              embedded
              onNavigate={onNavigate}
              onHeaderSlot={setHubsHeaderSlot}
              onRequestTab={handleTabChange}
            />
          </div>

          <div
            id={panelIdForTab(KNOWLEDGE_TAB_PANEL_PREFIX, KNOWLEDGE_TABS.documents)}
            role="tabpanel"
            aria-labelledby={`${KNOWLEDGE_TAB_PANEL_PREFIX}-tab-${KNOWLEDGE_TABS.documents}`}
            className={cn(
              "absolute inset-0 flex flex-col overflow-hidden",
              documentsActive ? "z-10" : "pointer-events-none invisible z-0",
            )}
            aria-hidden={!documentsActive}
            inert={!documentsActive}
            tabIndex={documentsActive ? 0 : -1}
          >
            <DocumentsPage
              embedded
              onNavigate={onNavigate}
              onRequestTab={handleTabChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
