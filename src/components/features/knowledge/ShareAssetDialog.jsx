import { useMemo, useState } from "react";
import { Building2, Check, Link2, Search, Share2, Users, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { assetTypeLabel } from "@/data/knowledgeHubs";
import { HUB_SHARE_DIRECTORY, sharePrincipalInitials } from "@/components/features/knowledge/shareDirectory";

function PrincipalIcon({ type, name }) {
  if (type === "user") {
    return (
      <Avatar className="size-7">
        <AvatarFallback className="text-[10px]">{sharePrincipalInitials(name)}</AvatarFallback>
      </Avatar>
    );
  }
  const Icon = type === "team" ? Users : Building2;
  return (
    <span className="flex size-7 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground">
      <Icon className="size-3.5" />
    </span>
  );
}

export function buildHubAssetShareLink(hubId, assetId) {
  if (!hubId || !assetId) return window.location.href;
  const url = new URL(`${window.location.origin}/knowledge/${hubId}`);
  url.searchParams.set("tab", "studio");
  url.searchParams.set("asset", assetId);
  return url.toString();
}

export function ShareAssetDialog({
  open,
  onOpenChange,
  asset,
  hubId,
  hubName,
  onShared,
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const selectedKeys = useMemo(
    () =>
      new Set(
        selected.map((s) =>
          s.principalType === "user"
            ? `user:${(s.email ?? "").toLowerCase()}`
            : `${s.principalType}:${(s.name ?? "").toLowerCase()}`,
        ),
      ),
    [selected],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HUB_SHARE_DIRECTORY.filter((entry) => {
      const key =
        entry.principalType === "user"
          ? `user:${(entry.email ?? "").toLowerCase()}`
          : `${entry.principalType}:${entry.name.toLowerCase()}`;
      if (selectedKeys.has(key)) return false;
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        (entry.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, selectedKeys]);

  function reset() {
    setSelected([]);
    setQuery("");
    setMessage("");
    setLinkCopied(false);
  }

  function handleClose(next) {
    if (!next) reset();
    onOpenChange(next);
  }

  function addPrincipal(entry) {
    setSelected((prev) => [...prev, entry]);
    setQuery("");
  }

  function removePrincipal(entry) {
    setSelected((prev) => prev.filter((s) => s !== entry));
  }

  function handleCopyLink() {
    const link = buildHubAssetShareLink(hubId, asset?.id);
    navigator.clipboard.writeText(link).catch(() => {});
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleNativeShare() {
    const content = asset?.body ?? asset?.excerpt ?? "";
    const link = buildHubAssetShareLink(hubId, asset?.id);
    const payload = {
      title: asset?.title ?? "Knowledge Hub asset",
      text: `${asset?.title ?? "Asset"} from ${hubName ?? "Knowledge Hub"}\n\n${message.trim() ? `${message.trim()}\n\n` : ""}${content.slice(0, 500)}${content.length > 500 ? "…" : ""}\n\n${link}`,
      url: link,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        onShared?.({ type: "native" });
        handleClose(false);
      }
    } catch {
      /* user cancelled */
    }
  }

  function handleSend() {
    if (selected.length === 0) return;
    const names = selected.map((s) => s.name).join(", ");
    onShared?.({
      type: "recipients",
      recipients: selected,
      message: message.trim(),
      names,
      link: buildHubAssetShareLink(hubId, asset?.id),
    });
    reset();
    onOpenChange(false);
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>Share asset</DialogTitle>
          <DialogDescription>
            Send{" "}
            <span className="font-medium text-foreground">
              {asset?.title ?? "this asset"}
            </span>
            {hubName ? ` from ${hubName}` : ""}. Recipients with hub access can open it in Studio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{assetTypeLabel(asset?.type)}</span>
            {" · "}
            {asset?.createdByName ?? "Team member"}
          </div>

          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((s, i) => (
                <span
                  key={`${s.name}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-0.5 pl-1 pr-1.5 text-xs"
                >
                  <PrincipalIcon type={s.principalType} name={s.name} />
                  <span className="max-w-[140px] truncate font-medium">{s.name}</span>
                  <button
                    type="button"
                    onClick={() => removePrincipal(s)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${s.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, teams, or departments…"
              className="h-9 pl-8"
            />
          </div>

          <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {query.trim() ? "No matches." : "Search to add recipients."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {results.map((entry) => (
                  <li key={entry.email ?? entry.name}>
                    <button
                      type="button"
                      onClick={() => addPrincipal(entry)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                    >
                      <PrincipalIcon type={entry.principalType} name={entry.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{entry.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {entry.principalType === "user"
                            ? entry.email
                            : `${entry.memberCount} member${entry.memberCount === 1 ? "" : "s"}`}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="share-asset-message" className="text-xs font-medium text-foreground">
              Message <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="share-asset-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note for recipients…"
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-muted/30 px-6 py-4 dark:bg-muted/20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleCopyLink}>
                {linkCopied ? <Check className="size-3.5 text-emerald-600" /> : <Link2 className="size-3.5" />}
                {linkCopied ? "Link copied" : "Copy link"}
              </Button>
              {canNativeShare ? (
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleNativeShare}>
                  <Share2 className="size-3.5" />
                  System share
                </Button>
              ) : null}
            </div>
            <Button type="button" size="sm" disabled={selected.length === 0} onClick={handleSend}>
              {selected.length > 0 ? `Share with ${selected.length}` : "Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
