import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getHubDisplayName } from "@/lib/hubDisplay";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { KnowledgeScopeRail } from "@/components/features/knowledge/KnowledgeScopeRail";
import DocumentsPage from "@/components/pages/DocumentsPage";
import { Toast, useToast } from "@/components/ui/Toast";
import { useReaderHeader } from "@/context/ReaderHeaderContext";

export function KnowledgeWorkspace({ onNavigate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getHubById, linkDocumentToHub, copyHubFilesToHub } = useKnowledgeHubs();
  const { toasts, showToast, dismissToast } = useToast();
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [isSourceDragging, setIsSourceDragging] = useState(false);
  const [pulseHubId, setPulseHubId] = useState(null);

  // While a source reader takes over the top bar, collapse the library rail
  // so reading is full-bleed and distraction-free.
  const readerActive = !!useReaderHeader()?.active;

  const scope = searchParams.get("scope") || "all";

  const handleScopeChange = useCallback(
    (nextScope) => {
      const next = new URLSearchParams(searchParams);
      if (nextScope === "all") next.delete("scope");
      else next.set("scope", nextScope);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleNewHub = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set("create", "1");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleLinkSourcesToHub = useCallback(
    async (hubId, refs) => {
      if (!refs?.length) return;

      const hub = getHubById(hubId);
      const hubName = getHubDisplayName(hub) || "hub";
      const libraryRefs = refs.filter((r) => r.type === "library");
      const hubRefs = refs
        .filter((r) => r.type === "hub")
        .map((r) => ({ hubId: r.hubId, fileId: r.fileId }));

      let linked = 0;
      let moved = false;

      for (const ref of libraryRefs) {
        const result = linkDocumentToHub(ref.documentId, hubId);
        if (result.linked) {
          linked += 1;
          if (result.moved) moved = true;
        }
      }

      if (hubRefs.length > 0) {
        const { copied } = await copyHubFilesToHub(hubRefs, hubId);
        linked += copied.length;
      }

      if (linked === 0) {
        showToast({
          title: KNOWLEDGE_TERMS.toastAlreadyInHub,
          description: `This source is already in "${hubName}".`,
          variant: "default",
        });
        return;
      }

      setPulseHubId(hubId);
      window.setTimeout(() => setPulseHubId(null), 1200);

      const sourceName = refs[0]?.name ?? "Source";
      if (linked === 1) {
        showToast({
          title: moved ? "Moved to hub" : "Linked to hub",
          description: moved
            ? `"${sourceName}" moved to "${hubName}".`
            : `"${sourceName}" linked to "${hubName}".`,
          variant: "success",
        });
      } else {
        showToast({
          title: "Added to hub",
          description: `${linked} source${linked === 1 ? "" : "s"} linked to "${hubName}".`,
          variant: "success",
        });
      }
    },
    [copyHubFilesToHub, getHubById, linkDocumentToHub, showToast],
  );

  const scopedHub = scope !== "all" ? getHubById(scope) : null;
  const scopeTitle =
    scope === "all" ? "All Sources" : getHubDisplayName(scopedHub) || "Knowledge Hub";
  const scopeDescription =
    scope === "all"
      ? "Your full source library — files, databases, and connections. Drag onto a hub to link, or choose Link to hub on a row."
      : `Sources linked to ${scopeTitle}. Add more from All Sources, or upload directly to this hub.`;

  const toastApi = { showToast, dismissToast, toasts };

  return (
    <>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop / tablet: inline scope rail (hidden in reader focus mode) */}
        {!readerActive && (
          <KnowledgeScopeRail
            className="hidden lg:flex"
            scope={scope}
            onScopeChange={handleScopeChange}
            collapsed={railCollapsed}
            onNewHub={handleNewHub}
            dropEnabled
            onLinkSourcesToHub={handleLinkSourcesToHub}
            isSourceDragging={isSourceDragging}
            pulseHubId={pulseHubId}
          />
        )}

        {/* Mobile: scope rail as a slide-over drawer */}
        {!readerActive && mobileRailOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close scope rail"
              className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
              onClick={() => setMobileRailOpen(false)}
            />
            <KnowledgeScopeRail
              className="absolute inset-y-0 left-0 max-w-[80vw] bg-background shadow-xl"
              scope={scope}
              onScopeChange={(next) => {
                handleScopeChange(next);
                setMobileRailOpen(false);
              }}
              onNewHub={() => {
                handleNewHub();
                setMobileRailOpen(false);
              }}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <DocumentsPage
            embedded
            workspaceMode
            scopeHubId={scope}
            scopeTitle={scopeTitle}
            scopeDescription={scopeDescription}
            onNavigate={onNavigate}
            railCollapsed={railCollapsed}
            onRailToggle={() => setRailCollapsed((v) => !v)}
            onOpenMobileRail={() => setMobileRailOpen(true)}
            toastApi={toastApi}
            hideToastHost
            onSourceDragChange={setIsSourceDragging}
            onScopeChange={handleScopeChange}
          />
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            variant={t.variant ?? "default"}
            actionLabel={t.actionLabel}
            onAction={t.onAction}
            onDismiss={() => dismissToast(t.id)}
          />
        ))}
      </div>
    </>
  );
}
