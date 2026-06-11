import { useState } from "react";
import {
  BookOpen,
  Compass,
  ExternalLink,
  FileText,
  Globe,
  Lightbulb,
  Loader2,
  MessageSquareQuote,
  Network,
  Sparkles,
  Tag,
} from "lucide-react";
import { HubFileMetadataPanel } from "@/components/features/knowledge/HubFileMetadataPanel";
import { HubKnowledgeGraph } from "@/components/features/knowledge/HubKnowledgeGraph";
import { HubMarkdownPreview } from "@/components/features/knowledge/HubMarkdownPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function SectionCard({ title, icon: Icon, children, className }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4 shadow-sm", className)}>
      <div className="mb-3 flex items-center gap-2">
        {Icon ? <Icon className="size-4 text-primary" aria-hidden /> : null}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ExternalResourceCard({ resource }) {
  const Wrapper = resource.url && resource.url !== "#" ? "a" : "div";
  const props =
    Wrapper === "a"
      ? { href: resource.url, target: "_blank", rel: "noreferrer" }
      : {};

  return (
    <Wrapper
      {...props}
      className="flex gap-3 rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
    >
      <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{resource.title}</p>
        {resource.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{resource.description}</p>
        ) : null}
        <p className="mt-1 text-[10px] text-muted-foreground">{resource.source}</p>
      </div>
      {Wrapper === "a" ? <ExternalLink className="size-3.5 shrink-0 text-primary" /> : null}
    </Wrapper>
  );
}

/**
 * @param {{
 *   file: object,
 *   sourceGuide: object | null,
 *   guideLoading?: boolean,
 *   metadata?: object,
 *   markdownContent?: string | null,
 *   previewKind?: string,
 *   previewSrc?: string | null,
 *   onQuickPrompt?: (prompt: string) => void,
 *   onGraphNodeClick?: (node: object) => void,
 *   className?: string,
 * }} props
 */
export function HubSourceGuideView({
  file,
  sourceGuide,
  guideLoading = false,
  metadata,
  markdownContent,
  previewKind,
  previewSrc,
  onQuickPrompt,
  onGraphNodeClick,
  className,
}) {
  const [activeTab, setActiveTab] = useState("guide");

  if (guideLoading || sourceGuide?.status === "loading") {
    return (
      <div className={cn("flex flex-1 flex-col items-center justify-center gap-3 py-16", className)}>
        <Loader2 className="size-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Building Source Guide</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Extracting topics, entities, and knowledge connections…
          </p>
        </div>
      </div>
    );
  }

  const guide = sourceGuide?.status === "ready" ? sourceGuide : null;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border px-4 pt-2">
          <TabsList className="h-9 w-full justify-start gap-1 rounded-none bg-transparent p-0">
            <TabsTrigger value="guide" className="gap-1.5 text-xs">
              <Sparkles className="size-3.5" />
              Guide
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-1.5 text-xs">
              <Compass className="size-3.5" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-1.5 text-xs">
              <Network className="size-3.5" />
              Graph
            </TabsTrigger>
            <TabsTrigger value="document" className="gap-1.5 text-xs">
              <FileText className="size-3.5" />
              Document
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <TabsContent value="guide" className="mt-0 flex flex-col gap-4 p-4">
            <HubFileMetadataPanel metadata={metadata} />

            {guide ? (
              <>
                <SectionCard title="Executive summary" icon={BookOpen}>
                  <p className="text-sm leading-relaxed text-muted-foreground">{guide.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(guide.keywords ?? []).slice(0, 8).map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-[10px] capitalize">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Key topics" icon={Tag}>
                  <div className="flex flex-wrap gap-2">
                    {(guide.topics ?? []).map((topic) => (
                      <Badge
                        key={topic.id}
                        variant="outline"
                        className="text-xs"
                        title={`Relevance ${Math.round(topic.relevance * 100)}%`}
                      >
                        {topic.label}
                      </Badge>
                    ))}
                  </div>
                </SectionCard>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SectionCard title="Concepts" icon={Lightbulb}>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {(guide.concepts ?? []).map((c) => (
                        <li key={c} className="flex items-start gap-2">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>

                  <SectionCard title="Entities" icon={Network}>
                    {(guide.entities ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No named entities detected.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(guide.entities ?? []).map((e) => (
                          <li key={e.id} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {e.type}
                            </Badge>
                            <span className="text-foreground">{e.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </SectionCard>
                </div>

                {(guide.sections ?? []).length > 0 ? (
                  <SectionCard title="Document sections" icon={FileText}>
                    <ul className="space-y-3">
                      {(guide.sections ?? []).map((sec) => (
                        <li key={sec.id} className="rounded-lg border border-border bg-muted/20 p-3">
                          <p className="text-sm font-medium text-foreground">{sec.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {sec.excerpt}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                ) : null}

                <SectionCard title="Quick prompts" icon={MessageSquareQuote}>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Search runs against this document only. Answers include citations to relevant
                    sections.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(guide.quickPrompts ?? []).map((item) => (
                      <Button
                        key={item.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto whitespace-normal py-2 text-left text-xs"
                        onClick={() => onQuickPrompt?.(item.prompt)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="External resources" icon={Globe}>
                  <div className="flex flex-col gap-2">
                    {(guide.externalResources ?? []).map((res, i) => (
                      <ExternalResourceCard key={`${res.title}-${i}`} resource={res} />
                    ))}
                  </div>
                </SectionCard>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Source guide could not be generated.</p>
            )}
          </TabsContent>

          <TabsContent value="discover" className="mt-0 flex flex-col gap-4 p-4">
            {guide?.discover ? (
              <>
                <SectionCard title="Related topics" icon={Compass}>
                  <div className="flex flex-wrap gap-2">
                    {guide.discover.relatedTopics.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Similar documents" icon={FileText}>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {guide.discover.similarDocuments.map((doc) => (
                      <li key={doc} className="rounded-md border border-border px-3 py-2">
                        {doc}
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard title="Trending research areas" icon={Sparkles}>
                  <ul className="flex flex-wrap gap-2">
                    {guide.discover.trendingAreas.map((area) => (
                      <Badge key={area} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard title="Recommended reading" icon={BookOpen}>
                  <ul className="space-y-2">
                    {guide.discover.recommendedReading.map((item) => (
                      <li
                        key={item.title}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <span className="text-foreground">{item.title}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {item.type}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard title="Associated ideas" icon={Lightbulb}>
                  <div className="flex flex-wrap gap-2">
                    {guide.discover.associatedConcepts.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                        onClick={() => onQuickPrompt?.(`Explain how "${c}" relates to this document`)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </SectionCard>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="graph" className="mt-0 p-4">
            {guide?.graph ? (
              <HubKnowledgeGraph
                graph={guide.graph}
                onNodeClick={(node) => {
                  onGraphNodeClick?.(node);
                  if (node.type === "topic") {
                    onQuickPrompt?.(`What does this document say about "${node.label}"?`);
                  }
                }}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="document" className="mt-0 flex flex-col gap-4 p-4">
            {previewKind === "pdf" && previewSrc ? (
              <iframe
                title={`Document ${file.name}`}
                src={previewSrc}
                className="min-h-[480px] w-full flex-1 rounded-lg border border-border bg-background"
              />
            ) : previewKind === "image" && previewSrc ? (
              <img
                src={previewSrc}
                alt={file.name}
                className="max-h-[560px] w-full rounded-lg border border-border object-contain"
              />
            ) : previewKind === "video" && previewSrc ? (
              <video
                src={previewSrc}
                controls
                className="max-h-[560px] w-full rounded-lg border border-border bg-black"
              >
                <track kind="captions" />
              </video>
            ) : previewKind === "audio" && previewSrc ? (
              <audio src={previewSrc} controls className="w-full" />
            ) : markdownContent ? (
              <div className="rounded-lg border border-border bg-background p-6">
                <HubMarkdownPreview content={markdownContent} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No raw document preview available for this file type.
              </p>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
