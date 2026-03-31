import { BarChart2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";

export default function UsagePage({ onNavigate }) {
  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="usage" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        <div className="flex-1 overflow-y-auto">
          <div className="flex h-full items-center justify-center px-4 py-10">
            <div className="w-full max-w-[720px] text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="size-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart2 size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-foreground">Usage Analytics</h1>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Track your API usage, token consumption, and system performance metrics.
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
