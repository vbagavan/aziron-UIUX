import { BrainCog } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";

export default function KnowledgeHubPage({ onNavigate }) {
  return (
    <div className="flex min-h-svh min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="knowledge" onNavigate={onNavigate} />

      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-[min(70vh,720px)] flex-col items-center justify-center px-4 py-16">
            <div className="w-full max-w-[720px] text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="size-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BrainCog size={32} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-foreground">Knowledge Hub</h1>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Organize and manage your knowledge base, documents, and resources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
