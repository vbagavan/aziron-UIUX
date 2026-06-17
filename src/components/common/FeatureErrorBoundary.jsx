import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Scoped error boundary so one feature surface can fail without blanking the
 * whole app. Renders a recoverable fallback with a retry instead of the bare
 * app-level crash screen.
 */
export class FeatureErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {this.props.title ?? "This section ran into a problem"}
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {this.props.description ??
                "You can retry, or switch to another hub. The rest of the app is unaffected."}
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
