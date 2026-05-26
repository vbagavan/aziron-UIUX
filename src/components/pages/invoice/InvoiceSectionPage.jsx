import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/common/PageHeader";
import { LIST_PAGE_SHELL_CLASS } from "@/lib/listToolbar";

/**
 * Placeholder shell for Invoice Management sub-routes not yet built out.
 */
export default function InvoiceSectionPage({ activePage, onNavigate, title, description }) {
  return (
    <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={LIST_PAGE_SHELL_CLASS}>
            <PageHeader title={title} description={description} />
            <p className="text-sm text-muted-foreground">This section is coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
