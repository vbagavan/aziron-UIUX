import { Component } from "react";
import { BrowserRouter } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FlowCatalogProvider } from "@/context/FlowCatalogContext";
import LoginPage from "@/components/pages/LoginPage";
import AppRoutes from "@/AppRoutes";

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) {
    return { error: e };
  }
  render() {
    if (this.state.error)
      return (
        <div className="whitespace-pre-wrap bg-destructive/10 p-10 font-mono text-sm text-destructive">
          <strong>LoginPage Error:</strong>
          {"\n"}
          {this.state.error?.message}
          {"\n\n"}
          {this.state.error?.stack}
        </div>
      );
    return this.props.children;
  }
}

function AppInner() {
  const { auth } = useAuth();
  if (!auth.isAuthenticated)
    return (
      <ErrorBoundary>
        <LoginPage />
      </ErrorBoundary>
    );
  return (
    <SidebarProvider defaultOpen={false}>
      <FlowCatalogProvider>
        <AppRoutes />
      </FlowCatalogProvider>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}
