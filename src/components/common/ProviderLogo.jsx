import openAIIcon from "@lobehub/icons-static-svg/icons/openai.svg?raw";
import anthropicIcon from "@lobehub/icons-static-svg/icons/anthropic.svg?raw";

import { cn } from "@/lib/utils";

const PROVIDER_MARKUP = {
  OpenAI: openAIIcon,
  Anthropic: anthropicIcon,
};

export default function ProviderLogo({
  provider,
  className,
  fallbackClassName,
}) {
  const markup = PROVIDER_MARKUP[provider];

  if (!markup) {
    return (
      <div className={cn("flex items-center justify-center rounded bg-[#e0e7ff] text-[#4f46e5]", fallbackClassName, className)}>
        <span className="text-xs font-bold">{provider?.[0] ?? "?"}</span>
      </div>
    );
  }

  return (
    <span
      aria-label={provider}
      role="img"
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-[#0f172a] dark:text-[#f8fafc] [&_svg]:h-full [&_svg]:w-full",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
