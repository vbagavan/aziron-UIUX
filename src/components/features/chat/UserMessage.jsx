import ChatMessage from "@/components/features/chat/ChatMessage";
import { cn } from "@/lib/utils";

export default function UserMessage({ children, className, actions }) {
  return (
    <ChatMessage
      role="user"
      actions={actions}
      contentClassName={cn(
        "rounded-[18px] rounded-tr-md bg-muted px-3.5 py-2.5 text-foreground ring-1 ring-[#dbe8ff] dark:bg-card dark:text-foreground dark:ring-[#22314d]",
        className,
      )}
    >
      {children}
    </ChatMessage>
  );
}
