import { Files, Layers } from "lucide-react";
import { PageUnderlineTabs } from "@/components/common/PageUnderlineTabs";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export const KNOWLEDGE_TABS = {
  hubs: "hubs",
  documents: "documents",
};

export const KNOWLEDGE_TAB_PANEL_PREFIX = "knowledge-main";

const TABS = [
  { id: KNOWLEDGE_TABS.hubs, label: KNOWLEDGE_TERMS.hubs, icon: Layers },
  { id: KNOWLEDGE_TABS.documents, label: KNOWLEDGE_TERMS.documents, icon: Files },
];

/**
 * Switches between Knowledge Hubs and Documents without unmounting either panel.
 */
export function KnowledgeTabBar({ activeTab, onTabChange, className }) {
  return (
    <PageUnderlineTabs
      value={activeTab}
      onValueChange={onTabChange}
      tabs={TABS}
      ariaLabel="Knowledge section"
      panelIdPrefix={KNOWLEDGE_TAB_PANEL_PREFIX}
      className={className}
    />
  );
}
