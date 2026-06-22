import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export function LinkingHelpDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{KNOWLEDGE_TERMS.documentsLearnMore}</DialogTitle>
          <DialogDescription>
            How {KNOWLEDGE_TERMS.documents.toLowerCase()} and {KNOWLEDGE_TERMS.hubs.toLowerCase()} work together.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">All Sources</strong> is your organization&apos;s
            library — one record per file, database, or API.
          </p>
          <p>
            <strong className="text-foreground">{KNOWLEDGE_TERMS.hubs}</strong> are curated
            collections that agents and workflows retrieve from. Link library sources to hubs
            without duplicating data.
          </p>
          <p>{KNOWLEDGE_TERMS.singleHubSourceRule}</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Add sources with <strong className="text-foreground">Add sources</strong>.</li>
            <li>
              <strong className="text-foreground">Drag</strong> a source onto a hub in the sidebar,
              use <strong className="text-foreground">Link to hub</strong> on a row, or{" "}
              <strong className="text-foreground">Select</strong> multiple sources and choose{" "}
              <strong className="text-foreground">Add to Hub</strong>.
            </li>
            <li>{KNOWLEDGE_TERMS.linkingHelpStep3}</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
