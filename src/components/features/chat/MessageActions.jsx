import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MessageActions({
  copied = false,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  className,
}) {
  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover/chat-message:opacity-100 focus-within:opacity-100",
        className,
      )}
    >
      <Button variant="ghost" size="icon-xs" className="text-[#64748b] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-white" onClick={onCopy}>
        {copied ? <Check /> : <Copy />}
      </Button>
      <Button variant="ghost" size="icon-xs" className="text-[#64748b] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-white" onClick={onRegenerate}>
        <RefreshCw />
      </Button>
      <Button variant="ghost" size="icon-xs" className="text-[#64748b] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-white" onClick={onThumbsUp}>
        <ThumbsUp />
      </Button>
      <Button variant="ghost" size="icon-xs" className="text-[#64748b] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-white" onClick={onThumbsDown}>
        <ThumbsDown />
      </Button>
    </div>
  );
}
