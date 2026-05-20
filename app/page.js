"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loading from "@/components/Loading";
import { FolderKanban, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <Loading fullPage />;
  }

  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 50%, #111522 0%, #050609 100%)",
        padding: "20px",
        textAlign: "center"
      }}
    >
      <div 
        className="animate-fade-in" 
        style={{ 
          maxWidth: "600px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: "24px" 
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)" }}>
          <FolderKanban size={48} />
          <span style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-0.03em" }}>AETHERIA</span>
        </div>

        {/* Hero Copy */}
        <h1 
          style={{ 
            fontSize: "2.5rem", 
            fontWeight: "800", 
            lineHeight: "1.2",
            background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          Streamline Projects, Tasks, and Team Collaborations
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: "1.6" }}>
          A premium, high-performance task management workspace built for agile development teams. Design boards, assign issues, and track milestones with real-time feedback.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
          <Link href="/login" className="btn btn-secondary" style={{ padding: "12px 24px" }}>
            Sign In
          </Link>
          <Link href="/signup" className="btn btn-primary" style={{ padding: "12px 24px" }}>
            Get Started
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
