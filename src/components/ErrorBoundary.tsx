import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep this console output: it helps diagnose production-only crashes.
    console.error("[ErrorBoundary] Uncaught error:", error);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-xl font-display">Se produjo un error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La web encontró un error inesperado. Puedes volver al inicio o recargar.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/">Ir al inicio</Link>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Recargar
              </Button>
            </div>

            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Detalles técnicos</summary>
              <pre className="mt-3 whitespace-pre-wrap break-words">
                {this.state.error?.message}
              </pre>
            </details>
          </CardContent>
        </Card>
      </main>
    );
  }
}
