import { useMemo, useState } from "react";
import {
  Bot,
  Database,
  GitBranch,
  Layers,
  MessageSquare,
  Sparkles,
  Table2,
  X,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatabaseRightPanel, DATABASE_PANEL_TABS } from "@/components/features/databases/DatabaseRightPanel";
import { SourceBadge } from "@/components/features/knowledge/SourceBadge";
import {
  generateSqlFromNaturalLanguage,
  getDatabaseDetail,
} from "@/lib/databaseDetailModel";
import { CAPTION, METRIC_VALUE, SECTION_EYEBROW } from "@/lib/typography";
import { cn } from "@/lib/utils";

const MAIN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "knowledge", label: "Knowledge" },
  { id: "schema", label: "Schema" },
  { id: "usage", label: "Usage" },
  { id: "query", label: "Query Studio" },
];

const QUERY_MODES = [
  { id: "sql", label: "SQL" },
  { id: "natural", label: "Natural Language" },
  { id: "saved", label: "Saved Queries" },
  { id: "history", label: "History" },
];

function MetricCard({ label, value }) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="px-4 py-3">
        <p className={SECTION_EYEBROW}>{label}</p>
        <p className={cn(METRIC_VALUE, "mt-1 text-xl")}>{value}</p>
      </CardContent>
    </Card>
  );
}

function OverviewTab({ detail }) {
  return (
    <div className="space-y-6">
      <div>
        <p className={SECTION_EYEBROW}>Database metadata</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{detail.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{detail.provider}</Badge>
          <Badge variant="secondary">{detail.environment}</Badge>
          {detail.focusedTable ? (
            <Badge variant="outline" className="font-mono text-[11px]">
              Table: {detail.focusedTable}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Last sync" value={detail.lastSyncRelative} />
        <MetricCard label="Health" value={detail.health} />
        <MetricCard label="Tables" value={detail.tableCount} />
        <MetricCard label="Rows" value={detail.rowCountLabel} />
      </div>

      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-medium">Connection</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-2 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Connection</dt>
              <dd className="font-medium">{detail.connectionName}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="font-medium">{detail.provider}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Environment</dt>
              <dd className="font-medium">{detail.environment}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Focused asset</dt>
              <dd className="font-mono text-xs">{detail.focusedTable}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function KnowledgeTab({ detail }) {
  const { knowledge } = detail;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden />
          AI intelligence generated from this database
        </div>
        <p className={cn(CAPTION, "mt-1")}>
          Discover business context, domains, and ready-to-ask questions — like Discover, for databases.
        </p>
      </div>

      <section>
        <p className={SECTION_EYEBROW}>Business summary</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{knowledge.businessSummary}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <p className={SECTION_EYEBROW}>Key domains</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {knowledge.domains.map((d) => (
              <Badge key={d} variant="secondary">{d}</Badge>
            ))}
          </ul>
        </section>
        <section>
          <p className={SECTION_EYEBROW}>Business concepts</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {knowledge.concepts.map((c) => (
              <Badge key={c} variant="outline">{c}</Badge>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <p className={SECTION_EYEBROW}>Suggested questions</p>
        <ul className="mt-3 space-y-2">
          {knowledge.suggestedQuestions.map((q) => (
            <li
              key={q}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm"
            >
              <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
              {q}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SchemaTab({ detail }) {
  const [activeSchemaId, setActiveSchemaId] = useState(detail.schemas[0]?.id);
  const [activeTableId, setActiveTableId] = useState(
    detail.schemas[0]?.tables[0]?.id,
  );

  const activeSchema = detail.schemas.find((s) => s.id === activeSchemaId) ?? detail.schemas[0];
  const activeTable =
    activeSchema?.tables.find((t) => t.id === activeTableId) ?? activeSchema?.tables[0];

  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
      <aside className="hidden w-48 shrink-0 flex-col overflow-y-auto rounded-xl border border-border bg-muted/10 p-3 md:flex">
        <p className={SECTION_EYEBROW}>Schemas</p>
        <ul className="mt-3 space-y-1">
          {detail.schemas.map((schema) => (
            <li key={schema.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveSchemaId(schema.id);
                  setActiveTableId(schema.tables[0]?.id);
                }}
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm font-mono",
                  activeSchemaId === schema.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {schema.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {activeSchema?.tables.map((table) => (
            <Button
              key={table.id}
              type="button"
              size="sm"
              variant={activeTableId === table.id ? "default" : "outline"}
              className="h-8 font-mono text-xs"
              onClick={() => setActiveTableId(table.id)}
            >
              <Table2 className="size-3.5" data-icon="inline-start" aria-hidden />
              {table.name}
            </Button>
          ))}
        </div>

        {activeTable ? (
          <>
            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-sm font-medium">
                  Columns — {activeSchema.label}.{activeTable.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Keys</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTable.columns.map((col) => (
                      <TableRow key={col.name}>
                        <TableCell className="font-mono text-xs">{col.name}</TableCell>
                        <TableCell className="text-muted-foreground">{col.type}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {col.pk ? "PK" : col.fk ? `FK → ${col.fk}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="gap-0 py-0 shadow-none">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-sm font-medium">Relationships</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-4 pb-4 text-sm">
                  {activeTable.relationships.length === 0 ? (
                    <p className="text-muted-foreground">No relationships defined.</p>
                  ) : (
                    activeTable.relationships.map((rel) => (
                      <div key={rel.to} className="rounded-md border border-border px-3 py-2">
                        <span className="font-mono text-xs">{activeTable.name}</span>
                        <span className="mx-2 text-muted-foreground">{rel.type}</span>
                        <span className="font-mono text-xs">{rel.to}</span>
                        {rel.label ? (
                          <span className="ml-2 text-xs text-muted-foreground">({rel.label})</span>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="gap-0 py-0 shadow-none">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-sm font-medium">Indexes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 px-4 pb-4">
                  {activeTable.indexes.map((idx) => (
                    <p key={idx} className="font-mono text-xs text-muted-foreground">{idx}</p>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="gap-0 py-0 shadow-none">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-sm font-medium">ER diagram (preview)</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-center gap-4 px-4 pb-6 pt-2">
                {activeSchema.tables.map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      "min-w-[120px] rounded-lg border-2 bg-card px-3 py-2 text-center shadow-sm",
                      table.id === activeTable.id ? "border-primary" : "border-border",
                    )}
                  >
                    <p className="font-mono text-xs font-semibold">{table.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {table.columns.length} cols
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

function UsageTab({ detail }) {
  const sections = [
    { title: "Knowledge Hubs", icon: Layers, items: detail.usage.hubs },
    { title: "Agents", icon: Bot, items: detail.usage.agents },
    { title: "Flows", icon: Workflow, items: detail.usage.flows },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {sections.map(({ title, icon: Icon, items }) => (
        <Card key={title} className="gap-0 py-0 shadow-none">
          <CardHeader className="flex-row items-center gap-2 px-4 py-3">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {items.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm font-medium"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QueryStudioTab({ detail }) {
  const [mode, setMode] = useState("natural");
  const [nlPrompt, setNlPrompt] = useState("Show top 10 customers by ARR");
  const [sql, setSql] = useState(() => generateSqlFromNaturalLanguage("Show top 10 customers by ARR", detail));

  function handleGenerate() {
    setSql(generateSqlFromNaturalLanguage(nlPrompt, detail));
    setMode("sql");
  }

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="h-9 w-full justify-start overflow-x-auto">
          {QUERY_MODES.map((m) => (
            <TabsTrigger key={m.id} value={m.id} className="text-xs">
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="natural" className="mt-4 space-y-3">
          <p className={CAPTION}>Ask in plain language — AI generates SQL.</p>
          <Textarea
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            placeholder="e.g. Show top 10 customers by ARR"
          />
          <Button type="button" size="sm" onClick={handleGenerate}>
            <Sparkles data-icon="inline-start" aria-hidden />
            Generate SQL
          </Button>
        </TabsContent>

        <TabsContent value="sql" className="mt-4 space-y-3">
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={10}
            className="resize-none font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm">Run query</Button>
            <Button type="button" size="sm" variant="outline">Save query</Button>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-4 space-y-2">
          {detail.savedQueries.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setSql(q.sql);
                setMode("sql");
              }}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/30"
            >
              <p className="text-sm font-medium">{q.name}</p>
              <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{q.sql}</p>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-2">
          {detail.queryHistory.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setNlPrompt(h.prompt);
                setSql(generateSqlFromNaturalLanguage(h.prompt, detail));
                setMode("natural");
              }}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:bg-muted/30"
            >
              <span>{h.prompt}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{h.ranAt}</span>
            </button>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function DatabaseDetailView({
  record,
  hubLinks = [],
  onClose,
  onNavigateToHub,
  className,
}) {
  const detail = useMemo(() => getDatabaseDetail(record), [record?.id, record?.name]);
  const [mainTab, setMainTab] = useState("overview");
  const [panelTab, setPanelTab] = useState("ask");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [askSeedPrompt, setAskSeedPrompt] = useState("");

  function openMobilePanel(tab) {
    setPanelTab(tab);
    setMobilePanelOpen(true);
  }

  function handleAskFromInsight(question) {
    setAskSeedPrompt(question);
    setPanelTab("ask");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobilePanelOpen(true);
    }
  }

  function handleOpenQueryStudio() {
    setMainTab("query");
    setMobilePanelOpen(false);
  }

  const panelProps = {
    detail,
    record,
    hubLinks,
    tab: panelTab,
    onTabChange: setPanelTab,
    seedPrompt: askSeedPrompt,
    onSeedPromptApplied: () => setAskSeedPrompt(""),
    onNavigateToHub,
    onOpenQueryStudio: handleOpenQueryStudio,
    onAskQuestion: handleAskFromInsight,
  };

  return (
    <div className={cn("flex h-full w-full flex-col bg-background", className)}>
      <header className="shrink-0 border-b border-border bg-card/50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Database className="size-3.5" aria-hidden />
              Database details
            </div>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight">{detail.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SourceBadge record={record} size="sm" />
              <Badge variant="secondary">{detail.environment}</Badge>
              {hubLinks.length > 0 ? (
                <Badge variant="outline">
                  <GitBranch data-icon="inline-start" aria-hidden />
                  {hubLinks.length} hub{hubLinks.length === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openMobilePanel(panelTab)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              title="Open database assistant"
              aria-label="Open database assistant"
            >
              <MessageSquare className="size-4" />
            </button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Tabs value={mainTab} onValueChange={setMainTab} className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border px-5">
              <TabsList className="h-10 w-max min-w-0 justify-start rounded-none bg-transparent p-0">
                {MAIN_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab detail={detail} />
              </TabsContent>
              <TabsContent value="knowledge" className="mt-0">
                <KnowledgeTab detail={detail} />
              </TabsContent>
              <TabsContent value="schema" className="mt-0 flex min-h-[480px] flex-col">
                <SchemaTab detail={detail} />
              </TabsContent>
              <TabsContent value="usage" className="mt-0">
                <UsageTab detail={detail} />
              </TabsContent>
              <TabsContent value="query" className="mt-0">
                <QueryStudioTab detail={detail} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex shrink-0 items-center gap-1 border-t border-border bg-background px-2 py-2 lg:hidden">
            {DATABASE_PANEL_TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => openMobilePanel(id)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors",
                  panelTab === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {hubLinks.length > 0 && onNavigateToHub ? (
            <footer className="shrink-0 border-t border-border bg-muted/20 px-5 py-2 lg:hidden">
              <div className="flex flex-wrap gap-2">
                {hubLinks.map((link) => (
                  <Button
                    key={link.hubId}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onNavigateToHub(link.hubId)}
                  >
                    Open {link.hubName}
                  </Button>
                ))}
              </div>
            </footer>
          ) : null}
        </div>

        <div className="hidden w-64 shrink-0 border-l border-border bg-muted/10 lg:flex lg:flex-col xl:w-72">
          <DatabaseRightPanel key={record?.id} {...panelProps} />
        </div>
      </div>

      <Sheet open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
        <SheetContent side="bottom" className="h-[min(88vh,720px)] gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-sm">Database assistant</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            <DatabaseRightPanel key={`mobile-${record?.id}`} {...panelProps} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
