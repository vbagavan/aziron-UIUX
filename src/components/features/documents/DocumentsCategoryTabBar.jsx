import { FileText, Database, Zap, LayoutGrid } from "lucide-react";
import { PageUnderlineTabs } from "@/components/common/PageUnderlineTabs";
import { CATEGORY_FILTER_OPTIONS } from "@/lib/sourceCategories";

const TAB_ICONS = {
  all: LayoutGrid,
  files: FileText,
  dbs: Database,
  apis: Zap,
};

const TABS = CATEGORY_FILTER_OPTIONS.map((tab) => ({
  id: tab.id,
  label: tab.label,
  icon: TAB_ICONS[tab.id] ?? LayoutGrid,
}));

export function DocumentsCategoryTabBar({ value = "all", onChange, className }) {
  return (
    <PageUnderlineTabs
      value={value}
      onValueChange={onChange}
      tabs={TABS}
      ariaLabel="Source category"
      className={className}
    />
  );
}
