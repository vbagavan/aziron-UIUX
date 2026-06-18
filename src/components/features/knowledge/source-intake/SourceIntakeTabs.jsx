import { Cloud, HardDrive } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageUnderlineTabs } from "@/components/common/PageUnderlineTabs";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { LocalComputerDropZone } from "./LocalComputerDropZone";

const SOURCE_TABS = [
  { id: "computer", label: KNOWLEDGE_TERMS.fromComputer, icon: HardDrive },
  { id: "cloud", label: KNOWLEDGE_TERMS.fromCloudStorage, icon: Cloud },
];

export function SourceIntakeTabs({
  sourceTab,
  onSourceTabChange,
  computerProps,
  cloudContent,
  disabled = false,
  className,
}) {
  return (
    <Tabs
      value={sourceTab}
      onValueChange={onSourceTabChange}
      className={className ?? "flex min-h-0 flex-1 flex-col gap-0"}
    >
      <PageUnderlineTabs
        value={sourceTab}
        onValueChange={onSourceTabChange}
        tabs={SOURCE_TABS}
        ariaLabel="Upload source"
        className="px-0"
      />

      <TabsContent value="computer" className="mt-0 min-h-[320px] pt-4">
        <LocalComputerDropZone {...computerProps} disabled={disabled || computerProps?.disabled} />
      </TabsContent>

      <TabsContent value="cloud" className="mt-0 min-h-[320px] pt-4">
        <div className="flex min-h-[320px] flex-col">{cloudContent}</div>
      </TabsContent>
    </Tabs>
  );
}
