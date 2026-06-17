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
            <strong className="text-foreground">{KNOWLEDGE_TERMS.documents}</strong> is your workspace library — upload
            once and keep a single copy of each file, database, or API source.
          </p>
          <p>
            <strong className="text-foreground">{KNOWLEDGE_TERMS.hubs}</strong> are curated collections that agents
            and workflows use for retrieval. Link library items to any hub without duplicating files.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Add sources to {KNOWLEDGE_TERMS.documents.toLowerCase()}.</li>
            <li>Select files and choose <strong className="text-foreground">Add to Hub</strong>, or from a hub choose{" "}
              <strong className="text-foreground">Browse {KNOWLEDGE_TERMS.documents} library</strong>.
            </li>
            <li>Linked files appear in both the hub and the central library.</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
