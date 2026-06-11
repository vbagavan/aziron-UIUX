import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { CloudFilePickerTable } from "@/components/features/knowledge/cloud/CloudFilePickerTable";
import { cn } from "@/lib/utils";
import { CAPTION } from "@/lib/typography";

import {
  AZIRON_LOGO,
  formatGoogleConnectionLabel,
  GOOGLE_AUTH_OPTIONS,
  GOOGLE_DRIVE_LOGO,
  MOCK_GOOGLE_ACCOUNTS,
  MOCK_GOOGLE_DRIVE_FILES,
  MOCK_GOOGLE_EXISTING_CONNECTIONS,
} from "./googleDriveMockData";

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

const AUTH_OPTIONS = GOOGLE_AUTH_OPTIONS;

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
          name="google-drive-auth"
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
          <BrandMark src={GOOGLE_DRIVE_LOGO} className="size-14" />
        </div>
        <div className="flex items-center gap-3">
          <BrandMark src={AZIRON_LOGO} className="h-8 w-auto max-w-[48px]" />
          <ArrowRight className="text-muted-foreground" aria-hidden />
          <BrandMark src={GOOGLE_DRIVE_LOGO} className="size-10" />
        </div>
        <p className="text-sm font-medium text-foreground">Connect Aziron to Google Drive</p>
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
              OAuth2 ({option.value === "default" ? "Google Drive" : "Google Drive (Custom Credentials)"})
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

function ConfigStep({ connectionName, onConnectionNameChange }) {
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <Alert>
        <Info aria-hidden />
        <AlertTitle>Custom Google Cloud project</AlertTitle>
        <AlertDescription>
          Create OAuth credentials in Google Cloud Console and enable the Google Drive API.
          Add the redirect URI for Aziron and request scope{" "}
          <span className="font-mono text-xs">https://www.googleapis.com/auth/drive.readonly</span>.
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="gd-connection-name">
            Connection name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="gd-connection-name"
            value={connectionName}
            onChange={(e) => onConnectionNameChange(e.target.value)}
          />
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
            Scopes
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <ul className={cn(CAPTION, "flex list-disc flex-col gap-1 pl-5")}>
              <li>drive.readonly — read files and metadata</li>
              <li>userinfo.email — identify the signed-in account</li>
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
          <BrandMark src={GOOGLE_DRIVE_LOGO} className="size-5" />
          <span className="text-sm text-foreground">Sign in with Google</span>
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
      <BrandMark src={GOOGLE_DRIVE_LOGO} className="size-10" />
      <div className="flex max-w-md flex-col gap-3 text-center">
        <h3 className="text-lg font-semibold text-foreground">Need admin approval</h3>
        <p className={cn(CAPTION, "text-center leading-relaxed")}>
          Your Google Workspace admin must approve Aziron for Drive access.
          Signed in as <span className="font-medium text-foreground">{account.email}</span>.
          Ask your IT admin to grant consent, or sign in with an account that has permission.
        </p>
      </div>
      <div className="flex w-full max-w-md flex-col gap-2">
        <Button type="button" variant="default" className="w-full" onClick={onAdminSignIn}>
          Sign in with an admin account
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onUsePersonalAccount}>
          Use a personal Google account
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
      <p className="text-sm font-medium text-foreground">Connecting to Google Drive…</p>
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
            logo={GOOGLE_DRIVE_LOGO}
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

function LoadingFilesStep({ connectionName }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
        <BrandMark src={GOOGLE_DRIVE_LOGO} className="size-6" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          Pick files from {connectionName}
        </span>
        <ChevronDown className="text-muted-foreground" aria-hidden />
      </div>
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
  connectionName,
  files,
  selectedIds,
  search,
  onSearchChange,
  onToggleFile,
  onToggleAll,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
        <BrandMark src={GOOGLE_DRIVE_LOGO} className="size-6" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          Pick files from {connectionName}
        </span>
        <ChevronDown className="text-muted-foreground" aria-hidden />
      </div>

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

      <CloudFilePickerTable
        files={files}
        selectedIds={selectedIds}
        search={search}
        onToggleFile={onToggleFile}
        onToggleAll={onToggleAll}
      />

      {selectedIds.size > 0 && (
        <Alert>
          <Info className="size-4" />
          <AlertDescription>
            Selected files are linked from Google Drive. After you add them, use the link icon next to
            each file (or Download all) to save copies into your knowledge base for agents.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function GoogleDriveConnectionWizard({
  onComplete,
  onCancel,
  onBackToUpload,
  onStepMetaChange,
}) {
  const [step, setStep] = useState(STEPS.INTRO);
  const [authMethod, setAuthMethod] = useState("default");
  const [connectionName, setConnectionName] = useState("Google Drive");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [connections, setConnections] = useState(MOCK_GOOGLE_EXISTING_CONNECTIONS);
  const [activeConnection, setActiveConnection] = useState(null);
  const [fileSearch, setFileSearch] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState(() => new Set());

  const displayConnectionName = useMemo(() => {
    if (activeConnection?.name) return activeConnection.name;
    return formatGoogleConnectionLabel(connectionName, selectedAccount?.email);
  }, [activeConnection, connectionName, selectedAccount]);

  const goTo = useCallback((next) => setStep(next), []);

  useEffect(() => {
    if (step !== STEPS.CONNECTING) return undefined;
    const timer = window.setTimeout(() => {
      const newConn = {
        id: `gd-${Date.now()}`,
        provider: "google-drive",
        name: formatGoogleConnectionLabel(connectionName, selectedAccount?.email),
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
        return { title: "Connect Google Drive", showTryAnother: false };
      case STEPS.AUTH_METHOD:
        return { title: "Select an authentication method", showTryAnother: true };
      case STEPS.CONFIG:
        return { title: "Connect to Google Drive", showTryAnother: true };
      case STEPS.SIGN_IN:
        return { title: "Connect to Google Drive", showTryAnother: true };
      case STEPS.ADMIN_APPROVAL:
        return { title: "Admin approval required", showTryAnother: false };
      case STEPS.CONNECTING:
        return { title: "Connecting…", showTryAnother: false };
      case STEPS.CONNECTIONS:
        return { title: "Cloud connections", showTryAnother: false };
      case STEPS.LOADING_FILES:
      case STEPS.FILE_PICKER:
        return { title: "Pick files from Google Drive", showTryAnother: false };
      default:
        return { title: "Google Drive", showTryAnother: false };
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
    const fileIds = MOCK_GOOGLE_DRIVE_FILES.filter((f) => f.type === "file").map((f) => f.id);
    setSelectedFileIds(checked ? new Set(fileIds) : new Set());
  }

  function handleLoadFiles() {
    const selected = MOCK_GOOGLE_DRIVE_FILES.filter((f) => selectedFileIds.has(f.id));
    onComplete?.({
      connection: activeConnection,
      selectedFiles: selected,
      authMethod,
      connectionName: displayConnectionName,
    });
  }

  const showSignInOverlay = step === STEPS.SIGN_IN;

  return (
    <div className="relative flex min-h-[min(68vh,640px)] flex-col">
      {step === STEPS.INTRO && (
        <IntroStep authMethod={authMethod} onAuthMethodChange={setAuthMethod} />
      )}
      {step === STEPS.AUTH_METHOD && (
        <AuthMethodStep authMethod={authMethod} onAuthMethodChange={setAuthMethod} />
      )}
      {step === STEPS.CONFIG && (
        <ConfigStep
          connectionName={connectionName}
          onConnectionNameChange={setConnectionName}
        />
      )}
      {step === STEPS.ADMIN_APPROVAL && selectedAccount && (
        <AdminApprovalStep
          account={selectedAccount}
          onAdminSignIn={() => goTo(STEPS.CONNECTING)}
          onUsePersonalAccount={() => {
            const personal = MOCK_GOOGLE_ACCOUNTS.find((a) => !a.requiresAdmin);
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
        <LoadingFilesStep connectionName={displayConnectionName} />
      )}
      {step === STEPS.FILE_PICKER && (
        <FilePickerStep
          connectionName={displayConnectionName}
          files={MOCK_GOOGLE_DRIVE_FILES}
          selectedIds={selectedFileIds}
          search={fileSearch}
          onSearchChange={setFileSearch}
          onToggleFile={handleToggleFile}
          onToggleAll={handleToggleAll}
        />
      )}

      {showSignInOverlay && (
        <SignInOverlay
          accounts={MOCK_GOOGLE_ACCOUNTS}
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
          const gd = connections.find((c) => c.provider === "google-drive");
          if (gd) handleSelectConnection(gd);
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
