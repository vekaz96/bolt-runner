import { Component, type ErrorInfo, type ReactNode } from "react";
import { report } from "./telemetry";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class BootError extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
    report("crash", `${error.message}\n${info.componentStack ?? ""}`);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100dvh",
          padding: 24,
          color: "#fecaca",
          background: "#052e16",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ color: "#f87171", fontSize: 20, marginBottom: 12 }}>
          Bolt Runner failed to start
        </h1>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 12,
            color: "#fca5a5",
          }}
        >
          {this.state.error.message}
        </pre>
      </div>
    );
  }
}
