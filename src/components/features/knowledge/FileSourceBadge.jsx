import { SourceBadge } from "@/components/features/knowledge/SourceBadge";

/** @deprecated Use SourceBadge — kept for backward compatibility */
export function FileSourceBadge(props) {
  return <SourceBadge record={props.file} className={props.className} size={props.size} />;
}
