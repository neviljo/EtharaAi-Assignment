"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/auth.module.css";
import { AlertCircle, FolderKanban, Loader2 } from "lucide-react";
import Loading from "@/components/Loading";

export default function SignupPage() {
  const { user, signup, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
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
    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await signup(name, email, password);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.subtitle}>Get started with a team workspace today</p>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={submitting}
            />
          </div>

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
              placeholder="Must be at least 6 chars"
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
                Creating Account...
              </>
            ) : (
              "Register"
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account?
          <Link href="/login" className={styles.link}>
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
