import { useCallback, useEffect, useState } from "react";
import { Pencil, Upload } from "lucide-react";
import { Link, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import {
  ProjectHeaderBreadcrumb,
  projectDetailBreadcrumbs,
} from "@/components/features/projects/ProjectHeaderBreadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { ProjectBasicDetails } from "@/components/features/projects/ProjectBasicDetails";
import { ProjectMetadataDetailView } from "@/components/features/projects/ProjectMetadataDetailView";
import { ProjectTimeline } from "@/components/features/projects/ProjectTimeline";
import { ProjectDocumentsView } from "@/components/features/projects/ProjectDocumentsView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LIST_PAGE_SHELL_CLASS, TOOLBAR_CONTROL_CLASS } from "@/lib/listToolbar";
import { PROJECT_FLOW_ROUTES } from "@/data/projectWorkflowFlow";
import { useProjectsStore } from "@/store/projectsStore";

const VALID_TABS = new Set(["metadata", "timeline", "documents"]);

export default function ProjectDetailPage({ onNavigate }) {
  const { projectId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const fromCreate = Boolean(location.state?.fromCreate);
  const tabFromUrl = searchParams.get("tab");
  const highlightEventId = searchParams.get("event");
  const filterDocId = searchParams.get("doc");

  const project = useProjectsStore((s) => s.getProjectById(projectId));
  const timeline = useProjectsStore((s) => s.timeline);
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.has(tabFromUrl) ? tabFromUrl : "metadata",
  );
  const [highlightDocId, setHighlightDocId] = useState(null);

  const syncTabToUrl = useCallback(
    (tab, { event, doc, clearFilters } = {}) => {
      const next = new URLSearchParams();
      if (VALID_TABS.has(tab)) next.set("tab", tab);
      if (!clearFilters) {
        if (event) next.set("event", event);
        if (doc) next.set("doc", doc);
      }
      setSearchParams(next, { replace: true });
      setActiveTab(tab);
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (VALID_TABS.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (activeTab !== "documents" || !highlightDocId) return;
    const t = window.setTimeout(() => setHighlightDocId(null), 2500);
    return () => window.clearTimeout(t);
  }, [activeTab, highlightDocId]);

  const handleViewTimelineForDocument = useCallback(
    (doc, entryId) => {
      syncTabToUrl("timeline", { doc: doc.id, event: entryId ?? undefined });
    },
    [syncTabToUrl],
  );

  const handleViewDocumentFromTimeline = useCallback(
    (doc) => {
      setHighlightDocId(doc.id);
      syncTabToUrl("documents", { doc: doc.id });
    },
    [syncTabToUrl],
  );

  const handleViewMetadataFromTimeline = useCallback(() => {
    syncTabToUrl("metadata", { clearFilters: true });
  }, [syncTabToUrl]);

  const handleTabChange = useCallback(
    (tab) => {
      syncTabToUrl(tab, { clearFilters: true });
    },
    [syncTabToUrl],
  );

  if (!project) {
    return <Navigate to="/finance/projects" replace />;
  }

  return (
    <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="invoice-projects" onNavigate={onNavigate} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <ProjectHeaderBreadcrumb segments={projectDetailBreadcrumbs(project.name)} />
        </AppHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={LIST_PAGE_SHELL_CLASS}>
            <PageHeader
              title={project.name}
              description="Project details, documents, and change timeline. Upload contracts to compare extracted data with this record."
            >
              <Button
                type="button"
                className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}
                render={<Link to={PROJECT_FLOW_ROUTES.uploadDocument(project.id)} />}
              >
                <Upload data-icon="inline-start" />
                Upload document
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}
                render={<Link to={PROJECT_FLOW_ROUTES.edit(project.id)} />}
              >
                <Pencil data-icon="inline-start" />
                Edit
              </Button>
            </PageHeader>

            {fromCreate && !location.state?.fromUpload && (
              <Alert>
                <AlertTitle>Project created</AlertTitle>
                <AlertDescription>
                  Review project details on this tab, or use{" "}
                  <span className="font-medium text-foreground">Upload document</span> to add contracts
                  and compare AI-extracted fields with the current project record.
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="metadata">Project details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="documents">
                  Documents
                  {project.documents?.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 px-1.5 text-[10px]">
                      {project.documents.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="metadata" className="mt-4 flex flex-col gap-6">
                <ProjectBasicDetails project={project} />
                <ProjectMetadataDetailView project={project} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <ProjectTimeline
                  projectId={project.id}
                  documents={project.documents ?? []}
                  entries={timeline}
                  highlightEntryId={highlightEventId}
                  filterDocumentId={filterDocId}
                  onViewMetadata={handleViewMetadataFromTimeline}
                  onViewDocument={handleViewDocumentFromTimeline}
                  onClearDocumentFilter={() => syncTabToUrl("timeline", { clearFilters: true })}
                />
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <ProjectDocumentsView
                  project={project}
                  timelineEntries={timeline}
                  uploadHref={PROJECT_FLOW_ROUTES.uploadDocument(project.id)}
                  onViewTimelineForDocument={handleViewTimelineForDocument}
                  highlightDocumentId={highlightDocId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

    </div>
  );
}
