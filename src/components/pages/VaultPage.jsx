import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { VaultSecretDialog } from "@/components/features/vault/VaultSecretDialog";
import { cn } from "@/lib/utils";
import { TOOLBAR_CONTROL_CLASS } from "@/lib/listToolbar";
import { usePermissions } from "@/hooks/usePermissions";
import { useVault } from "@/context/VaultContext";
import {
  filterVaultSecrets,
  formatVaultDate,
  getVaultReferenceId,
  maskSecretValue,
  sortVaultSecrets,
  VAULT_SCOPE_LABELS,
  VAULT_SORT_OPTIONS,
} from "@/data/vaultSecrets";

const REVEAL_AUTO_HIDE_MS = 60_000;
const ICON_SM = 14;
const ICON_XS = 13;
const ICON_MENU = 13;

function vaultKeyToast(keyName, suffix) {
  return (
    <>
      <code className="font-mono font-semibold">{keyName}</code>
      {suffix}
    </>
  );
}

function SecretValueCell({ value, secretId, onCopyToast, hideSignal }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
  }, [hideSignal]);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setTimeout(() => setVisible(false), REVEAL_AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  async function handleCopy() {
    if (!visible) return;
    try {
      await navigator.clipboard.writeText(value);
      onCopyToast("Copied to clipboard. Clear it when you're done.");
    } catch {
      onCopyToast("Could not copy secret.");
    }
  }

  return (
    <div className="flex min-w-[220px] items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Hide secret value" : "Show secret value"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={ICON_XS} /> : <Eye size={ICON_XS} />}
      </Button>
      <span className="flex-1 truncate font-mono text-sm text-muted-foreground">
        {maskSecretValue(value, visible)}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={!visible}
              onClick={handleCopy}
              aria-label={`Copy ${secretId} secret`}
            >
              <Copy size={ICON_XS} />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {visible ? "Copy secret value" : "Show the value before copying"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function VaultEmptyState({ onAdd, canCreate, filtered }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16">
      <h2 className="text-base font-semibold text-foreground">
        {filtered ? "No matching secrets" : "No secrets yet"}
      </h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {filtered
          ? "Try a different search term or clear the filter."
          : "Add your first API key or credential. You'll reference it in agents and workflows as a variable—never in plain text."}
      </p>
      {canCreate && !filtered ? (
        <Button type="button" size="sm" className="gap-1.5" onClick={onAdd}>
          <Plus size={16} data-icon="inline-start" />
          Add your first secret
        </Button>
      ) : null}
      {!canCreate && !filtered ? (
        <p className="text-xs text-muted-foreground">You have view-only access to Vault.</p>
      ) : null}
    </div>
  );
}

function VaultRowActionMenu({
  openMenu,
  menuRef,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onClose,
}) {
  const editRef = useRef(null);
  const deleteRef = useRef(null);
  const items = useMemo(() => {
    const list = [];
    if (canEdit) list.push({ id: "edit", ref: editRef, label: "Edit", onClick: onEdit });
    if (canDelete) {
      list.push({ id: "delete", ref: deleteRef, label: "Delete", onClick: onDelete, destructive: true });
    }
    return list;
  }, [canEdit, canDelete, onEdit, onDelete]);

  useEffect(() => {
    if (!openMenu || items.length === 0) return;
    items[0].ref.current?.focus();
  }, [openMenu, items]);

  function handleKeyDown(e) {
    const currentIndex = items.findIndex((item) => item.ref.current === document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[(currentIndex + 1) % items.length];
      next.ref.current?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = items[(currentIndex - 1 + items.length) % items.length];
      prev.ref.current?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0].ref.current?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1].ref.current?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  if (!openMenu) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[9999] w-40 rounded-lg border border-border bg-popover py-1 shadow-md ring-1 ring-foreground/10"
      style={{ top: openMenu.top, left: openMenu.left }}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
    >
      {canEdit ? (
        <button
          ref={editRef}
          type="button"
          role="menuitem"
          className="flex h-8 w-full items-center gap-2 px-3 text-sm font-normal hover:bg-muted [&_svg]:pointer-events-none [&_svg]:shrink-0"
          onClick={() => {
            onClose();
            onEdit();
          }}
        >
          <Pencil size={ICON_MENU} />
          Edit
        </button>
      ) : null}
      {canDelete ? (
        <button
          ref={deleteRef}
          type="button"
          role="menuitem"
          className="flex h-8 w-full items-center gap-2 px-3 text-sm font-normal text-destructive hover:bg-muted [&_svg]:pointer-events-none [&_svg]:shrink-0"
          onClick={() => {
            onClose();
            onDelete();
          }}
        >
          <Trash2 size={ICON_MENU} />
          Delete
        </button>
      ) : null}
    </div>,
    document.body,
  );
}

function VaultSecretsTable({
  secrets,
  canEdit,
  canDelete,
  onEditRequest,
  onDeleteRequest,
  onCopyToast,
  hideValuesSignal,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return;
    function onPointer(e) {
      if (menuRef.current?.contains(e.target)) return;
      if (triggerRef.current?.contains(e.target)) return;
      setOpenMenu(null);
    }
    function onScroll() {
      setOpenMenu(null);
    }
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [openMenu]);

  function toggleMenu(secret, buttonEl) {
    if (openMenu?.id === secret.id) {
      setOpenMenu(null);
      return;
    }
    triggerRef.current = buttonEl;
    const rect = buttonEl.getBoundingClientRect();
    setOpenMenu({
      id: secret.id,
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - 160),
    });
  }

  const activeSecret = openMenu ? secrets.find((s) => s.id === openMenu.id) : null;

  return (
  <>
    <div className="rounded-lg border border-border bg-card">
      <Table className="min-w-[1040px]">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Key name</TableHead>
            <TableHead className="min-w-[260px]">Value</TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Reference ID
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="About reference IDs"
                    >
                      <HelpCircle size={ICON_SM} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Paste this variable into agent or workflow configs—for example,{" "}
                    <code className="font-mono">{`{{OPENAI_API_KEY}}`}</code>
                  </TooltipContent>
                </Tooltip>
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Scope
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="About scope"
                    >
                      <HelpCircle size={ICON_SM} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Where this secret can be used in your workspace.
                  </TooltipContent>
                </Tooltip>
              </span>
            </TableHead>
            <TableHead>Created on</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {secrets.map((secret) => (
            <TableRow key={secret.id}>
              <TableCell>
                <span className="font-medium text-foreground">{secret.keyName}</span>
              </TableCell>
              <TableCell>
                <SecretValueCell
                  value={secret.value}
                  secretId={secret.keyName}
                  onCopyToast={onCopyToast}
                  hideSignal={hideValuesSignal}
                />
              </TableCell>
              <TableCell>
                <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {getVaultReferenceId(secret.keyName)}
                </code>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {VAULT_SCOPE_LABELS[secret.secretType] ?? secret.secretType}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <time dateTime={secret.createdOn} title={secret.createdOn}>
                  {formatVaultDate(secret.createdOn)}
                </time>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <time
                  dateTime={secret.updatedOn ?? secret.createdOn}
                  title={secret.updatedOn ?? secret.createdOn}
                >
                  {formatVaultDate(secret.updatedOn ?? secret.createdOn)}
                </time>
              </TableCell>
              <TableCell>
                {(canEdit || canDelete) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(secret, e.currentTarget);
                    }}
                    aria-label={`Actions for ${secret.keyName}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenu?.id === secret.id}
                  >
                    <MoreHorizontal size={ICON_SM} />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        {secrets.length} secret{secrets.length === 1 ? "" : "s"}
      </div>
    </div>

    <VaultRowActionMenu
      openMenu={openMenu}
      menuRef={menuRef}
      canEdit={canEdit}
      canDelete={canDelete}
      onClose={() => setOpenMenu(null)}
      onEdit={() => activeSecret && onEditRequest(activeSecret)}
      onDelete={() => activeSecret && onDeleteRequest(activeSecret)}
    />
  </>
  );
}

export default function VaultPage({ onNavigate }) {
  const { can } = usePermissions();
  const canCreate = can("vault.create");
  const canEdit = can("vault.create");
  const canDelete = can("vault.delete");
  const { secrets, saveFailed, addSecret, updateSecret, deleteSecret, restoreSecret } = useVault();
  const { toasts, showToast, dismissToast } = useToast();

  const [listSearch, setListSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingSecret, setEditingSecret] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [hideValuesSignal, setHideValuesSignal] = useState(0);
  const prevSaveFailed = useRef(false);

  const filteredSorted = useMemo(() => {
    const filtered = filterVaultSecrets(secrets, listSearch);
    return sortVaultSecrets(filtered, sortBy);
  }, [secrets, listSearch, sortBy]);

  const isEmpty = secrets.length === 0;
  const isFilteredEmpty = !isEmpty && filteredSorted.length === 0;

  useEffect(() => {
    if (saveFailed && !prevSaveFailed.current) {
      showToast("Couldn't save your changes. Check browser storage settings and try again.");
    }
    prevSaveFailed.current = saveFailed;
  }, [saveFailed, showToast]);

  function openCreateDialog() {
    setHideValuesSignal((n) => n + 1);
    setDialogMode("create");
    setEditingSecret(null);
    setDialogOpen(true);
  }

  function openEditDialog(secret) {
    setHideValuesSignal((n) => n + 1);
    setDialogMode("edit");
    setEditingSecret(secret);
    setDialogOpen(true);
  }

  function handleDialogSubmit(payload) {
    if (payload.mode === "create") {
      const created = addSecret({
        keyName: payload.keyName,
        value: payload.value,
        secretType: payload.secretType,
      });
      showToast(vaultKeyToast(created.keyName, " added to Vault."));
      return;
    }
    updateSecret(payload.secretId, {
      secretType: payload.secretType,
      value: payload.value,
    });
    showToast(vaultKeyToast(payload.keyName, " updated."));
  }

  function handleDeleteConfirm() {
    if (!confirmDelete) return;
    const removed = deleteSecret(confirmDelete.id);
    showToast(vaultKeyToast(confirmDelete.keyName, " removed from Vault."), {
      actionLabel: "Undo",
      onAction: () => {
        if (removed) restoreSecret(removed);
      },
    });
    setConfirmDelete(null);
  }

  return (
    <TooltipProvider>
      <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
        <Sidebar activePage="vault" onNavigate={onNavigate} />

        <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
          <AppHeader onNavigate={onNavigate} />

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 px-6 py-4">
              <PageHeader
                title="Vault"
                description="Store API keys and credentials in one place. Reference them in agents and workflows—without putting secrets in code."
              >
                {!isEmpty ? (
                  <>
                    <div className="relative h-8 w-[220px]">
                      <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                      <Input
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                        placeholder="Search secrets…"
                        aria-label="Search Vault secrets"
                        className={cn(
                          TOOLBAR_CONTROL_CLASS,
                          "min-h-8 max-h-8 w-full py-0 pl-8 pr-8",
                        )}
                      />
                      {listSearch ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setListSearch("")}
                          aria-label="Clear search"
                          className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
                        >
                          <X size={ICON_XS} />
                        </Button>
                      ) : null}
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger
                        className={cn(TOOLBAR_CONTROL_CLASS, "w-[180px] py-0")}
                        aria-label="Sort Vault secrets"
                      >
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {VAULT_SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </>
                ) : null}
                {canCreate && !isEmpty ? (
                  <Button
                    type="button"
                    className={cn(TOOLBAR_CONTROL_CLASS, "gap-1.5 px-3")}
                    onClick={openCreateDialog}
                  >
                    <Plus size={16} data-icon="inline-start" />
                    Add secret
                  </Button>
                ) : null}
              </PageHeader>

              {isEmpty ? (
                <VaultEmptyState onAdd={openCreateDialog} canCreate={canCreate} filtered={false} />
              ) : isFilteredEmpty ? (
                <VaultEmptyState onAdd={openCreateDialog} canCreate={canCreate} filtered />
              ) : (
                <VaultSecretsTable
                  secrets={filteredSorted}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEditRequest={openEditDialog}
                  onDeleteRequest={setConfirmDelete}
                  onCopyToast={showToast}
                  hideValuesSignal={hideValuesSignal}
                />
              )}
            </div>
          </div>
        </div>

        <VaultSecretDialog
          open={dialogOpen}
          mode={dialogMode}
          secret={editingSecret}
          existingSecrets={secrets}
          onOpenChange={(open) => {
            if (open) setHideValuesSignal((n) => n + 1);
            setDialogOpen(open);
          }}
          onSubmit={handleDialogSubmit}
        />

        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            actionLabel={t.actionLabel}
            onAction={t.onAction}
            onDismiss={() => dismissToast(t.id)}
          />
        ))}

        {confirmDelete ? (
          <ConfirmDialog
            title={`Delete ${confirmDelete.keyName}?`}
            message={`This removes the secret from Vault. Anything using ${getVaultReferenceId(confirmDelete.keyName)} may stop working until you add a replacement.`}
            confirmLabel="Delete secret"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setConfirmDelete(null)}
          />
        ) : null}
      </div>
    </TooltipProvider>
  );
}
