import { useParams } from "react-router-dom";
import { Navigate, useLocation } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import KnowledgeHubPage from "@/components/pages/KnowledgeHubPage";
import { KnowledgeWorkspace } from "@/components/features/knowledge/KnowledgeWorkspace";
import { ReaderHeaderProvider } from "@/context/ReaderHeaderContext";

export const KNOWLEDGE_MAIN_ID = "knowledge-main-content";

export function DocumentsRouteRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.delete("tab");
  const query = params.toString();
  return <Navigate to={query ? `/knowledge?${query}` : "/knowledge"} replace />;
}

export default function KnowledgePage({ onNavigate }) {
  const { hubId } = useParams();

  if (hubId) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <a
          href={`#${KNOWLEDGE_MAIN_ID}`}
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
        >
          Skip to Knowledge content
        </a>
        <Sidebar activePage="knowledge" onNavigate={onNavigate} />

        <ReaderHeaderProvider>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <AppHeader activePage="knowledge" onNavigate={onNavigate} />

            <div
              id={KNOWLEDGE_MAIN_ID}
              className="relative z-0 min-h-0 flex-1 overflow-hidden"
            >
              <KnowledgeHubPage embedded onNavigate={onNavigate} />
            </div>
          </div>
        </ReaderHeaderProvider>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <a
        href={`#${KNOWLEDGE_MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        Skip to Knowledge content
      </a>
      <Sidebar activePage="knowledge" onNavigate={onNavigate} />

      <ReaderHeaderProvider>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader activePage="knowledge" onNavigate={onNavigate} />

          <div
            id={KNOWLEDGE_MAIN_ID}
            className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <KnowledgeWorkspace onNavigate={onNavigate} />
          </div>
        </div>
      </ReaderHeaderProvider>
    </div>
  );
}
