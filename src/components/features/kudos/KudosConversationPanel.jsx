import { motion } from "motion/react";
import { KudosConversationBody, KudosPanelHeader } from "./kudosUi";

export default function KudosConversationPanel({
  workflow,
  isExpanded,
  onToggleExpand,
  onClose,
}) {
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isExpanded ? "100%" : 400, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className={`${isExpanded ? "flex-1 min-w-0" : "w-[400px] flex-shrink-0"} h-full max-h-full min-h-0 self-stretch border-l border-border bg-muted flex flex-col overflow-hidden`}
      style={{ minWidth: 0, maxHeight: "100%" }}
    >
      <KudosPanelHeader
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onClose={onClose}
      />
      <KudosConversationBody workflow={workflow} isExpanded={isExpanded} />
    </motion.div>
  );
}
