import { useState } from "react";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_SOURCE_CONNECTORS } from "@/lib/sourceCategories";
import { cn } from "@/lib/utils";

export function AddApiSourcePanel({ onAddApiSource, onConnectProvider }) {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [auth, setAuth] = useState("bearer");
  const [refresh, setRefresh] = useState("6h");
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  function handlePreview() {
    if (!url.trim()) return;
    setPreviewing(true);
    setPreview(null);
    window.setTimeout(() => {
      setPreview({ items: 240, sizeKb: 14 });
      setPreviewing(false);
    }, 800);
  }

  function handleAdd() {
    if (!url.trim()) return;
    onAddApiSource?.({
      method,
      url: url.trim(),
      auth,
      refreshCadence: refresh,
      itemCount: preview?.items ?? null,
      responseSizeKb: preview?.sizeKb ?? null,
      category: "apis",
      kind: "rest-graphql",
      provider: "rest",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Configure an endpoint — the response becomes a source record agents can query.
      </p>

      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quick connect
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {API_SOURCE_CONNECTORS.map((connector) => (
            <Button
              key={connector.id}
              type="button"
              variant="outline"
              disabled={!connector.enabled}
              className={cn(
                "flex h-auto flex-col items-center gap-2 p-3",
                !connector.enabled && "opacity-60",
              )}
              onClick={() => connector.enabled && onConnectProvider?.(connector.id)}
            >
              <Zap className="size-8 text-muted-foreground" aria-hidden />
              <span className="min-w-0 w-full truncate text-center text-xs font-semibold">
                {connector.label}
              </span>
              {!connector.enabled ? (
                <Badge variant="outline" className="text-[10px]">
                  Soon
                </Badge>
              ) : null}
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Connect API
        </p>

        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="api-method" className="text-xs">
              Method
            </Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="api-method" className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["GET", "POST", "PUT", "PATCH"].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="api-url" className="text-xs">
              URL
            </Label>
            <Input
              id="api-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/v1/tickets"
              className="h-9"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="api-auth" className="text-xs">
              Auth
            </Label>
            <Select value={auth} onValueChange={setAuth}>
              <SelectTrigger id="api-auth" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="bearer">Bearer token</SelectItem>
                <SelectItem value="api-key">API key header</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="api-refresh" className="text-xs">
              Refresh
            </Label>
            <Select value={refresh} onValueChange={setRefresh}>
              <SelectTrigger id="api-refresh" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Every 1h</SelectItem>
                <SelectItem value="6h">Every 6h</SelectItem>
                <SelectItem value="24h">Every 24h</SelectItem>
                <SelectItem value="manual">Manual only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!url.trim() || previewing}
            onClick={handlePreview}
          >
            {previewing ? "Previewing…" : "Preview response"}
          </Button>
          {preview ? (
            <p className="text-xs text-muted-foreground">
              {preview.items.toLocaleString()} items · {preview.sizeKb} KB
            </p>
          ) : null}
        </div>

        <Button type="button" size="sm" className="w-full sm:w-auto" disabled={!url.trim()} onClick={handleAdd}>
          Add as source
        </Button>
      </section>
    </div>
  );
}
