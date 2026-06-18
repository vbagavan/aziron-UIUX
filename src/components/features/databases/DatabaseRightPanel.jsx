import { useMemo, useState } from "react";
import { Database, Info, MessageSquare } from "lucide-react";
import { PageUnderlineTabs } from "@/components/common/PageUnderlineTabs";
import { SourceDetailsPanel } from "@/components/features/sources/shared/SourceDetailsPanel";
import { panelTabsWithHubCount } from "@/components/features/sources/shared/sourcePanelUtils";
import { DatabaseAskTab } from "./DatabaseAskTab";

const PANEL_TABS = [
  { id: "ask", label: "Ask AI", icon: MessageSquare },
  { id: "details", label: "Details", icon: Info },
];

export function DatabaseRightPanel({
  detail,
  record,
  hubLinks = [],
  hubs = [],
  canEdit = true,
  canCreate = true,
  tab,
  onTabChange,
  seedPrompt,
  onSeedPromptApplied,
  onNavigateToHub,
  onLinkToHub,
  onUnlinkFromHub,
  onCreateHub,
  onOpenQueryStudio,
}) {
  const [internalTab, setInternalTab] = useState("ask");
  const activeTab = tab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const panelTabs = useMemo(() => panelTabsWithHubCount(PANEL_TABS, hubLinks), [hubLinks]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageUnderlineTabs
        value={activeTab}
        onValueChange={setTab}
        tabs={panelTabs}
        ariaLabel="Database assistant sections"
        className="px-3"
      />

      {activeTab === "ask" ? (
        <DatabaseAskTab
          detail={detail}
          record={record}
          seedPrompt={seedPrompt}
          onSeedPromptApplied={onSeedPromptApplied}
          onOpenQueryStudio={onOpenQueryStudio}
        />
      ) : (
        <SourceDetailsPanel
          record={record}
          detail={detail}
          hubLinks={hubLinks}
          hubs={hubs}
          canEdit={canEdit}
          canCreate={canCreate}
          hubIcon={Database}
          onNavigateToHub={onNavigateToHub}
          onLinkToHub={onLinkToHub}
          onUnlinkFromHub={onUnlinkFromHub}
          onCreateHub={onCreateHub}
        />
      )}
    </div>
  );
}

export { PANEL_TABS as DATABASE_PANEL_TABS };
