import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Info,
  Plus,
  Search,
  User,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CAPTION } from "@/lib/typography";

import { CloudConnectionSwitcher } from "@/components/features/knowledge/cloud/CloudConnectionSwitcher";

import {
  AZIRON_LOGO,
  CLOUD_ENVIRONMENTS,
  formatConnectionLabel,
  getMockOneDriveFilesForConnection,
  getOneDriveConnections,
  GOOGLE_DRIVE_LOGO,
  MOCK_ACCOUNTS,
  MOCK_EXISTING_CONNECTIONS,
  ONEDRIVE_LOGO,
} from "./oneDriveMockData";

const STEPS = {
  INTRO: "intro",
  AUTH_METHOD: "auth-method",
  CONFIG: "config",
  SIGN_IN: "sign-in",
  ADMIN_APPROVAL: "admin-approval",
  CONNECTING: "connecting",
  CONNECTIONS: "connections",
  LOADING_FILES: "loading-files",
  FILE_PICKER: "file-picker",
};

const AUTH_OPTIONS = [
  {
    value: "default",
    title: "OAuth2 (Recommended)",
    description:
      "Quickly connect using a preconfigured OAuth2 app. No setup required.",
  },
  {
    value: "custom",
    title: "Custom OAuth2 App (Advanced)",
    description:
      "Connect using your own OAuth2 credentials for more flexibility and control.",
  },
];

function BrandMark({ src, className }) {
  return (
    <img src={src} alt="" draggable={false} className={cn("object-contain", className)} />
  );
}

function AuthMethodCard({ option, checked, onSelect }) {
  return (
    <FieldLabel
      className={cn(
        "cursor-pointer rounded-xl border p-4 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30",
      )}
    >
      <Field orientation="horizontal" className="items-start gap-3">
        <input
          type="radio"
          name="onedrive-auth"
          value={option.value}
          checked={checked}
          onChange={() => onSelect(option.value)}
          className="mt-1 size-4 shrink-0 accent-primary"
        />
        <FieldContent>
          <span className="text-sm font-semibold text-foreground">{option.title}</span>
          <FieldDescription>{option.description}</FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  );
}

function ConnectionCard({ logo, title, meta, onClick, className }) {
  const inner = (
    <Card className={cn("border-border", onClick && "cursor-pointer hover:bg-muted/30", className)}>
      <CardContent className="flex items-center gap-3 p-4">
        <BrandMark src={logo} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          <p className={cn(CAPTION, "mt-0.5")}>{meta}</p>
        </div>
        {onClick ? <ChevronRight className="text-muted-foreground" aria-hidden /> : null}
      </CardContent>
    </Card>
  );
  if (onClick) {
    return (
      <button type="button" className="w-full text-left" onClick={onClick}>
        {inner}
      </button>
    );
  }
  return inner;
}

function IntroStep({ authMethod, onAuthMethodChange }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex size-28 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20">
          <BrandMark src={ONEDRIVE_LOGO} className="size-14" />
        </div>
        <div className="flex items-center gap-3">
          <BrandMark src={AZIRON_LOGO} className="h-8 w-auto max-w-[48px]" />
          <ArrowRight className="text-muted-foreground" aria-hidden />
          <BrandMark src={ONEDRIVE_LOGO} className="size-10" />
        </div>
        <p className="text-sm font-medium text-foreground">Connect Aziron to OneDrive</p>
        <p className={cn(CAPTION, "max-w-md")}>
          Choose how you want to authenticate. You can switch methods later from connection
          settings.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {AUTH_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onAuthMethodChange(option.value)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
              authMethod === option.value
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-muted/30",
            )}
          >
            <span className="text-sm font-semibold text-foreground">
              OAuth2 ({option.value === "default" ? "OneDrive" : "OneDrive (Custom Credentials)"})
            </span>
            <span className={CAPTION}>
              {option.value === "default" ? "OAUTH" : "Provide your OAuth Client ID and Secret."}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AuthMethodStep({ authMethod, onAuthMethodChange }) {
  return (
    <FieldSet className="gap-4">
      <FieldLegend className="sr-only">Authentication method</FieldLegend>
      <div className="flex flex-col gap-3">
        {AUTH_OPTIONS.map((option) => (
          <AuthMethodCard
            key={option.value}
            option={option}
            checked={authMethod === option.value}
            onSelect={onAuthMethodChange}
          />
        ))}
      </div>
    </FieldSet>
  );
}

function ConfigStep({ connectionName, cloudEnv, onConnectionNameChange, onCloudEnvChange }) {
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <Alert>
        <Info aria-hidden />
        <AlertTitle>Custom Azure app</AlertTitle>
        <AlertDescription>
          If you use your own Azure app, set the redirect URI to your app callback and add
          Microsoft Graph delegated permissions:{" "}
          <span className="font-mono text-xs">Files.ReadWrite</span>,{" "}
          <span className="font-mono text-xs">offline_access</span>.
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="od-connection-name">
            Connection name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="od-connection-name"
            value={connectionName}
            onChange={(e) => onConnectionNameChange(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="od-cloud-env">
            Cloud environment <span className="text-destructive">*</span>
          </FieldLabel>
          <Select value={cloudEnv} onValueChange={onCloudEnvChange}>
            <SelectTrigger id="od-cloud-env" className="w-full">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {CLOUD_ENVIRONMENTS.map((env) => (
                  <SelectItem key={env.value} value={env.value}>
                    {env.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>Select your Microsoft cloud environment.</FieldDescription>
        </Field>

        <Collapsible open={permissionsOpen} onOpenChange={setPermissionsOpen}>
          <CollapsibleTrigger
            type="button"
            className="flex w-full items-center gap-2 text-sm font-medium text-foreground"
          >
            <ChevronDown
              className={cn("transition-transform", permissionsOpen && "rotate-180")}
              aria-hidden
            />
            Permissions
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <ul className={cn(CAPTION, "flex list-disc flex-col gap-1 pl-5")}>
              <li>Files.ReadWrite</li>
              <li>offline_access</li>
              <li>User.Read</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </FieldGroup>
    </div>
  );
}

function SignInOverlay({ accounts, onSelectAccount, onUseAnother, onClose }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <BrandMark src={ONEDRIVE_LOGO} className="size-5" />
          <span className="text-sm text-foreground">Sign in with Microsoft</span>
        </div>
        <div className="flex flex-col gap-1 px-6 py-6">
          <h3 className="text-center text-xl font-semibold text-foreground">Choose an account</h3>
          <p className={cn(CAPTION, "text-center")}>
            to continue to <span className="text-primary">Aziron</span>
          </p>
        </div>
        <Separator />
        <ul className="flex flex-col">
          {accounts.map((account) => (
            <li key={account.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                onClick={() => onSelectAccount(account)}
              >
                <Avatar className="size-10">
                  <AvatarFallback>{account.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{account.name}</p>
                  <p className={cn(CAPTION, "truncate")}>{account.email}</p>
                </div>
              </button>
              <Separator />
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              onClick={onUseAnother}
            >
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted/40">
                <User aria-hidden />
              </div>
              <span className="text-sm text-foreground">Use another account</span>
            </button>
          </li>
        </ul>
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button variant="ghost" type="button" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminApprovalStep({
  account,
  onAdminSignIn,
  onUsePersonalAccount,
  onCancel,
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <BrandMark src={ONEDRIVE_LOGO} className="size-10" />
      <div className="flex max-w-md flex-col gap-3 text-center">
        <h3 className="text-lg font-semibold text-foreground">Need admin approval</h3>
        <p className={cn(CAPTION, "text-center leading-relaxed")}>
          Your organisation requires an administrator to approve Aziron for OneDrive access.
          Signed in as <span className="font-medium text-foreground">{account.email}</span>.
          Ask your IT admin to grant consent, or sign in with an account that has permission.
        </p>
      </div>
      <div className="flex w-full max-w-md flex-col gap-2">
        <Button type="button" variant="default" className="w-full" onClick={onAdminSignIn}>
          Sign in with an admin account
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onUsePersonalAccount}>
          Use a personal Microsoft account
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Cancel connection
        </Button>
      </div>
    </div>
  );
}

function ConnectingStep() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Spinner className="size-10" />
      <p className="text-sm font-medium text-foreground">Connecting to OneDrive…</p>
      <p className={cn(CAPTION, "max-w-sm text-center")}>
        Completing OAuth authorization. This usually takes a few seconds.
      </p>
    </div>
  );
}

function ConnectionsStep({ connections, onSelectConnection, onAddConnection }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {connections.map((conn) => (
          <ConnectionCard
            key={conn.id}
            logo={conn.provider === "google-drive" ? GOOGLE_DRIVE_LOGO : ONEDRIVE_LOGO}
            title={conn.name}
            meta={`Connected by ${conn.connectedBy}, ${conn.connectedAt}`}
            onClick={() => onSelectConnection(conn)}
          />
        ))}
      </div>
      <Button type="button" variant="outline" className="w-full gap-2" onClick={onAddConnection}>
        <Plus data-icon="inline-start" aria-hidden />
        Add another connection
      </Button>
    </div>
  );
}

function LoadingFilesStep({
  connections,
  activeConnection,
  onSelectConnection,
  onAddConnection,
}) {
  return (
    <div className="flex flex-col gap-4">
      <CloudConnectionSwitcher
        logo={ONEDRIVE_LOGO}
        connections={connections}
        activeConnection={activeConnection}
        onSelectConnection={onSelectConnection}
        onAddConnection={onAddConnection}
        accountsLabel="OneDrive accounts"
      />
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Spinner className="size-10" />
        <p className="text-sm font-medium text-foreground">Loading existing files</p>
        <p className={cn(CAPTION, "max-w-sm text-center")}>
          Please wait… loading files that are already in your account.
        </p>
      </div>
    </div>
  );
}

function FilePickerStep({
  connections,
  activeConnection,
  onSelectConnection,
  onAddConnection,
  files,
  selectedIds,
  search,
  onSearchChange,
  onToggleFile,
  onToggleAll,
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, search]);

  const selectable = filtered.filter((f) => f.type === "file");
  const allSelected =
    selectable.length > 0 && selectable.every((f) => selectedIds.has(f.id));

  return (
    <div className="flex flex-col gap-4">
      <CloudConnectionSwitcher
        logo={ONEDRIVE_LOGO}
        connections={connections}
        activeConnection={activeConnection}
        onSelectConnection={onSelectConnection}
        onAddConnection={onAddConnection}
        accountsLabel="OneDrive accounts"
      />

      <InputGroup>
        <InputGroupAddon>
          <Search aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search files"
        />
      </InputGroup>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  role="checkbox"
                  aria-label="Select all files"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="size-4 rounded border-input accent-primary"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((file) => {
              const isFolder = file.type === "folder";
              const checked = selectedIds.has(file.id);
              return (
                <TableRow key={file.id} data-state={checked ? "selected" : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      role="checkbox"
                      aria-label={`Select ${file.name}`}
                      checked={checked}
                      disabled={isFolder}
                      onChange={() => onToggleFile(file.id)}
                      className="size-4 rounded border-input accent-primary disabled:opacity-40"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isFolder ? (
                        <Folder className="text-muted-foreground" aria-hidden />
                      ) : (
                        <FileText className="text-muted-foreground" aria-hidden />
                      )}
                      <span className="truncate font-medium text-foreground">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{file.size}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedIds.size > 0 && (
        <Alert>
          <Info className="size-4" />
          <AlertDescription>
            Selected files are linked from OneDrive. After you add them, use the link icon next to
            each file (or Download all) to save copies into your knowledge base for agents.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function OneDriveConnectionWizard({
  onComplete,
  onCancel,
  onBackToUpload,
  onStepMetaChange,
}) {
  const [step, setStep] = useState(STEPS.INTRO);
  const [authMethod, setAuthMethod] = useState("default");
  const [connectionName, setConnectionName] = useState("Microsoft OneDrive");
  const [cloudEnv, setCloudEnv] = useState("commercial");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [connections, setConnections] = useState(MOCK_EXISTING_CONNECTIONS);
  const [activeConnection, setActiveConnection] = useState(null);
  const [fileSearch, setFileSearch] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState(() => new Set());

  const displayConnectionName = useMemo(() => {
    if (activeConnection?.name) return activeConnection.name;
    return formatConnectionLabel(connectionName, selectedAccount?.email);
  }, [activeConnection, connectionName, selectedAccount]);

  const oneDriveConnections = useMemo(
    () => getOneDriveConnections(connections),
    [connections],
  );

  const pickerFiles = useMemo(
    () => getMockOneDriveFilesForConnection(activeConnection?.id),
    [activeConnection?.id],
  );

  const goTo = useCallback((next) => setStep(next), []);

  useEffect(() => {
    if (step !== STEPS.CONNECTING) return undefined;
    const timer = window.setTimeout(() => {
      const newConn = {
        id: `od-${Date.now()}`,
        provider: "onedrive",
        name: formatConnectionLabel(connectionName, selectedAccount?.email),
        connectedBy: selectedAccount?.name?.split(" ")[0] ?? "You",
        connectedAt: new Date().toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setConnections((prev) => [...prev, newConn]);
      setActiveConnection(newConn);
      goTo(STEPS.CONNECTIONS);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [step, connectionName, selectedAccount, goTo]);

  useEffect(() => {
    if (step !== STEPS.LOADING_FILES) return undefined;
    const timer = window.setTimeout(() => goTo(STEPS.FILE_PICKER), 1200);
    return () => window.clearTimeout(timer);
  }, [step, goTo]);

  const stepMeta = useMemo(() => {
    switch (step) {
      case STEPS.INTRO:
        return { title: "Connect OneDrive", showTryAnother: false };
      case STEPS.AUTH_METHOD:
        return { title: "Select an authentication method", showTryAnother: true };
      case STEPS.CONFIG:
        return { title: "Connect to Microsoft OneDrive", showTryAnother: true };
      case STEPS.SIGN_IN:
        return { title: "Connect to Microsoft OneDrive", showTryAnother: true };
      case STEPS.ADMIN_APPROVAL:
        return { title: "Admin approval required", showTryAnother: false };
      case STEPS.CONNECTING:
        return { title: "Connecting…", showTryAnother: false };
      case STEPS.CONNECTIONS:
        return { title: "Cloud connections", showTryAnother: false };
      case STEPS.LOADING_FILES:
      case STEPS.FILE_PICKER:
        return { title: "Pick files from OneDrive", showTryAnother: false };
      default:
        return { title: "OneDrive", showTryAnother: false };
    }
  }, [step]);

  useEffect(() => {
    onStepMetaChange?.(stepMeta);
  }, [stepMeta, onStepMetaChange]);

  function handleIntroNext() {
    if (authMethod === "custom") {
      goTo(STEPS.CONFIG);
    } else {
      goTo(STEPS.SIGN_IN);
    }
  }

  function handleAuthNext() {
    if (authMethod === "custom") goTo(STEPS.CONFIG);
    else goTo(STEPS.SIGN_IN);
  }

  function handleConfigSave() {
    goTo(STEPS.SIGN_IN);
  }

  function handleAccountSelect(account) {
    setSelectedAccount(account);
    if (account.requiresAdmin) {
      goTo(STEPS.ADMIN_APPROVAL);
    } else {
      goTo(STEPS.CONNECTING);
    }
  }

  function handleSelectConnection(conn) {
    setActiveConnection(conn);
    goTo(STEPS.LOADING_FILES);
  }

  function handleSwitchConnection(conn) {
    if (conn.id === activeConnection?.id) return;
    setActiveConnection(conn);
    setSelectedFileIds(new Set());
    setFileSearch("");
    goTo(STEPS.LOADING_FILES);
  }

  function handleToggleFile(id) {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleAll(e) {
    const checked = e.target.checked;
    const fileIds = pickerFiles.filter((f) => f.type === "file").map((f) => f.id);
    setSelectedFileIds(checked ? new Set(fileIds) : new Set());
  }

  function handleLoadFiles() {
    const selected = pickerFiles.filter((f) => selectedFileIds.has(f.id));
    onComplete?.({
      connection: activeConnection,
      selectedFiles: selected,
      authMethod,
      connectionName: displayConnectionName,
    });
  }

  const showSignInOverlay = step === STEPS.SIGN_IN;

  return (
    <div className="relative flex min-h-[360px] flex-col">
      {step === STEPS.INTRO && (
        <IntroStep authMethod={authMethod} onAuthMethodChange={setAuthMethod} />
      )}
      {step === STEPS.AUTH_METHOD && (
        <AuthMethodStep authMethod={authMethod} onAuthMethodChange={setAuthMethod} />
      )}
      {step === STEPS.CONFIG && (
        <ConfigStep
          connectionName={connectionName}
          cloudEnv={cloudEnv}
          onConnectionNameChange={setConnectionName}
          onCloudEnvChange={setCloudEnv}
        />
      )}
      {step === STEPS.ADMIN_APPROVAL && selectedAccount && (
        <AdminApprovalStep
          account={selectedAccount}
          onAdminSignIn={() => goTo(STEPS.CONNECTING)}
          onUsePersonalAccount={() => {
            const personal = MOCK_ACCOUNTS.find((a) => !a.requiresAdmin);
            if (personal) handleAccountSelect(personal);
          }}
          onCancel={onCancel}
        />
      )}
      {step === STEPS.CONNECTING && <ConnectingStep />}
      {step === STEPS.CONNECTIONS && (
        <ConnectionsStep
          connections={connections}
          onSelectConnection={handleSelectConnection}
          onAddConnection={() => goTo(STEPS.AUTH_METHOD)}
        />
      )}
      {step === STEPS.LOADING_FILES && (
        <LoadingFilesStep
          connections={oneDriveConnections}
          activeConnection={activeConnection}
          onSelectConnection={handleSwitchConnection}
          onAddConnection={() => goTo(STEPS.AUTH_METHOD)}
        />
      )}
      {step === STEPS.FILE_PICKER && (
        <FilePickerStep
          connections={oneDriveConnections}
          activeConnection={activeConnection}
          onSelectConnection={handleSwitchConnection}
          onAddConnection={() => goTo(STEPS.AUTH_METHOD)}
          files={pickerFiles}
          selectedIds={selectedFileIds}
          search={fileSearch}
          onSearchChange={setFileSearch}
          onToggleFile={handleToggleFile}
          onToggleAll={handleToggleAll}
        />
      )}

      {showSignInOverlay && (
        <SignInOverlay
          accounts={MOCK_ACCOUNTS}
          onSelectAccount={handleAccountSelect}
          onUseAnother={() => goTo(STEPS.CONNECTING)}
          onClose={onCancel}
        />
      )}

      <WizardFooter
        step={step}
        selectedFileCount={selectedFileIds.size}
        onCancel={onCancel}
        onBackToUpload={onBackToUpload}
        onBack={() => {
          if (step === STEPS.CONFIG) goTo(STEPS.AUTH_METHOD);
          else if (step === STEPS.AUTH_METHOD) goTo(STEPS.INTRO);
          else if (step === STEPS.FILE_PICKER) goTo(STEPS.CONNECTIONS);
          else onBackToUpload?.();
        }}
        onIntroNext={handleIntroNext}
        onAuthNext={handleAuthNext}
        onConfigSave={handleConfigSave}
        onTryAnother={() => goTo(STEPS.AUTH_METHOD)}
        onConnectionsNext={() => {
          const od = connections.find((c) => c.provider === "onedrive");
          if (od) handleSelectConnection(od);
        }}
        onLoadFiles={handleLoadFiles}
        onSignInSimulate={() => goTo(STEPS.CONNECTING)}
      />
    </div>
  );
}

function WizardFooter({
  step,
  selectedFileCount,
  onCancel,
  onBackToUpload,
  onBack,
  onIntroNext,
  onAuthNext,
  onConfigSave,
  onTryAnother,
  onConnectionsNext,
  onLoadFiles,
  onSignInSimulate,
}) {
  if (step === STEPS.CONNECTING || step === STEPS.LOADING_FILES || step === STEPS.ADMIN_APPROVAL) {
    return null;
  }

  if (step === STEPS.SIGN_IN) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" className="gap-1.5" onClick={onSignInSimulate}>
          Continue
          <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    );
  }

  if (step === STEPS.FILE_PICKER) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          className="gap-1.5"
          disabled={selectedFileCount === 0}
          onClick={onLoadFiles}
        >
          Add to hub
          <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    );
  }

  if (step === STEPS.CONNECTIONS) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" className="gap-1.5" onClick={onConnectionsNext}>
          Next
          <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    );
  }

  if (step === STEPS.CONFIG) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Button variant="outline" type="button" onClick={onTryAnother}>
          Try another method
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfigSave}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  if (step === STEPS.AUTH_METHOD) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" className="gap-1.5" onClick={onAuthNext}>
          Next
          <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
      <Button variant="ghost" type="button" className="gap-1.5" onClick={onBackToUpload}>
        <ArrowLeft data-icon="inline-start" aria-hidden />
        Back to upload
      </Button>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" className="gap-1.5" onClick={onIntroNext}>
          Next
          <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
