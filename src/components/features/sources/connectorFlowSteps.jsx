/**
 * Connector flow steps for the Add Source wizard:
 * Cloud Storage, Databases, APIs, and Enterprise Applications.
 *
 * Connections/discovery are simulated (this is a front-end prototype) but the
 * selections collected here drive real library records on finish.
 */

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Database,
  ListTree,
  Loader2,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  API_AI_OPTIONS,
  API_AUTH_METHODS,
  API_FETCH_STRATEGIES,
  API_SCHEDULE_OPTIONS,
  API_TYPES,
  CLOUD_BROWSE_TREE,
  CLOUD_IMPORT_MODES,
  CLOUD_PROVIDERS,
  DATABASE_PROVIDERS,
  DB_DISCOVERY,
  DB_EMBED_COLUMNS,
  DB_EMBED_STRATEGIES,
  DB_SYNC_TYPES,
  DEFAULT_API_OBJECTS,
  ENTERPRISE_APPS,
  SYNC_FREQUENCIES,
  getApiType,
  getDatabaseProvider,
  getEnterpriseApp,
  getEnterpriseObjects,
} from "@/data/addSourceCatalog";
import {
  CheckRow,
  Monogram,
  ProviderGrid,
  ProviderTile,
  RadioRow,
  StatTile,
  WizardSection,
} from "@/components/features/sources/wizardPrimitives";

function toggleArr(arr = [], id) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

// DB sync cadence is a focused subset of the cloud frequencies.
const DB_SYNC_FREQUENCIES = SYNC_FREQUENCIES.filter((f) => f.id !== "manual");

/** Simulated "connect / authorize" affordance used by cloud + enterprise. */
function ConnectPanel({ connected, onConnected, title, detail, accountEmail }) {
  const [connecting, setConnecting] = useState(false);

  if (connected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/5 px-4 py-3">
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Connected</p>
          <p className="truncate text-xs text-muted-foreground">
            {title}
            {accountEmail ? ` · ${accountEmail}` : ""}
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px]">Active</Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-8 text-center">
      <Plug className="size-8 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-sm font-medium text-foreground">Connect {title}</p>
        {detail ? <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      <Button
        type="button"
        disabled={connecting}
        onClick={() => {
          setConnecting(true);
          window.setTimeout(() => {
            setConnecting(false);
            onConnected();
          }, 900);
        }}
      >
        {connecting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {connecting ? "Authorizing…" : "Authorize"}
      </Button>
    </div>
  );
}

/** Simulated test/scan button that flips a flag after a short delay. */
function SimulateButton({ done, onDone, idleLabel, busyLabel, doneLabel, variant = "outline" }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant={done ? "outline" : variant}
      disabled={busy}
      onClick={() => {
        if (done) return;
        setBusy(true);
        window.setTimeout(() => {
          setBusy(false);
          onDone();
        }, 900);
      }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {done ? (
        <>
          <CheckCircle2 data-icon="inline-start" aria-hidden />
          {doneLabel}
        </>
      ) : busy ? busyLabel : idleLabel}
    </Button>
  );
}

/** Brief scanning shimmer that reveals discovery results. */
function useScan(active) {
  const [scanning, setScanning] = useState(true);
  useEffect(() => {
    if (!active) return undefined;
    const id = window.setTimeout(() => setScanning(false), 1000);
    return () => window.clearTimeout(id);
  }, [active]);
  return scanning;
}

function ScanningState({ label }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// ═══ CLOUD STORAGE ═══════════════════════════════════════════════════════════

export function CloudProviderStep({ state, update }) {
  return (
    <WizardSection title="Cloud providers" hint="Pick the storage account you'd like to import from.">
      <ProviderGrid>
        {CLOUD_PROVIDERS.map((p) => (
          <ProviderTile
            key={p.id}
            provider={p}
            selected={state.cloud?.provider === p.id}
            onClick={() => update("cloud", { provider: p.id, connected: false, selected: [] })}
          />
        ))}
      </ProviderGrid>
    </WizardSection>
  );
}

export function CloudConnectStep({ state, update }) {
  const provider = CLOUD_PROVIDERS.find((p) => p.id === state.cloud?.provider);
  return (
    <ConnectPanel
      connected={state.cloud?.connected}
      onConnected={() => update("cloud", { connected: true })}
      title={provider?.label ?? "cloud storage"}
      detail="Aziron will be able to read the files and folders you select."
      accountEmail="john@company.com"
    />
  );
}

export function CloudBrowseStep({ state, update }) {
  const selected = state.cloud?.selected ?? [];
  const selectedIds = new Set(selected.map((f) => f.id));

  function toggleFile(folder, file) {
    const exists = selectedIds.has(file.id);
    const next = exists
      ? selected.filter((f) => f.id !== file.id)
      : [...selected, { id: file.id, name: file.name, sizeKb: file.sizeKb, folder: folder.name }];
    update("cloud", { selected: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Select files to import.</p>
        <Badge variant={selected.length ? "default" : "secondary"} className="text-[10px]">
          {selected.length} selected
        </Badge>
      </div>
      <div className="flex flex-col gap-4">
        {CLOUD_BROWSE_TREE.map((folder) => (
          <div key={folder.id} className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ListTree className="size-3.5" aria-hidden />
              {folder.name}
            </p>
            <div className="flex flex-col gap-1.5">
              {folder.files.map((file) => (
                <CheckRow
                  key={file.id}
                  checked={selectedIds.has(file.id)}
                  onToggle={() => toggleFile(folder, file)}
                >
                  <span className="truncate text-sm text-foreground">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(file.sizeKb / 1024).toFixed(1)} MB
                  </span>
                </CheckRow>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CloudSyncStep({ state, update }) {
  const cloud = state.cloud;
  return (
    <div className="flex flex-col gap-5">
      <WizardSection title="Import mode">
        <div className="flex flex-col gap-2">
          {CLOUD_IMPORT_MODES.map((mode) => (
            <RadioRow
              key={mode.id}
              label={mode.label}
              description={mode.description}
              selected={cloud?.importMode === mode.id}
              onClick={() => update("cloud", { importMode: mode.id })}
            />
          ))}
        </div>
      </WizardSection>
      <WizardSection title="Sync frequency">
        <div className="flex flex-col gap-2">
          {SYNC_FREQUENCIES.map((freq) => (
            <RadioRow
              key={freq.id}
              label={freq.label}
              description={freq.description}
              selected={cloud?.syncFreq === freq.id}
              onClick={() => update("cloud", { syncFreq: freq.id })}
            />
          ))}
        </div>
      </WizardSection>
    </div>
  );
}

// ═══ DATABASES ═══════════════════════════════════════════════════════════════

export function DbSelectStep({ state, update }) {
  return (
    <WizardSection title="Database engines" hint="Choose the database you want to connect.">
      <ProviderGrid>
        {DATABASE_PROVIDERS.map((p) => (
          <ProviderTile
            key={p.id}
            provider={p}
            selected={state.db?.provider === p.id}
            onClick={() =>
              update("db", {
                provider: p.id,
                tested: false,
                connection: { ...state.db?.connection, port: p.defaultPort },
              })
            }
          />
        ))}
      </ProviderGrid>
    </WizardSection>
  );
}

export function DbConnectStep({ state, update }) {
  const provider = getDatabaseProvider(state.db?.provider);
  const conn = state.db?.connection ?? {};
  const setConn = (partial) => update("db", { connection: { ...conn, ...partial }, tested: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Monogram short={provider.short} color={provider.color} className="size-7 text-[10px]" />
        Connecting to {provider.label}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="db-name">Database name</Label>
        <Input
          id="db-name"
          value={conn.name ?? ""}
          placeholder="Customer Analytics"
          onChange={(e) => setConn({ name: e.target.value })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="db-host">Host</Label>
          <Input
            id="db-host"
            value={conn.host ?? ""}
            placeholder="db.internal.company.com"
            onChange={(e) => setConn({ host: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="db-port">Port</Label>
          <Input
            id="db-port"
            value={conn.port ?? provider.defaultPort}
            onChange={(e) => setConn({ port: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="db-user">Username</Label>
          <Input
            id="db-user"
            value={conn.username ?? ""}
            placeholder="readonly_user"
            onChange={(e) => setConn({ username: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="db-pass">Password</Label>
          <Input
            id="db-pass"
            type="password"
            value={conn.password ?? ""}
            placeholder="••••••••"
            onChange={(e) => setConn({ password: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium text-foreground">Require SSL</span>
        </div>
        <Switch
          checked={conn.ssl ?? true}
          onCheckedChange={(checked) => setConn({ ssl: checked })}
          aria-label="Require SSL"
        />
      </div>

      <div className="flex items-center gap-3">
        <SimulateButton
          done={state.db?.tested}
          onDone={() => update("db", { tested: true })}
          idleLabel="Test connection"
          busyLabel="Testing…"
          doneLabel="Connection verified"
        />
        {state.db?.tested ? (
          <span className="text-xs text-success">Reachable · credentials accepted</span>
        ) : null}
      </div>
    </div>
  );
}

export function DbDiscoverStep({ state }) {
  const scanning = useScan(state.type === "databases");
  if (scanning) return <ScanningState label="Scanning schemas and tables…" />;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Schemas found" value={DB_DISCOVERY.schemas.length} />
        <StatTile label="Tables found" value={DB_DISCOVERY.totalTables} accent="#7c3aed" />
      </div>
      <WizardSection title="Schemas">
        <div className="flex flex-wrap gap-2">
          {DB_DISCOVERY.schemas.map((schema) => (
            <Badge key={schema.id} variant="outline" className="gap-1.5">
              <Database className="size-3" aria-hidden />
              {schema.name}
              <span className="text-muted-foreground">· {schema.tables.length}</span>
            </Badge>
          ))}
        </div>
      </WizardSection>
      <p className="text-xs text-muted-foreground">
        Continue to choose which tables become searchable sources.
      </p>
    </div>
  );
}

export function DbSelectDataStep({ state, update }) {
  const selected = state.db?.selectedTableIds ?? [];
  const selectedSet = new Set(selected);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Select tables, views, or collections.</p>
        <Badge variant={selected.length ? "default" : "secondary"} className="text-[10px]">
          {selected.length} selected
        </Badge>
      </div>
      {DB_DISCOVERY.schemas.map((schema) => (
        <div key={schema.id} className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Table2 className="size-3.5" aria-hidden />
            {schema.name}
          </p>
          <div className="flex flex-col gap-1.5">
            {schema.tables.map((table) => {
              const key = `${schema.id}/${table.id}`;
              return (
                <CheckRow
                  key={key}
                  checked={selectedSet.has(key)}
                  onToggle={() => update("db", { selectedTableIds: toggleArr(selected, key) })}
                >
                  <span className="truncate text-sm text-foreground">{table.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {table.rowCount.toLocaleString()} rows
                  </span>
                </CheckRow>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DbAiStep({ state, update }) {
  const db = state.db;
  const columns = db?.columnIds ?? [];
  const columnsSet = new Set(columns);

  return (
    <div className="flex flex-col gap-5">
      <WizardSection title="Embedding strategy" hint="How rows are turned into searchable vectors.">
        <div className="flex flex-col gap-2">
          {DB_EMBED_STRATEGIES.map((strategy) => (
            <RadioRow
              key={strategy.id}
              label={strategy.label}
              description={strategy.description}
              selected={db?.embedStrategy === strategy.id}
              onClick={() => update("db", { embedStrategy: strategy.id })}
            />
          ))}
        </div>
      </WizardSection>

      {db?.embedStrategy === "selected" ? (
        <WizardSection title="Columns to embed">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {DB_EMBED_COLUMNS.map((col) => (
              <CheckRow
                key={col.id}
                checked={columnsSet.has(col.id)}
                onToggle={() => update("db", { columnIds: toggleArr(columns, col.id) })}
              >
                <span className="truncate font-mono text-xs text-foreground">{col.label}</span>
                {col.recommended ? (
                  <Badge variant="secondary" className="text-[10px]">Recommended</Badge>
                ) : null}
              </CheckRow>
            ))}
          </div>
        </WizardSection>
      ) : null}
    </div>
  );
}

export function DbSyncStep({ state, update }) {
  const db = state.db;
  return (
    <div className="flex flex-col gap-5">
      <WizardSection title="Sync type">
        <div className="flex flex-col gap-2">
          {DB_SYNC_TYPES.map((type) => (
            <RadioRow
              key={type.id}
              label={type.label}
              description={type.description}
              selected={db?.syncType === type.id}
              onClick={() => update("db", { syncType: type.id })}
            />
          ))}
        </div>
      </WizardSection>
      <WizardSection title="Frequency">
        <div className="flex flex-col gap-2">
          {DB_SYNC_FREQUENCIES.map((freq) => (
            <RadioRow
              key={freq.id}
              label={freq.label}
              description={freq.description}
              selected={db?.syncFreq === freq.id}
              onClick={() => update("db", { syncFreq: freq.id })}
            />
          ))}
        </div>
      </WizardSection>
    </div>
  );
}

// ═══ APIs ═════════════════════════════════════════════════════════════════════

export function ApiTypeStep({ state, update }) {
  return (
    <WizardSection title="API type" hint="What kind of API are you connecting?">
      <ProviderGrid>
        {API_TYPES.map((t) => (
          <ProviderTile
            key={t.id}
            provider={t}
            selected={state.api?.apiType === t.id}
            onClick={() => update("api", { apiType: t.id, tested: false })}
          />
        ))}
      </ProviderGrid>
    </WizardSection>
  );
}

export function ApiConnectStep({ state, update }) {
  const apiType = getApiType(state.api?.apiType);
  const conn = state.api?.connection ?? {};
  const setConn = (partial) => update("api", { connection: { ...conn, ...partial }, tested: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Monogram short={apiType.short} color={apiType.color} className="size-7 text-[10px]" />
        {apiType.label} connection
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="api-name">Name</Label>
        <Input
          id="api-name"
          value={conn.name ?? ""}
          placeholder="Salesforce API"
          onChange={(e) => setConn({ name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="api-base">Base URL</Label>
        <Input
          id="api-base"
          value={conn.baseUrl ?? ""}
          placeholder="https://api.example.com/v2"
          onChange={(e) => setConn({ baseUrl: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="api-auth">Authentication</Label>
        <Select
          value={conn.auth ?? "oauth2"}
          onValueChange={(value) => setConn({ auth: value })}
        >
          <SelectTrigger id="api-auth">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {API_AUTH_METHODS.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <SimulateButton
          done={state.api?.tested}
          onDone={() => update("api", { tested: true })}
          idleLabel="Test connection"
          busyLabel="Testing…"
          doneLabel="Connection verified"
        />
        {state.api?.tested ? (
          <span className="text-xs text-success">200 OK · authenticated</span>
        ) : null}
      </div>
    </div>
  );
}

export function ApiDiscoverStep({ state }) {
  const scanning = useScan(state.type === "apis");
  if (scanning) return <ScanningState label="Discovering endpoints…" />;

  return (
    <div className="flex flex-col gap-4">
      <StatTile label="Endpoints discovered" value={DEFAULT_API_OBJECTS.length} accent="#d97706" />
      <WizardSection title="Available objects">
        <div className="flex flex-col gap-1.5">
          {DEFAULT_API_OBJECTS.map((obj) => (
            <div
              key={obj.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Search className="size-3.5 text-muted-foreground" aria-hidden />
                {obj.name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {obj.itemCount.toLocaleString()} items
              </span>
            </div>
          ))}
        </div>
      </WizardSection>
    </div>
  );
}

export function ApiObjectsStep({ state, update }) {
  const selected = state.api?.objectIds ?? [];
  const selectedSet = new Set(selected);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Choose which objects become sources.</p>
        <Badge variant={selected.length ? "default" : "secondary"} className="text-[10px]">
          {selected.length} selected
        </Badge>
      </div>
      <div className="flex flex-col gap-1.5">
        {DEFAULT_API_OBJECTS.map((obj) => (
          <CheckRow
            key={obj.id}
            checked={selectedSet.has(obj.id)}
            onToggle={() => update("api", { objectIds: toggleArr(selected, obj.id) })}
          >
            <span className="truncate text-sm text-foreground">{obj.name}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {obj.itemCount.toLocaleString()} items
            </span>
          </CheckRow>
        ))}
      </div>
    </div>
  );
}

export function ApiSyncStep({ state, update }) {
  const api = state.api;
  return (
    <div className="flex flex-col gap-5">
      <WizardSection title="Fetch strategy">
        <div className="flex flex-col gap-2">
          {API_FETCH_STRATEGIES.map((strategy) => (
            <RadioRow
              key={strategy.id}
              label={strategy.label}
              description={strategy.description}
              selected={api?.fetchStrategy === strategy.id}
              onClick={() => update("api", { fetchStrategy: strategy.id })}
            />
          ))}
        </div>
      </WizardSection>

      {api?.fetchStrategy === "scheduled" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="api-schedule">Schedule</Label>
          <Select
            value={api?.schedule ?? "15m"}
            onValueChange={(value) => update("api", { schedule: value })}
          >
            <SelectTrigger id="api-schedule">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {API_SCHEDULE_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}

export function ApiAiStep({ state, update }) {
  const ai = state.api?.ai ?? {};
  return (
    <WizardSection title="Knowledge enrichment" hint="Aziron can build extra indexes over API responses.">
      <div className="flex flex-col gap-2">
        {API_AI_OPTIONS.map((opt) => (
          <div
            key={opt.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </div>
            <Switch
              checked={ai[opt.id] ?? false}
              onCheckedChange={(checked) => update("api", { ai: { ...ai, [opt.id]: checked } })}
              aria-label={opt.label}
            />
          </div>
        ))}
      </div>
    </WizardSection>
  );
}

// ═══ ENTERPRISE APPLICATIONS ══════════════════════════════════════════════════

export function EnterpriseSelectStep({ state, update }) {
  return (
    <WizardSection title="Enterprise applications" hint="Connect a SaaS app to ingest its records.">
      <ProviderGrid>
        {ENTERPRISE_APPS.map((app) => (
          <ProviderTile
            key={app.id}
            provider={app}
            selected={state.ent?.app === app.id}
            onClick={() => update("ent", { app: app.id, connected: false, objectIds: [] })}
          />
        ))}
      </ProviderGrid>
    </WizardSection>
  );
}

export function EnterpriseConnectStep({ state, update }) {
  const app = getEnterpriseApp(state.ent?.app);
  return (
    <ConnectPanel
      connected={state.ent?.connected}
      onConnected={() => update("ent", { connected: true })}
      title={app?.label ?? "application"}
      detail="Authorize Aziron to read records from your workspace."
      accountEmail="workspace@company.com"
    />
  );
}

export function EnterpriseDiscoverStep({ state }) {
  const scanning = useScan(state.type === "enterprise");
  const objects = getEnterpriseObjects(state.ent?.app);
  const app = getEnterpriseApp(state.ent?.app);
  if (scanning) return <ScanningState label={`Discovering ${app?.label ?? "app"} objects…`} />;

  return (
    <div className="flex flex-col gap-4">
      <StatTile label="Objects discovered" value={objects.length} accent="#059669" />
      <WizardSection title="Available objects">
        <div className="flex flex-col gap-1.5">
          {objects.map((obj) => (
            <div
              key={obj.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2.5"
            >
              <span className="text-sm text-foreground">{obj.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {obj.itemCount.toLocaleString()} records
              </span>
            </div>
          ))}
        </div>
      </WizardSection>
    </div>
  );
}

export function EnterpriseObjectsStep({ state, update }) {
  const objects = getEnterpriseObjects(state.ent?.app);
  const selected = state.ent?.objectIds ?? [];
  const selectedSet = new Set(selected);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Choose which objects become sources.</p>
        <Badge variant={selected.length ? "default" : "secondary"} className="text-[10px]">
          {selected.length} selected
        </Badge>
      </div>
      <div className="flex flex-col gap-1.5">
        {objects.map((obj) => (
          <CheckRow
            key={obj.id}
            checked={selectedSet.has(obj.id)}
            onToggle={() => update("ent", { objectIds: toggleArr(selected, obj.id) })}
          >
            <span className="truncate text-sm text-foreground">{obj.name}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {obj.itemCount.toLocaleString()} records
            </span>
          </CheckRow>
        ))}
      </div>
    </div>
  );
}

export function EnterpriseSyncStep({ state, update }) {
  return (
    <WizardSection title="Sync frequency" hint="How often Aziron pulls new records.">
      <div className="flex flex-col gap-2">
        {SYNC_FREQUENCIES.map((freq) => (
          <RadioRow
            key={freq.id}
            label={freq.label}
            description={freq.description}
            selected={state.ent?.syncFreq === freq.id}
            onClick={() => update("ent", { syncFreq: freq.id })}
          />
        ))}
      </div>
    </WizardSection>
  );
}
