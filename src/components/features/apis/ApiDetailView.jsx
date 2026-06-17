import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  Play,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiRightPanel, API_PANEL_TABS } from "@/components/features/apis/ApiRightPanel";
import { SourceBadge } from "@/components/features/knowledge/SourceBadge";
import { SourceUsageTab } from "@/components/features/sources/SourceUsageTab";
import {
  buildPlaygroundRequest,
  getApiDetail,
} from "@/lib/apiDetailModel";
import { CAPTION, METRIC_VALUE, SECTION_EYEBROW } from "@/lib/typography";
import { cn } from "@/lib/utils";

const MAIN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "discover", label: "Discover" },
  { id: "endpoints", label: "Endpoints" },
  { id: "usage", label: "Usage" },
  { id: "playground", label: "Playground" },
  { id: "operations", label: "Operations" },
];

const METHOD_STYLES = {
  GET: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  POST: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  PATCH: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  PUT: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  DELETE: "text-red-600 bg-red-500/10 border-red-500/20",
};

function MethodBadge({ method }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
        METHOD_STYLES[method] ?? "text-muted-foreground bg-muted border-border",
      )}
    >
      {method}
    </span>
  );
}

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Latency" value={`${detail.latencyMs}ms`} />
        <MetricCard label="Availability" value={detail.availability} />
        <MetricCard label="Objects available" value={detail.objectsAvailable} />
        <MetricCard label="Last sync" value={detail.lastSyncRelative} />
      </div>

      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-medium">Connection</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-2 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Base URL</dt>
              <dd className="truncate font-mono text-xs">{detail.baseUrl}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Connection</dt>
              <dd className="font-medium">{detail.connectionName}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Authentication</dt>
              <dd className="font-medium">{detail.authentication}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function DiscoverTab({ detail, onAskQuestion, onOpenPlayground, onSelectEndpoint }) {
  const { knowledge } = detail;
  const primaryEndpoint = detail.endpoints[0];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="size-4 text-primary" aria-hidden />
          AI intelligence generated from this API
        </div>
        <p className={cn(CAPTION, "mt-1")}>
          Business context, functions, and ready-to-use patterns for agents and flows.
        </p>
      </div>

      <section>
        <p className={SECTION_EYEBROW}>Purpose</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{knowledge.purpose}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <p className={SECTION_EYEBROW}>Business functions</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {knowledge.businessFunctions.map((f) => (
              <Badge key={f} variant="secondary">{f}</Badge>
            ))}
          </ul>
        </section>
        <section>
          <p className={SECTION_EYEBROW}>Suggested use cases</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {knowledge.suggestedUseCases.map((u) => (
              <Badge key={u} variant="outline">{u}</Badge>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <p className={SECTION_EYEBROW}>Suggested questions</p>
        <ul className="mt-3 space-y-2">
          {knowledge.suggestedQuestions.map((q) => (
            <li key={q}>
              {onAskQuestion ? (
                <button
                  type="button"
                  onClick={() => onAskQuestion(q)}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
                  {q}
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm">
                  <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
                  {q}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {primaryEndpoint ? (
        <section className="rounded-lg border border-border bg-muted/20 p-4">
          <p className={SECTION_EYEBROW}>Primary endpoint</p>
          <button
            type="button"
            onClick={() => onSelectEndpoint?.(primaryEndpoint.id)}
            className="mt-2 flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left font-mono text-sm transition-colors hover:border-primary/30"
          >
            <MethodBadge method={primaryEndpoint.method} />
            {primaryEndpoint.path}
          </button>
          {onOpenPlayground ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => onOpenPlayground(primaryEndpoint.id)}
            >
              <Play data-icon="inline-start" aria-hidden />
              Try in Playground
            </Button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function EndpointsTab({ detail, selectedEndpointId, onSelectEndpoint, onTryInPlayground }) {
  const selected =
    detail.endpoints.find((e) => e.id === selectedEndpointId) ?? detail.endpoints[0];

  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
      <aside className="flex w-full shrink-0 flex-col gap-1 overflow-y-auto rounded-xl border border-border bg-muted/10 p-3 md:w-56 lg:w-64">
        <p className={SECTION_EYEBROW}>API endpoints</p>
        <ul className="mt-2 space-y-1">
          {detail.endpoints.map((ep) => (
            <li key={ep.id}>
              <button
                type="button"
                onClick={() => onSelectEndpoint(ep.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
                  selected?.id === ep.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <MethodBadge method={ep.method} />
                <span className="truncate font-mono text-xs">{ep.path}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {selected ? (
        <div className="min-w-0 flex-1 space-y-4 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MethodBadge method={selected.method} />
              <h3 className="font-mono text-lg font-semibold">{selected.path}</h3>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => onTryInPlayground(selected.id)}>
              <Play data-icon="inline-start" aria-hidden />
              Try in Playground
            </Button>
          </div>
          <p className={CAPTION}>{selected.summary}</p>

          <Card className="gap-0 py-0 shadow-none">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium">Headers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {selected.headers.map((h) => (
                <div
                  key={h.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs font-medium">{h.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{h.example}</span>
                  {h.required ? (
                    <Badge variant="outline" className="text-[10px]">Required</Badge>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 shadow-none">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {selected.parameters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parameters.</p>
              ) : (
                selected.parameters.map((p) => (
                  <div
                    key={p.name}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs font-medium">{p.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{p.type}</Badge>
                    {p.required ? (
                      <Badge variant="outline" className="text-[10px]">Required</Badge>
                    ) : null}
                    {p.example ? (
                      <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                        e.g. {p.example}
                      </span>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 shadow-none">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium">Response schema</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="mb-2 font-mono text-sm font-medium">{selected.responseSchema.type}</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.responseSchema.fields.map((field) => (
                  <Badge key={field} variant="outline" className="font-mono text-[10px]">
                    {field}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function PlaygroundTab({ detail, selectedEndpointId, onSelectEndpoint }) {
  const endpoint =
    detail.endpoints.find((e) => e.id === selectedEndpointId) ?? detail.endpoints[0];
  const [paramValues, setParamValues] = useState({});
  const [response, setResponse] = useState(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const defaults = {};
    endpoint?.parameters.forEach((p) => {
      if (p.example) defaults[p.name] = p.example;
    });
    setParamValues(defaults);
    setResponse(null);
  }, [endpoint?.id]);

  if (!endpoint) {
    return <p className="text-sm text-muted-foreground">No endpoints available.</p>;
  }

  const requestLine = buildPlaygroundRequest(endpoint, paramValues);

  function handleExecute() {
    setExecuting(true);
    setResponse(null);
    window.setTimeout(() => {
      setResponse(endpoint.mockResponse);
      setExecuting(false);
    }, 600);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {detail.endpoints.map((ep) => (
          <Button
            key={ep.id}
            type="button"
            size="sm"
            variant={endpoint.id === ep.id ? "default" : "outline"}
            className="h-8 font-mono text-xs"
            onClick={() => onSelectEndpoint(ep.id)}
          >
            <MethodBadge method={ep.method} />
            {ep.path}
          </Button>
        ))}
      </div>

      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-medium">Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <pre className="rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-sm">
            {requestLine}
          </pre>

          {endpoint.parameters.length > 0 ? (
            <div className="space-y-3">
              <p className={SECTION_EYEBROW}>Parameters</p>
              {endpoint.parameters.map((p) => (
                <div key={p.name} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <label className="w-28 shrink-0 font-mono text-xs text-muted-foreground">
                    {p.name}
                  </label>
                  <Input
                    value={paramValues[p.name] ?? ""}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                    }
                    placeholder={p.example ?? p.type}
                    className="h-8 font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <Button type="button" size="sm" onClick={handleExecute} disabled={executing}>
            <Play data-icon="inline-start" aria-hidden />
            {executing ? "Executing…" : "Execute"}
          </Button>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-medium">Response</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {response ? (
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-xs leading-relaxed">
              {JSON.stringify(response, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              {executing ? "Waiting for response…" : "Execute a request to see the response."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OperationsTab({ detail }) {
  const { operations } = detail;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Rate limit" value={operations.rateLimit} />
        <MetricCard label="Quota used" value={`${operations.rateLimitUsed}%`} />
        <MetricCard label="Error rate" value={operations.errorRate} />
      </div>

      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-medium">Sync & health</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-2 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Refresh cadence</dt>
              <dd className="font-medium">{operations.refreshCadence}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Last fetch status</dt>
              <dd className="font-medium">{operations.lastFetchStatus}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-medium">Recent requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4">
          {operations.recentRequests.map((req, i) => (
            <div
              key={`${req.path}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <MethodBadge method={req.method} />
                <span className="font-mono text-xs">{req.path}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={req.status >= 400 ? "destructive" : "secondary"}
                  className="font-mono text-[10px]"
                >
                  {req.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{req.at}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ApiDetailView({
  record,
  hubLinks = [],
  hubs = [],
  canEdit = true,
  canCreate = true,
  onClose,
  onNavigateToHub,
  onLinkToHub,
  onUnlinkFromHub,
  onCreateHub,
  className,
}) {
  const detail = useMemo(() => getApiDetail(record), [record?.id, record?.name]);
  const [mainTab, setMainTab] = useState("overview");
  const [panelTab, setPanelTab] = useState("ask");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [askSeedPrompt, setAskSeedPrompt] = useState("");
  const [selectedEndpointId, setSelectedEndpointId] = useState(
    () => detail.endpoints[0]?.id,
  );

  useEffect(() => {
    setSelectedEndpointId(detail.endpoints[0]?.id);
  }, [detail.id, detail.endpoints]);

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

  function handleOpenPlayground(endpointId) {
    if (endpointId) setSelectedEndpointId(endpointId);
    setMainTab("playground");
    setMobilePanelOpen(false);
  }

  const panelProps = {
    detail,
    record,
    hubLinks,
    hubs,
    canEdit,
    canCreate,
    tab: panelTab,
    onTabChange: setPanelTab,
    seedPrompt: askSeedPrompt,
    onSeedPromptApplied: () => setAskSeedPrompt(""),
    onNavigateToHub,
    onLinkToHub,
    onUnlinkFromHub,
    onCreateHub,
    onOpenPlayground: () => handleOpenPlayground(selectedEndpointId),
  };

  return (
    <div className={cn("flex h-full w-full flex-col bg-background", className)}>
      <header className="shrink-0 border-b border-border bg-card/50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">{detail.title}</h1>
            <SourceBadge record={record} size="sm" />
            <Badge variant="outline">{detail.version}</Badge>
            <Badge
              variant={detail.status === "Connected" ? "default" : "destructive"}
              className={detail.status === "Connected" ? "bg-emerald-600" : undefined}
            >
              {detail.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openMobilePanel(panelTab)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              title="Open API assistant"
              aria-label="Open API assistant"
            >
              <MessageSquare className="size-4" />
            </button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
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
              <TabsContent value="discover" className="mt-0">
                <DiscoverTab
                  detail={detail}
                  onAskQuestion={handleAskFromInsight}
                  onOpenPlayground={handleOpenPlayground}
                  onSelectEndpoint={(id) => {
                    setSelectedEndpointId(id);
                    setMainTab("endpoints");
                  }}
                />
              </TabsContent>
              <TabsContent value="endpoints" className="mt-0 flex min-h-[480px] flex-col">
                <EndpointsTab
                  detail={detail}
                  selectedEndpointId={selectedEndpointId}
                  onSelectEndpoint={setSelectedEndpointId}
                  onTryInPlayground={handleOpenPlayground}
                />
              </TabsContent>
              <TabsContent value="usage" className="mt-0">
                <SourceUsageTab usage={detail.usage} />
              </TabsContent>
              <TabsContent value="playground" className="mt-0">
                <PlaygroundTab
                  detail={detail}
                  selectedEndpointId={selectedEndpointId}
                  onSelectEndpoint={setSelectedEndpointId}
                />
              </TabsContent>
              <TabsContent value="operations" className="mt-0">
                <OperationsTab detail={detail} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex shrink-0 items-center gap-1 border-t border-border bg-background px-2 py-2 lg:hidden">
            {API_PANEL_TABS.map(({ id, label }) => (
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
          <ApiRightPanel key={record?.id} {...panelProps} />
        </div>
      </div>

      <Sheet open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
        <SheetContent side="bottom" className="h-[min(88vh,720px)] gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-sm">API assistant</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ApiRightPanel key={`mobile-${record?.id}`} {...panelProps} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
