"use client";

import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 24px",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <AlertTriangle size={48} style={{ color: "var(--danger)" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "400px" }}>
            {this.props.fallback || "An unexpected error occurred. Please try again."}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
