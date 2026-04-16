import { cn } from "@/lib/utils";

export default function ChatMessage({
  role = "assistant",
  avatar = null,
  actions = null,
  children,
  className,
  contentClassName,
}) {
  const isUser = role === "user";

  return (
    <div className={cn("group/chat-message w-full", className)}>
      <style>{`
        @keyframes chatMessageIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        className={cn(
          "flex w-full gap-3 [animation:chatMessageIn_.24s_ease-out]",
          isUser ? "justify-end" : "justify-start",
        )}
      >
        {!isUser && avatar}

        <div
          className={cn(
            "min-w-0",
            isUser ? "max-w-[min(100%,34rem)]" : "max-w-[min(100%,44rem)] flex-1",
          )}
        >
          <div className={contentClassName}>
            {children}
          </div>
          {actions}
        </div>

        {isUser && avatar}
      </div>
    </div>
  );
}
