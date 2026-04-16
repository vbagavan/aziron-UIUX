import ChatMessage from "@/components/features/chat/ChatMessage";
import { cn } from "@/lib/utils";

export default function UserMessage({ children, className, actions }) {
  return (
    <ChatMessage
      role="user"
      actions={actions}
      contentClassName={cn(
        "rounded-[18px] rounded-tr-md bg-[#edf4ff] px-3.5 py-2.5 text-[#10203b] ring-1 ring-[#dbe8ff] dark:bg-[#15233f] dark:text-[#e5eefc] dark:ring-[#22314d]",
        className,
      )}
    >
      {children}
    </ChatMessage>
  );
}
