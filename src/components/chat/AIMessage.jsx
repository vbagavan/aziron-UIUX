import ChatMessage from "@/components/chat/ChatMessage";
import { cn } from "@/lib/utils";

export default function AIMessage({ children, actions, className }) {
  return (
    <ChatMessage
      role="assistant"
      actions={actions}
      contentClassName={cn(
        "px-1 py-1 text-[#0f172a] dark:text-[#f8fafc]",
        className,
      )}
    >
      {children}
    </ChatMessage>
  );
}
