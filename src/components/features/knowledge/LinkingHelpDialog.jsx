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
            <strong className="text-foreground">{KNOWLEDGE_TERMS.documents}</strong> is your workspace library — one
            record per file, database, or API source.
          </p>
          <p>
            <strong className="text-foreground">{KNOWLEDGE_TERMS.hubs}</strong> are curated collections that agents
            and workflows retrieve from. Link library sources to hubs without duplicating data.
          </p>
          <p>{KNOWLEDGE_TERMS.singleHubSourceRule}</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Add sources to {KNOWLEDGE_TERMS.documents.toLowerCase()}.</li>
            <li>
              Select sources and choose <strong className="text-foreground">Add to Hub</strong>, or from a hub open{" "}
              <strong className="text-foreground">Browse {KNOWLEDGE_TERMS.documents} library</strong>.
            </li>
            <li>Linked sources stay in the library and appear under that hub&apos;s {KNOWLEDGE_TERMS.hubSourcesTab.toLowerCase()} tab.</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
