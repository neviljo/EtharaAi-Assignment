"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/auth.module.css";
import { AlertCircle, FolderKanban, Loader2 } from "lucide-react";
import Loading from "@/components/Loading";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading || (user && !submitting)) {
    return <Loading fullPage />;
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.authCard} animate-fade-in`}>
        <div className={styles.header}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "16px", color: "var(--primary)" }}>
            <FolderKanban size={32} />
            <span style={{ fontSize: "1.5rem", fontWeight: "800", letterSpacing: "-0.025em" }}>AETHERIA</span>
          </div>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Log in to manage your team workspaces</p>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              disabled={submitting}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: "100%", padding: "12px", marginTop: "8px" }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Don't have an account?
          <Link href="/signup" className={styles.link}>
            Create one free
          </Link>
        </div>
      </div>
    </div>
  );
}
