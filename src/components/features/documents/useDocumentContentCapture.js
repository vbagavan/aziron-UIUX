import { useCallback, useEffect, useMemo, useState } from "react";
import {
  appendNodeItem,
  buildReportMarkdown,
  contentToTextFile,
  documentCaptureKey,
  loadDocumentNotes,
  loadWorkspaceNodes,
  mergeSelectionToDocumentMarkdown,
  saveDocumentNotes,
  saveWorkspaceNodes,
} from "@/lib/documentReaderCapture";

export function useDocumentContentCapture({ file, addDocumentsToLibrary, showToast }) {
  const documentKey = useMemo(() => documentCaptureKey(file), [file]);
  const fileName = file?.name ?? "Document";

  const [notes, setNotes] = useState(() => loadDocumentNotes(documentKey));
  const [nodes, setNodes] = useState(() => loadWorkspaceNodes(documentKey));
  const [selectionMenu, setSelectionMenu] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [pendingReport, setPendingReport] = useState(null);

  useEffect(() => {
    setNotes(loadDocumentNotes(documentKey));
    setNodes(loadWorkspaceNodes(documentKey));
  }, [documentKey]);

  useEffect(() => {
    saveDocumentNotes(documentKey, notes);
  }, [documentKey, notes]);

  useEffect(() => {
    saveWorkspaceNodes(documentKey, nodes);
  }, [documentKey, nodes]);

  const saveAsNote = useCallback(
    (content, sourceLabel) => {
      const text = content?.trim();
      if (!text) return;
      setNotes((prev) => [
        {
          id: `note-${Date.now()}`,
          title: text.split("\n")[0].slice(0, 60),
          body: text,
          sourceLabel,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      showToast?.("Saved as note", { variant: "success" });
    },
    [showToast],
  );

  const saveToNode = useCallback((nodeId, content, sourceLabel) => {
    const text = content?.trim();
    if (!text || !nodeId) return;
    setNodes((prev) =>
      appendNodeItem(prev, nodeId, {
        body: text,
        sourceLabel,
        preview: text.slice(0, 120),
      }),
    );
    showToast?.("Saved to workspace node", { variant: "success" });
  }, [showToast]);

  const createDocument = useCallback(
    async (content, sourceLabel, name) => {
      const text = content?.trim();
      const docName = name?.trim();
      if (!text || !docName || !addDocumentsToLibrary) return false;
      const fileObj = contentToTextFile(text, docName);
      const result = await addDocumentsToLibrary({ files: [fileObj] });
      if (result?.added?.length) {
        showToast?.(`Created "${result.added[0]}" in your library`, { variant: "success" });
        return true;
      }
      showToast?.("Could not create document", { variant: "destructive" });
      return false;
    },
    [addDocumentsToLibrary, showToast],
  );

  const runCapture = useCallback(
    (action, content, sourceLabel) => {
      const text = content?.trim();
      if (!text) return;

      switch (action) {
        case "save-note":
          saveAsNote(text, sourceLabel);
          break;
        case "save-node":
          setDialog({ type: "node", content: text, sourceLabel });
          break;
        case "create-document":
          setDialog({
            type: "document",
            content: text,
            sourceLabel,
            defaultName: `${fileName.replace(/\.[^.]+$/, "")}-capture.md`,
          });
          break;
        case "generate-report": {
          const report = buildReportMarkdown(text, {
            title: text.split("\n")[0].slice(0, 80),
            sourceLabel,
            fileName,
          });
          setPendingReport({ content: text, sourceLabel, report });
          setDialog({ type: "report", content: text, sourceLabel, report });
          break;
        }
        default:
          break;
      }
    },
    [fileName, saveAsNote],
  );

  const openSelectionMenu = useCallback((event, text, sourceLabel) => {
    const selected = text?.trim() ?? window.getSelection()?.toString()?.trim();
    if (!selected) return;
    event.preventDefault();
    setSelectionMenu({
      x: Math.min(event.clientX, window.innerWidth - 240),
      y: Math.min(event.clientY, window.innerHeight - 180),
      text: selected,
      sourceLabel,
    });
  }, []);

  const closeSelectionMenu = useCallback(() => setSelectionMenu(null), []);
  const closeDialog = useCallback(() => {
    setDialog(null);
    setPendingReport(null);
  }, []);

  const handleDialogSaveToNode = useCallback(
    (nodeId) => {
      if (!dialog?.content) return;
      saveToNode(nodeId, dialog.content, dialog.sourceLabel);
      closeDialog();
    },
    [closeDialog, dialog, saveToNode],
  );

  const handleDialogCreateDocument = useCallback(
    async (name) => {
      if (!dialog?.content) return;
      const ok = await createDocument(dialog.content, dialog.sourceLabel, name);
      if (ok) closeDialog();
    },
    [closeDialog, createDocument, dialog],
  );

  const handleReportSaveAsNote = useCallback(() => {
    if (!pendingReport?.report) return;
    saveAsNote(pendingReport.report, pendingReport.sourceLabel);
    closeDialog();
  }, [closeDialog, pendingReport, saveAsNote]);

  const handleReportSaveToNode = useCallback(() => {
    if (!pendingReport?.report) return;
    setDialog({
      type: "node",
      content: pendingReport.report,
      sourceLabel: pendingReport.sourceLabel,
    });
  }, [pendingReport]);

  const handleReportCreateDocument = useCallback(async () => {
    if (!pendingReport?.report) return;
    await createDocument(
      pendingReport.report,
      pendingReport.sourceLabel,
      `${fileName.replace(/\.[^.]+$/, "")}-report.md`,
    );
    closeDialog();
  }, [closeDialog, createDocument, fileName, pendingReport]);

  const handleReportDownload = useCallback(() => {
    if (!pendingReport?.report) return;
    const blob = new Blob([pendingReport.report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName.replace(/\.[^.]+$/, "")}-report.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast?.("Report downloaded", { variant: "success" });
  }, [fileName, pendingReport, showToast]);

  const openCreateDocumentFromNotes = useCallback(
    (selectedNotes, selectedNodeItems = []) => {
      const noteList = selectedNotes ?? [];
      const nodeList = selectedNodeItems ?? [];
      if (noteList.length === 0 && nodeList.length === 0) return;

      const merged = mergeSelectionToDocumentMarkdown(
        { notes: noteList, nodeItems: nodeList },
        { sourceDocumentName: fileName },
      );

      const total = noteList.length + nodeList.length;
      setDialog({
        type: "document",
        content: merged,
        sourceLabel: `${total} item${total === 1 ? "" : "s"} from ${fileName}`,
        defaultName: `${fileName.replace(/\.[^.]+$/, "")}-compiled.md`,
      });
    },
    [fileName],
  );

  return {
    notes,
    nodes,
    selectionMenu,
    dialog,
    pendingReport,
    runCapture,
    openSelectionMenu,
    closeSelectionMenu,
    closeDialog,
    handleDialogSaveToNode,
    handleDialogCreateDocument,
    handleReportSaveAsNote,
    handleReportSaveToNode,
    handleReportCreateDocument,
    handleReportDownload,
    openCreateDocumentFromNotes,
  };
}
